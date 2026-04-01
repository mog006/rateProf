/**
 * YÖK Akademik scraper — Puppeteer ile tüm üniversitelerin hocalarını çeker
 * Kullanım: npx ts-node-dev --transpile-only src/db/scrape-professors.ts
 *
 * Özellikler:
 *  - Otomatik pagination (her sayfa 20 kayıt)
 *  - İlerleme kaydeder → kesintide kaldığı yerden devam eder
 *  - Fakülte + bölüm otomatik oluşturur
 *  - Rate limiting (sayfa arası 1.2s, üniversite arası 2s)
 */

import { initDb, getDb } from './database';
import * as fs from 'fs';
import * as path from 'path';

// ── Ayarlar ──────────────────────────────────────────────────────────────────
const PROGRESS_FILE = path.join(__dirname, '../../data/scrape-progress.json');
const PAGE_DELAY_MS = 1200;   // sayfa arası bekleme
const UNI_DELAY_MS  = 2000;   // üniversite arası bekleme
const MAX_PAGES_PER_UNI = 999; // limit koymak istersen düşür (test için 2 yap)

// ── Unvan dönüşümü ────────────────────────────────────────────────────────────
const TITLE_MAP: Record<string, string> = {
  'PROFESÖR':               'Prof. Dr.',
  'DOÇENT':                 'Doç. Dr.',
  'DR. ÖĞRETİM ÜYESİ':     'Dr. Öğr. Üyesi',
  'ARAŞTIRMA GÖREVLİSİ DR.':'Arş. Gör. Dr.',
  'ARAŞTIRMA GÖREVLİSİ':   'Arş. Gör.',
  'ÖĞRETİM GÖREVLİSİ DR.': 'Öğr. Gör. Dr.',
  'ÖĞRETİM GÖREVLİSİ':     'Öğr. Gör.',
  'UZMAN':                  'Uzman',
};

function parseTitle(raw: string): string {
  const upper = raw.toUpperCase().trim();
  for (const [key, val] of Object.entries(TITLE_MAP)) {
    if (upper.startsWith(key)) return val;
  }
  return raw.trim();
}

// ── Satırı parse et ───────────────────────────────────────────────────────────
interface ProfRow {
  title: string;
  name: string;
  facultyName: string;
  deptName: string;
  email: string;
}

function parseRow(cell0: string, cell1: string): ProfRow | null {
  const lines = cell0.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;

  const title = parseTitle(lines[0]);
  const name  = lines[1];

  // "ÜNİV/FAKÜLTE/BÖLÜM/ANABİLİM DALI/"
  const pathLine = lines[2] || '';
  const parts = pathLine.split('/').map(p => p.trim()).filter(Boolean);
  // parts[0] = üniversite, parts[1] = fakülte, parts[2] = bölüm
  const facultyName = parts[1] || '';
  const deptName    = parts[2] || '';

  const email = (cell1 || '').replace('[at]', '@').trim();

  return { title, name, facultyName, deptName, email };
}

// ── İlerleme ──────────────────────────────────────────────────────────────────
function loadProgress(): Set<string> {
  try {
    const raw = fs.readFileSync(PROGRESS_FILE, 'utf8');
    return new Set(JSON.parse(raw));
  } catch { return new Set(); }
}

function saveProgress(done: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...done]));
}

// ── Ana fonksiyon ─────────────────────────────────────────────────────────────
async function main() {
  // Önce DB'ye migration uygula (faculties tablosu + faculty_id kolonu)
  console.log('🔄 Veritabanı başlatılıyor...');
  await initDb();
  const db = getDb();

  // Migration: mevcut departments tablosuna faculty_id ekle (yoksa)
  try {
    db.exec('ALTER TABLE departments ADD COLUMN faculty_id INTEGER');
    console.log('✅ departments.faculty_id kolonu eklendi');
  } catch { /* zaten var */ }

  // DB'deki üniversiteleri yükle (isim → id eşleşmesi için)
  const dbUnis = db.prepare('SELECT id, name FROM universities').all() as { id: number; name: string }[];
  const uniMap = new Map<string, number>();
  for (const u of dbUnis) uniMap.set(u.name.trim().toUpperCase(), u.id);

  // Mevcut fakülteleri yükle (cache)
  const facCache = new Map<string, number>(); // "uniId:name" → id
  const deptCache = new Map<string, number>(); // "uniId:facId:name" → id

  const insertFac  = db.prepare('INSERT INTO faculties (university_id, name) VALUES (?, ?)');
  const insertDept = db.prepare('INSERT INTO departments (university_id, faculty_id, name) VALUES (?, ?, ?)');
  const insertProf = db.prepare(`
    INSERT OR IGNORE INTO professors (university_id, department_id, name, title, email)
    VALUES (?, ?, ?, ?, ?)
  `);
  const updateUniProfCount = db.prepare(
    'UPDATE universities SET num_professors = (SELECT COUNT(*) FROM professors WHERE university_id = ?) WHERE id = ?'
  );

  const doneSet = loadProgress();
  console.log(`📂 Daha önce tamamlanan: ${doneSet.size} üniversite`);

  // Puppeteer başlat
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(30000);

  // Üniversite listesini çek
  console.log('🌐 YÖK Akademik üniversite listesi yükleniyor...');
  await page.goto('https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp');
  await page.waitForSelector('tbody.searchable');

  const yokUnis: { name: string; islem: string }[] = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody.searchable tr');
    return Array.from(rows).map((row: any) => {
      const a = row.querySelector('td:first-child a');
      return {
        name: a?.textContent?.trim() || '',
        islem: a?.href?.match(/islem=([^&]+)/)?.[1] || '',
      };
    }).filter((u: any) => u.name && u.islem);
  });

  console.log(`📋 YÖK'te ${yokUnis.length} üniversite bulundu`);

  let totalProfs = 0;
  let uniCount = 0;

  for (const yokUni of yokUnis) {
    if (doneSet.has(yokUni.name)) {
      console.log(`  ⏭  Atlandı (zaten yapıldı): ${yokUni.name}`);
      continue;
    }

    // DB'de eşleşen üniversiteyi bul
    const uniId = uniMap.get(yokUni.name.trim().toUpperCase());
    if (!uniId) {
      console.log(`  ⚠  DB'de bulunamadı: ${yokUni.name}`);
      doneSet.add(yokUni.name);
      saveProgress(doneSet);
      continue;
    }

    uniCount++;
    console.log(`\n[${uniCount}/${yokUnis.length}] 🎓 ${yokUni.name} (DB id: ${uniId})`);

    try {
      // İlk sayfayı aç
      await page.goto(
        'https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=' + yokUni.islem,
        { waitUntil: 'domcontentloaded' }
      );
      await page.waitForSelector('body');

      let pageNum = 0;
      let uniProfs = 0;

      while (pageNum < MAX_PAGES_PER_UNI) {
        pageNum++;

        // Toplam sonuç sayısını al (sadece ilk sayfada)
        if (pageNum === 1) {
          const totalText: string = await page.evaluate(
            () => document.body.innerHTML.match(/(\d+) sonuç bulundu/)?.[0] || ''
          );
          console.log(`   📊 ${totalText}`);
        }

        // Satırları parse et
        // Tablo yapısı: td[0]=id, td[1]=foto, td[2]=bilgi, td[3]=email, td[4]=authorId
        const rows: string[][] = await page.evaluate(() => {
          const trs = document.querySelectorAll('table tbody tr');
          return Array.from(trs).map((tr: any) => {
            const cells = tr.querySelectorAll('td');
            return Array.from(cells).map((c: any) => c.innerText?.trim() || '');
          });
        });

        for (const row of rows) {
          const prof = parseRow(row[2] || '', row[3] || '');
          if (!prof || !prof.name) continue;

          // Fakülte kaydı
          let facId: number | null = null;
          if (prof.facultyName) {
            const facKey = `${uniId}:${prof.facultyName.toUpperCase()}`;
            if (!facCache.has(facKey)) {
              const existing = db.prepare(
                'SELECT id FROM faculties WHERE university_id = ? AND UPPER(name) = ?'
              ).get(uniId, prof.facultyName.toUpperCase()) as { id: number } | undefined;
              if (existing) {
                facCache.set(facKey, existing.id);
              } else {
                const r = insertFac.run(uniId, prof.facultyName);
                facCache.set(facKey, r.lastInsertRowid as number);
              }
            }
            facId = facCache.get(facKey)!;
          }

          // Bölüm kaydı
          let deptId: number | null = null;
          if (prof.deptName) {
            const deptKey = `${uniId}:${facId}:${prof.deptName.toUpperCase()}`;
            if (!deptCache.has(deptKey)) {
              const existing = db.prepare(
                'SELECT id FROM departments WHERE university_id = ? AND faculty_id IS ? AND UPPER(name) = ?'
              ).get(uniId, facId, prof.deptName.toUpperCase()) as { id: number } | undefined;
              if (existing) {
                deptCache.set(deptKey, existing.id);
              } else {
                const r = insertDept.run(uniId, facId, prof.deptName);
                deptCache.set(deptKey, r.lastInsertRowid as number);
              }
            }
            deptId = deptCache.get(deptKey)!;
          }

          // Hoca kaydı
          insertProf.run(uniId, deptId, prof.name, prof.title, prof.email || null);
          uniProfs++;
          totalProfs++;
        }

        // Sonraki sayfa var mı?
        const nextIslem: string | null = await page.evaluate(() => {
          const links = document.querySelectorAll('.pagination li');
          let activeFound = false;
          for (const li of Array.from(links)) {
            if ((li as any).classList.contains('active')) { activeFound = true; continue; }
            if (activeFound) {
              const a = li.querySelector('a');
              return a?.href?.match(/islem=([^&]+)/)?.[1] || null;
            }
          }
          return null;
        });

        if (!nextIslem) break;

        await new Promise(r => setTimeout(r, PAGE_DELAY_MS));
        await page.goto(
          'https://akademik.yok.gov.tr/AkademikArama/AramaFiltrele?islem=' + nextIslem,
          { waitUntil: 'domcontentloaded' }
        );
        await page.waitForSelector('body');
      }

      // Üniversite hoca sayısını güncelle
      updateUniProfCount.run(uniId, uniId);
      console.log(`   ✅ ${uniProfs} hoca eklendi`);

    } catch (err: any) {
      console.error(`   ❌ Hata: ${err.message}`);
    }

    doneSet.add(yokUni.name);
    saveProgress(doneSet);
    await new Promise(r => setTimeout(r, UNI_DELAY_MS));
  }

  await browser.close();

  console.log(`\n🎉 Tamamlandı!`);
  console.log(`   Toplam eklenen hoca: ${totalProfs}`);

  // İstatistik
  const stats = db.prepare(`
    SELECT COUNT(DISTINCT p.id) as profs,
           COUNT(DISTINCT f.id) as faculties,
           COUNT(DISTINCT d.id) as depts
    FROM professors p
    LEFT JOIN faculties f ON f.university_id = p.university_id
    LEFT JOIN departments d ON d.id = p.department_id
  `).get() as any;
  console.log(`   Fakülte: ${stats?.faculties}, Bölüm: ${stats?.depts}, Hoca: ${stats?.profs}`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

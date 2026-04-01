/**
 * YÖK isimleriyle DB isimlerini eşleştirir, sonra hocaları çeker.
 * Çalıştır: npx ts-node-dev --transpile-only src/db/match-and-rescrape.ts
 */

import { initDb, getDb } from './database';
import * as fs from 'fs';
import * as path from 'path';

const PROGRESS_FILE = path.join(__dirname, '../../data/scrape-progress.json');
const PAGE_DELAY_MS = 1200;
const UNI_DELAY_MS  = 2000;

const TITLE_MAP: Record<string, string> = {
  'PROFESÖR':               'Prof. Dr.',
  'DOÇENT':                 'Doç. Dr.',
  'DR. ÖĞRETİM ÜYESİ':     'Dr. Öğr. Üyesi',
  'DOKTOR ÖĞRETİM ÜYESİ':  'Dr. Öğr. Üyesi',
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

function parseRow(cell0: string, cell1: string) {
  const lines = cell0.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const title = parseTitle(lines[0]);
  const name  = lines[1];
  const parts = (lines[2] || '').split('/').map(p => p.trim()).filter(Boolean);
  const facultyName = parts[1] || '';
  const deptName    = parts[2] || '';
  const email = (cell1 || '').replace('[at]', '@').trim();
  return { title, name, facultyName, deptName, email };
}

// Basit benzerlik skoru: ortak kelime sayısı
function similarity(a: string, b: string): number {
  const wa = new Set(a.split(/\s+/).filter(w => w.length > 2));
  const wb = new Set(b.split(/\s+/).filter(w => w.length > 2));
  let common = 0;
  for (const w of wa) if (wb.has(w)) common++;
  return common / Math.max(wa.size, wb.size, 1);
}

function loadProgress(): Set<string> {
  try { return new Set(JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf8'))); }
  catch { return new Set(); }
}
function saveProgress(done: Set<string>) {
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify([...done]));
}

async function main() {
  console.log('🔄 DB başlatılıyor...');
  await initDb();
  const db = getDb();

  try { db.exec('ALTER TABLE departments ADD COLUMN faculty_id INTEGER'); } catch {}

  const dbUnis = db.prepare('SELECT id, name FROM universities').all() as { id: number; name: string }[];

  const facCache = new Map<string, number>();
  const deptCache = new Map<string, number>();

  const insertFac  = db.prepare('INSERT INTO faculties (university_id, name) VALUES (?, ?)');
  const insertDept = db.prepare('INSERT INTO departments (university_id, faculty_id, name) VALUES (?, ?, ?)');
  const insertProf = db.prepare(
    'INSERT OR IGNORE INTO professors (university_id, department_id, name, title, email) VALUES (?, ?, ?, ?, ?)'
  );
  const updateCount = db.prepare(
    'UPDATE universities SET num_professors = (SELECT COUNT(*) FROM professors WHERE university_id=?) WHERE id=?'
  );

  const doneSet = loadProgress();
  console.log(`📂 Zaten tamamlanan: ${doneSet.size}`);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setDefaultNavigationTimeout(30000);

  console.log('🌐 YÖK listesi yükleniyor...');
  await page.goto('https://akademik.yok.gov.tr/AkademikArama/view/universityListview.jsp');
  await page.waitForSelector('tbody.searchable');

  const yokUnis: { name: string; islem: string }[] = await page.evaluate(() => {
    const rows = document.querySelectorAll('tbody.searchable tr');
    return Array.from(rows).map((row: any) => {
      const a = row.querySelector('td:first-child a');
      return { name: a?.textContent?.trim() || '', islem: a?.href?.match(/islem=([^&]+)/)?.[1] || '' };
    }).filter((u: any) => u.name && u.islem);
  });

  console.log(`📋 YÖK'te ${yokUnis.length} üniversite`);

  // Eşleştirme tablosu: YÖK adı → DB id
  const matchMap = new Map<string, number>();
  const dbNamesUpper = dbUnis.map(u => ({ id: u.id, nameUpper: u.name.trim().toUpperCase() }));

  for (const yokUni of yokUnis) {
    const yokUpper = yokUni.name.trim().toUpperCase();

    // 1. Tam eşleşme
    const exact = dbNamesUpper.find(u => u.nameUpper === yokUpper);
    if (exact) { matchMap.set(yokUni.name, exact.id); continue; }

    // 2. DB adı YÖK adının içinde geçiyor mu?
    const contained = dbNamesUpper.find(u => yokUpper.includes(u.nameUpper) || u.nameUpper.includes(yokUpper));
    if (contained) { matchMap.set(yokUni.name, contained.id); continue; }

    // 3. Kelime benzerliği
    let best: { id: number; score: number } | null = null;
    for (const u of dbNamesUpper) {
      const score = similarity(yokUpper, u.nameUpper);
      if (!best || score > best.score) best = { id: u.id, score };
    }
    if (best && best.score >= 0.4) { matchMap.set(yokUni.name, best.id); }
  }

  console.log(`✅ ${matchMap.size}/${yokUnis.length} üniversite eşleştirildi`);

  let totalProfs = 0;
  let uniCount = 0;

  for (const yokUni of yokUnis) {
    if (doneSet.has(yokUni.name)) { continue; }

    const uniId = matchMap.get(yokUni.name);
    if (!uniId) {
      console.log(`  ⚠  Eşleşme yok: ${yokUni.name}`);
      doneSet.add(yokUni.name);
      saveProgress(doneSet);
      continue;
    }

    // Zaten hocaları olan üniversiteyi atla
    const existing = db.prepare('SELECT COUNT(*) as c FROM professors WHERE university_id = ?').get(uniId) as { c: number };
    if (existing && existing.c > 0) {
      console.log(`  ⏭  Atlandı (zaten ${existing.c} hoca var): ${yokUni.name}`);
      doneSet.add(yokUni.name);
      saveProgress(doneSet);
      continue;
    }

    uniCount++;
    console.log(`\n[${uniCount}] 🎓 ${yokUni.name} (DB id: ${uniId})`);

    try {
      await page.goto(
        'https://akademik.yok.gov.tr/AkademikArama/AkademisyenArama?islem=' + yokUni.islem,
        { waitUntil: 'domcontentloaded' }
      );
      await page.waitForSelector('body');

      let pageNum = 0;
      let uniProfs = 0;

      while (true) {
        pageNum++;
        if (pageNum === 1) {
          const totalText: string = await page.evaluate(
            () => document.body.innerHTML.match(/(\d+) sonuç bulundu/)?.[0] || ''
          );
          console.log(`   📊 ${totalText}`);
        }

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

          let facId: number | null = null;
          if (prof.facultyName) {
            const fk = `${uniId}:${prof.facultyName.toUpperCase()}`;
            if (!facCache.has(fk)) {
              const ex = db.prepare('SELECT id FROM faculties WHERE university_id=? AND UPPER(name)=?')
                .get(uniId, prof.facultyName.toUpperCase()) as { id: number } | undefined;
              facCache.set(fk, ex ? ex.id : (insertFac.run(uniId, prof.facultyName).lastInsertRowid as number));
            }
            facId = facCache.get(fk)!;
          }

          let deptId: number | null = null;
          if (prof.deptName) {
            const dk = `${uniId}:${facId}:${prof.deptName.toUpperCase()}`;
            if (!deptCache.has(dk)) {
              const ex = db.prepare('SELECT id FROM departments WHERE university_id=? AND faculty_id IS ? AND UPPER(name)=?')
                .get(uniId, facId, prof.deptName.toUpperCase()) as { id: number } | undefined;
              deptCache.set(dk, ex ? ex.id : (insertDept.run(uniId, facId, prof.deptName).lastInsertRowid as number));
            }
            deptId = deptCache.get(dk)!;
          }

          insertProf.run(uniId, deptId, prof.name, prof.title, prof.email || null);
          uniProfs++;
          totalProfs++;
        }

        const nextIslem: string | null = await page.evaluate(() => {
          const links = document.querySelectorAll('.pagination li');
          let activeFound = false;
          for (const li of Array.from(links)) {
            if ((li as any).classList.contains('active')) { activeFound = true; continue; }
            if (activeFound) { return (li.querySelector('a') as any)?.href?.match(/islem=([^&]+)/)?.[1] || null; }
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

      updateCount.run(uniId, uniId);
      console.log(`   ✅ ${uniProfs} hoca eklendi`);

    } catch (err: any) {
      console.error(`   ❌ Hata: ${err.message}`);
    }

    doneSet.add(yokUni.name);
    saveProgress(doneSet);
    await new Promise(r => setTimeout(r, UNI_DELAY_MS));
  }

  await browser.close();
  console.log(`\n🎉 Tamamlandı! Toplam eklenen: ${totalProfs}`);

  const stats = db.prepare('SELECT COUNT(*) c FROM professors').get() as any;
  console.log(`📊 DB toplam hoca: ${stats.c}`);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

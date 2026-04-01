/**
 * Gerçek Türk üniversite verilerini api.kadircolak.com'dan çekip DB'ye kaydeden seed scripti
 * Kullanım: npx ts-node-dev --transpile-only src/db/seed-from-api.ts
 */

import { initDb, getDb } from './database';
import https from 'https';

const BASE = 'https://api.kadircolak.com/Universite/JSON/API';

function fetchJson(url: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { resolve([]); }
      });
    }).on('error', () => resolve([]));
  });
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// Üniversite tipi tahmini (Devlet/Vakıf)
function guessType(name: string): 'devlet' | 'vakıf' {
  const vakifKeywords = [
    'ACIBADEM', 'ATILIM', 'BAHÇEŞEHİR', 'BAŞKENT', 'BEYKENt', 'BİLGİ', 'BİLKENT',
    'ÇANKAYA', 'HALİÇ', 'IŞIK', 'İSTANBUL BİLİM', 'İZMİR EKONOMİ', 'KADİR HAS',
    'KOÇ', 'MALTEPE', 'MEF', 'NİŞANTAŞI', 'OKAN', 'ÖZYEĞİN', 'SABANCI', 'TED',
    'TOBB', 'UFUK', 'YAŞAR', 'YEDİTEPE', 'YÜKSEK İHTİSAS', 'PIRI REİS',
    'İSTANBUL AREL', 'BEYKOZ', 'ALTINBAŞ', 'BİRUNİ', 'FATİH SULTAN MEHMET',
    'GELİŞİM', 'KENT', 'KİLİS 7 ARALIK', 'MEDİPOL', 'NUH NACİ YAZGAN',
    'ÖSTİM', 'SANKO', 'ÜSKÜDAR', 'İBN HALDUN', 'LOKMAN HEKİM'
  ];
  const upper = name.toUpperCase();
  for (const k of vakifKeywords) {
    if (upper.includes(k)) return 'vakıf';
  }
  return 'devlet';
}

// Şehir çıkarma (üniversite adından)
const SEHIR_MAP: Record<number, string> = {
  1: 'Kayseri', 2: 'İstanbul', 4: 'Adana', 5: 'Adıyaman', 6: 'Afyon',
  8: 'Ağrı', 9: 'Aksaray', 10: 'Amasya', 11: 'Ankara', 12: 'Antalya',
  13: 'Ardahan', 14: 'Artvin', 15: 'Aydın', 16: 'Balıkesir', 17: 'Bartın',
  18: 'Batman', 19: 'Bayburt', 20: 'Bilecik', 21: 'Bingöl', 22: 'Bitlis',
  23: 'Bolu', 24: 'Burdur', 25: 'Bursa', 26: 'Çanakkale', 27: 'Çankırı',
  28: 'Çorum', 29: 'Denizli', 30: 'Diyarbakır', 31: 'Düzce', 32: 'Edirne',
  33: 'Elazığ', 34: 'Erzincan', 35: 'Erzurum', 36: 'Eskişehir', 37: 'Gaziantep',
  38: 'Giresun', 39: 'Gümüşhane', 40: 'Hakkari', 41: 'Hatay', 42: 'Iğdır',
  43: 'Isparta', 44: 'İstanbul', 45: 'İzmir', 46: 'Kahramanmaraş', 47: 'Karabük',
  48: 'Karaman', 49: 'Kars', 50: 'Kastamonu', 51: 'İstanbul', 52: 'Kırıkkale',
  53: 'Kırklareli', 54: 'Kırşehir', 55: 'Kilis', 56: 'Kocaeli', 57: 'Konya',
  58: 'Kütahya', 59: 'Malatya', 60: 'Manisa', 61: 'Mardin', 62: 'Mersin',
  63: 'Muğla', 64: 'Muş', 65: 'Nevşehir', 66: 'Niğde', 67: 'Ordu',
  68: 'Osmaniye', 69: 'Rize', 70: 'Sakarya', 71: 'Samsun', 72: 'Siirt',
  73: 'Sinop', 74: 'Sivas', 75: 'Şanlıurfa', 76: 'Şırnak', 77: 'Tekirdağ',
  78: 'Tokat', 79: 'Trabzon', 80: 'Tunceli', 81: 'Uşak', 82: 'Van',
  83: 'Yalova', 84: 'Yozgat', 85: 'Zonguldak',
};

function guessCityFromName(name: string): string {
  const cityMap: Record<string, string> = {
    'ANKARA': 'Ankara', 'İSTANBUL': 'İstanbul', 'İZMİR': 'İzmir',
    'BURSA': 'Bursa', 'ANTALYA': 'Antalya', 'ADANA': 'Adana',
    'KOCAELİ': 'Kocaeli', 'KONYA': 'Konya', 'GAZİANTEP': 'Gaziantep',
    'TRABZON': 'Trabzon', 'SAMSUN': 'Samsun', 'ESKİŞEHİR': 'Eskişehir',
    'ERZURUM': 'Erzurum', 'DİYARBAKIR': 'Diyarbakır', 'MALATYA': 'Malatya',
    'KAHRAMANMARAŞ': 'Kahramanmaraş', 'KAYSERI': 'Kayseri', 'KAYSERİ': 'Kayseri',
    'BALIKESİR': 'Balıkesir', 'DENİZLİ': 'Denizli', 'SAKARYA': 'Sakarya',
    'MERSİN': 'Mersin', 'MUĞLA': 'Muğla', 'AFYON': 'Afyon',
    'EDİRNE': 'Edirne', 'ÇANAKKALE': 'Çanakkale', 'HATAY': 'Hatay',
    'ORDU': 'Ordu', 'GİRESUN': 'Giresun', 'KARABÜK': 'Karabük',
    'DÜZCE': 'Düzce', 'BARTINI': 'Bartın', 'BATMAN': 'Batman',
    'BOLU': 'Bolu', 'ISPARTA': 'Isparta', 'KIRIKKALE': 'Kırıkkale',
    'BOĞAZİÇİ': 'İstanbul', 'ORTA DOĞU': 'Ankara', 'BİLKENT': 'Ankara',
    'SABANCI': 'İstanbul', 'KOÇ': 'İstanbul', 'HACETTEPE': 'Ankara',
    'GAZİ': 'Ankara', 'YILDIZ': 'İstanbul', 'MARMARA': 'İstanbul',
    'CERRAHPAŞA': 'İstanbul', 'TRAKYA': 'Edirne', 'PAMUKKALE': 'Denizli',
    'EGE': 'İzmir', 'DOKUZ EYLÜL': 'İzmir', 'YAŞAR': 'İzmir',
    'İZMİR EKONOMİ': 'İzmir', 'ULUDAĞ': 'Bursa', 'OSMANGAZİ': 'Eskişehir',
    'ANADOLU': 'Eskişehir', 'SELÇUK': 'Konya', 'NECMETTİN ERBAKAN': 'Konya',
    'CUMHURİYET': 'Sivas', 'FIRAT': 'Elazığ', 'İNÖNÜ': 'Malatya',
    'DICLE': 'Diyarbakır', 'KARADENIZ': 'Trabzon', 'KARADENIZ TEKNİK': 'Trabzon',
  };
  const upper = name.toUpperCase();
  for (const [key, city] of Object.entries(cityMap)) {
    if (upper.includes(key)) return city;
  }
  return 'Türkiye';
}

const LOGO_COLORS: Record<number, string> = {
  179: '#E4002B',  // ODTÜ
  51: '#003DA5',   // Boğaziçi
  117: '#003D7C',  // İTÜ
  85: '#8B0000',   // Hacettepe
  11: '#CC0000',   // Ankara
  97: '#003366',   // Bilkent
  187: '#006633',  // Sabancı
  151: '#003087',  // Koç
  113: '#8B0000',  // İstanbul
  76: '#005B99',   // Ege
  59: '#006400',   // DEÜ
  77: '#8B008B',   // Gazi
  107: '#800000',  // Marmara
  218: '#CC6600',  // YTÜ
};

function getLogoColor(id: number, name: string): string {
  if (LOGO_COLORS[id]) return LOGO_COLORS[id];
  const colors = ['#1a56db', '#0e9f6e', '#c81e1e', '#6875f5', '#ff8800', '#057a55', '#1c64f2'];
  return colors[id % colors.length];
}

async function main() {
  console.log('\n🔄 Veritabanı başlatılıyor...');
  await initDb();
  const db = getDb();

  // Mevcut fake veriyi temizle
  console.log('🧹 Eski seed verisi temizleniyor...');
  db.prepare('DELETE FROM helpful_votes').run();
  db.prepare('DELETE FROM review_tags').run();
  db.prepare('DELETE FROM reviews').run();
  db.prepare('DELETE FROM courses').run();
  db.prepare('DELETE FROM professors').run();
  db.prepare('DELETE FROM departments').run();
  db.prepare('DELETE FROM universities').run();
  db.prepare('DELETE FROM users').run();
  // SQLite auto-increment sıfırla
  try { db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('universities','departments','professors','reviews','review_tags','courses')").run(); } catch {}

  // Tüm üniversiteleri çek
  console.log('\n📡 api.kadircolak.com\'dan üniversiteler çekiliyor...');
  const allUnis = await fetchJson(`${BASE}/AllUniversity`);
  console.log(`✅ ${allUnis.length} üniversite alındı`);

  // Öncelikli üniversiteler (tam fakülte/bölüm verileri çekilecek)
  const PRIORITY_IDS = [
    179, // ODTÜ
    51,  // Boğaziçi
    117, // İTÜ
    85,  // Hacettepe
    77,  // Gazi
    97,  // Bilkent
    187, // Sabancı
    151, // Koç
    113, // İstanbul
    76,  // Ege
    59,  // Dokuz Eylül
    107, // Marmara
    218, // Yıldız Teknik
    11,  // Ankara
    21,  // Atılım (Ankara)
    25,  // Anadolu
    36,  // Eskişehir Osmangazi
    100, // İstanbul 29 Mayıs (örnek)
    56,  // Çukurova
    75,  // Fırat
    74,  // Erzurum Atatürk
    79,  // Gaziantep
    27,  // Çanakkale 18 Mart
    106, // İstanbul Medeniyet
    143, // Kocaeli
  ];

  const insertUni = db.prepare(
    'INSERT INTO universities (name, short_name, city, type, logo_color, num_professors, num_ratings) VALUES (?, ?, ?, ?, ?, 0, 0)'
  );
  const insertDept = db.prepare(
    'INSERT INTO departments (university_id, name, short_name) VALUES (?, ?, ?)'
  );

  let insertedUnis = 0;
  let insertedDepts = 0;

  // Önce tüm üniversiteleri ekle (sadece isim)
  const uniIdMap: Record<number, number> = {}; // api_id -> db_id

  for (const uni of allUnis) {
    const shortName = uni.UNIVERSITY_NAME
      .replace(/ÜNİVERSİTESİ\s*$/i, '')
      .replace(/UNIVERSITY\s*$/i, '')
      .trim()
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .slice(0, 6)
      .toUpperCase();

    const city = guessCityFromName(uni.UNIVERSITY_NAME);
    const type = guessType(uni.UNIVERSITY_NAME);
    const color = getLogoColor(uni.ID, uni.UNIVERSITY_NAME);

    const r = insertUni.run(
      uni.UNIVERSITY_NAME.trim(),
      shortName || uni.UNIVERSITY_NAME.slice(0, 5),
      city,
      type,
      color
    );
    uniIdMap[uni.ID] = r.lastInsertRowid;
    insertedUnis++;
  }
  console.log(`✅ ${insertedUnis} üniversite veritabanına eklendi`);

  // Öncelikli üniversiteler için fakülte ve bölüm verisi çek
  console.log(`\n📡 ${PRIORITY_IDS.length} öncelikli üniversitenin fakülteleri çekiliyor...`);

  for (const apiId of PRIORITY_IDS) {
    const dbId = uniIdMap[apiId];
    if (!dbId) continue;

    const faculties = await fetchJson(`${BASE}/SelectUniversity?university_id=${apiId}`);
    await sleep(150); // Rate limit için

    if (!faculties.length) continue;

    const uniName = allUnis.find((u: any) => u.ID === apiId)?.UNIVERSITY_NAME || '';

    // Her fakülteyi department olarak ekle
    const facultyIdMap: Record<number, number> = {};
    for (const fac of faculties) {
      const shortFak = fac.FACULTY_NAME
        .replace(/Fakültesi/gi, 'Fak.')
        .replace(/Yüksekokulu/gi, 'YO')
        .replace(/Enstitüsü/gi, 'Ens.')
        .trim();

      const r = insertDept.run(dbId, fac.FACULTY_NAME.trim(), shortFak.slice(0, 30));
      facultyIdMap[fac.FACULTY_ID] = r.lastInsertRowid;
      insertedDepts++;
    }

    // Her fakülte için bölümleri çek
    for (const fac of faculties) {
      const programs = await fetchJson(`${BASE}/SelectFaculty?university_id=${apiId}&faculty_id=${fac.FACULTY_ID}`);
      await sleep(100);

      for (const prog of programs) {
        // Program adını temizle (burslu/ücretli varyantları kaldır)
        const progName = prog.PROGRAM_NAME
          .replace(/\s*\(Burslu\)/gi, '')
          .replace(/\s*\(%\d+\s*İndirimli\)/gi, '')
          .replace(/\s*\(Ücretli\)/gi, '')
          .replace(/\s*\(İÖ\)/gi, ' (İkinci Öğretim)')
          .replace(/\s*\(KKTC Uyruklu\)/gi, '')
          .trim();

        if (!progName) continue;

        // Aynı fakülteye aynı isimde bölüm varsa ekleme
        const existing = db.prepare(
          'SELECT id FROM departments WHERE university_id=? AND name=?'
        ).get(dbId, progName);
        if (existing) continue;

        insertDept.run(dbId, progName, progName.slice(0, 30));
        insertedDepts++;
      }
    }

    console.log(`  ✓ ${uniName.trim()} — ${faculties.length} fakülte`);
  }

  console.log(`\n✅ Toplam ${insertedDepts} fakülte/bölüm eklendi`);

  // İstatistikleri güncelle
  db.prepare('UPDATE universities SET num_professors = (SELECT COUNT(*) FROM professors WHERE university_id = universities.id)').run();

  console.log('\n✅ Gerçek üniversite verisi başarıyla yüklendi!');
  console.log(`📊 ${insertedUnis} üniversite | ${insertedDepts} fakülte/bölüm`);
  process.exit(0);
}

main().catch(e => { console.error('Hata:', e); process.exit(1); });

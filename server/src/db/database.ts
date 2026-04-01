import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '../../data/hocayi.db');

// ─── Wrapper to mimic better-sqlite3 synchronous API ─────────────────────────
class DbWrapper {
  private db: SqlJsDatabase;

  constructor(db: SqlJsDatabase) {
    this.db = db;
  }

  pragma(stmt: string) {
    try { this.db.run(`PRAGMA ${stmt}`); } catch {}
  }

  exec(sql: string) {
    this.db.run(sql);
    this._save();
  }

  private _save() {
    try {
      fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
      fs.writeFileSync(DB_PATH, Buffer.from(this.db.export()));
    } catch (e) {
      console.error('DB save error:', e);
    }
  }

  prepare(sql: string) {
    const isWrite = /^\s*(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i.test(sql);
    const db = this.db;
    const save = () => this._save();

    return {
      run: (...args: any[]): { lastInsertRowid: number; changes: number } => {
        const params = flatParams(args);
        try {
          db.run(sql, params as any);
        } catch (e) {
          console.error('SQL run error:', sql, params, e);
          throw e;
        }
        const changes = db.getRowsModified();
        const lid = db.exec('SELECT last_insert_rowid()');
        const lastInsertRowid = (lid[0]?.values[0]?.[0] as number) || 0;
        if (isWrite) save();
        return { lastInsertRowid, changes };
      },

      get: (...args: any[]): any | undefined => {
        const params = flatParams(args);
        const stmt = db.prepare(sql);
        try {
          stmt.bind(params as any);
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return undefined;
        } finally {
          stmt.free();
        }
      },

      all: (...args: any[]): any[] => {
        const params = flatParams(args);
        const stmt = db.prepare(sql);
        const rows: any[] = [];
        try {
          stmt.bind(params as any);
          while (stmt.step()) {
            rows.push(stmt.getAsObject());
          }
        } finally {
          stmt.free();
        }
        return rows;
      },
    };
  }
}

function flatParams(args: any[]): any[] {
  const params: any[] = [];
  for (const a of args) {
    if (Array.isArray(a)) params.push(...a);
    else params.push(a);
  }
  return params.map(v => (v === undefined ? null : v));
}

// ─── Singleton ─────────────────────────────────────────────────────────────
let _db: DbWrapper | null = null;

export function getDb(): DbWrapper {
  if (!_db) throw new Error('Database not initialized. Call initDb() first.');
  return _db;
}

export async function initDb(): Promise<void> {
  const SQL = await initSqlJs();
  let sqlDb: SqlJsDatabase;

  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    sqlDb = new SQL.Database(buf);
    console.log('📂 Mevcut veritabanı yüklendi');
  } else {
    sqlDb = new SQL.Database();
    console.log('🆕 Yeni veritabanı oluşturuldu');
  }

  _db = new DbWrapper(sqlDb);
  initializeSchema();
  // Fake seed sadece DB ilk kez oluşturulduğunda ve boşsa çalışır
  const uniCount = _db.prepare('SELECT COUNT(*) as c FROM universities').get() as { c: number };
  if (Number(uniCount?.c) === 0) {
    console.log('ℹ️  Veritabanı boş. Gerçek veri için: npm run seed');
  }
}

// ─── Schema ────────────────────────────────────────────────────────────────
function initializeSchema() {
  const db = getDb();
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      university_id INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS universities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      city TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      website TEXT,
      logo_color TEXT DEFAULT '#1a56db',
      num_professors INTEGER DEFAULT 0,
      num_ratings INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS faculties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_id INTEGER NOT NULL,
      external_id INTEGER,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS departments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_id INTEGER NOT NULL,
      faculty_id INTEGER,
      name TEXT NOT NULL,
      short_name TEXT
    );

    CREATE TABLE IF NOT EXISTS professors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_id INTEGER NOT NULL,
      department_id INTEGER,
      name TEXT NOT NULL,
      title TEXT DEFAULT 'Dr.',
      email TEXT,
      avg_rating REAL DEFAULT 0,
      difficulty REAL DEFAULT 0,
      would_take_again REAL DEFAULT 0,
      num_ratings INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      university_id INTEGER NOT NULL,
      department_id INTEGER,
      professor_id INTEGER,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      credits INTEGER DEFAULT 3,
      semester TEXT,
      year INTEGER,
      day TEXT,
      time_start TEXT,
      time_end TEXT,
      location TEXT
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      professor_id INTEGER NOT NULL,
      course_id INTEGER,
      overall_rating REAL NOT NULL,
      difficulty REAL NOT NULL,
      would_take_again INTEGER NOT NULL DEFAULT 0,
      comment TEXT NOT NULL,
      grade TEXT,
      attendance TEXT,
      textbook INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      helpful_count INTEGER DEFAULT 0,
      not_helpful_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS review_tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      tag TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS helpful_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      review_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      is_helpful INTEGER NOT NULL,
      UNIQUE(review_id, user_id)
    );
  `);
}

// ─── Seed ──────────────────────────────────────────────────────────────────
async function seedData() {
  const db = getDb();
  const count = db.prepare('SELECT COUNT(*) as c FROM universities').get() as { c: number };
  if (count && Number(count.c) > 0) return;

  const insertUniversity = db.prepare(
    'INSERT INTO universities (name, short_name, city, type, description, website, logo_color) VALUES (?, ?, ?, ?, ?, ?, ?)'
  );

  const universities = [
    ['Orta Doğu Teknik Üniversitesi', 'ODTÜ', 'Ankara', 'devlet', "Türkiye'nin en prestijli teknik üniversitelerinden biri.", 'https://www.metu.edu.tr', '#E4002B'],
    ['Boğaziçi Üniversitesi', 'BÜ', 'İstanbul', 'devlet', "İstanbul'un köklü devlet üniversitesi.", 'https://www.boun.edu.tr', '#003DA5'],
    ['İstanbul Teknik Üniversitesi', 'İTÜ', 'İstanbul', 'devlet', 'Mühendislik ve mimarlıkta dünyanın sayılı üniversitelerinden.', 'https://www.itu.edu.tr', '#003D7C'],
    ['Hacettepe Üniversitesi', 'HÜ', 'Ankara', 'devlet', 'Sağlık bilimleri ve sosyal bilimler alanında güçlü kadro.', 'https://www.hacettepe.edu.tr', '#8B0000'],
    ['Ankara Üniversitesi', 'AÜ', 'Ankara', 'devlet', "Cumhuriyet'in ilk üniversitesi.", 'https://www.ankara.edu.tr', '#CC0000'],
    ['Bilkent Üniversitesi', 'BİLKENT', 'Ankara', 'vakıf', "Türkiye'nin ilk vakıf üniversitesi.", 'https://www.bilkent.edu.tr', '#003366'],
    ['Sabancı Üniversitesi', 'SU', 'İstanbul', 'vakıf', 'Disiplinlerarası yaklaşımıyla öne çıkan vakıf üniversitesi.', 'https://www.sabanciuniv.edu', '#006633'],
    ['Koç Üniversitesi', 'KÜ', 'İstanbul', 'vakıf', 'Araştırma odaklı vakıf üniversitesi.', 'https://www.ku.edu.tr', '#003087'],
    ['İstanbul Üniversitesi', 'İÜ', 'İstanbul', 'devlet', "Osmanlı döneminden beri köklü geleneğiyle Türkiye'nin en eski üniversitesi.", 'https://www.istanbul.edu.tr', '#8B0000'],
    ['Ege Üniversitesi', 'EÜ', 'İzmir', 'devlet', "İzmir'in köklü devlet üniversitesi.", 'https://www.ege.edu.tr', '#005B99'],
    ['Dokuz Eylül Üniversitesi', 'DEÜ', 'İzmir', 'devlet', "İzmir'de güçlü mühendislik ve güzel sanatlar.", 'https://www.deu.edu.tr', '#006400'],
    ['Gazi Üniversitesi', 'GÜ', 'Ankara', 'devlet', 'Eğitim ve mühendislik alanlarında güçlü Ankara üniversitesi.', 'https://www.gazi.edu.tr', '#8B008B'],
    ['Marmara Üniversitesi', 'MÜ', 'İstanbul', 'devlet', "İstanbul'un köklü devlet üniversitesi.", 'https://www.marmara.edu.tr', '#800000'],
    ['Yıldız Teknik Üniversitesi', 'YTÜ', 'İstanbul', 'devlet', "İstanbul'da teknik eğitimiyle öne çıkan devlet üniversitesi.", 'https://www.yildiz.edu.tr', '#CC6600'],
    ['Atılım Üniversitesi', 'ATİLİM', 'Ankara', 'vakıf', "Ankara'da mühendislik ve işletme alanında vakıf üniversitesi.", 'https://www.atilim.edu.tr', '#990000'],
  ];

  const uniIds: number[] = [];
  for (const u of universities) {
    const r = insertUniversity.run(...u);
    uniIds.push(r.lastInsertRowid);
  }

  const insertDept = db.prepare('INSERT INTO departments (university_id, name, short_name) VALUES (?, ?, ?)');

  const seedDepts = (uniId: number, depts: string[][]): number[] => {
    const ids: number[] = [];
    for (const d of depts) {
      const r = insertDept.run(uniId, d[0], d[1]);
      ids.push(r.lastInsertRowid);
    }
    return ids;
  };

  const odtuDepts = seedDepts(uniIds[0], [
    ['Bilgisayar Mühendisliği', 'CENG'], ['Elektrik-Elektronik Mühendisliği', 'EEE'],
    ['Makine Mühendisliği', 'ME'], ['İşletme', 'BA'], ['Matematik', 'MATH'],
    ['Fizik', 'PHYS'], ['Endüstri Mühendisliği', 'IE'], ['İnşaat Mühendisliği', 'CE'],
  ]);
  const bouDepts = seedDepts(uniIds[1], [
    ['Bilgisayar Mühendisliği', 'CMPE'], ['Elektrik-Elektronik Mühendisliği', 'EE'],
    ['İşletme', 'BA'], ['Psikoloji', 'PSY'], ['Matematik', 'MATH'],
  ]);
  const ituDepts = seedDepts(uniIds[2], [
    ['Bilgisayar Mühendisliği', 'BLG'], ['Elektrik Mühendisliği', 'ELK'],
    ['Makine Mühendisliği', 'MAK'], ['İnşaat Mühendisliği', 'İNŞ'],
  ]);

  const insertProf = db.prepare(
    'INSERT INTO professors (university_id, department_id, name, title, avg_rating, difficulty, would_take_again, num_ratings) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const profData: any[][] = [
    [uniIds[0], odtuDepts[0], 'Ahmet Yılmaz', 'Prof. Dr.', 4.5, 3.2, 88, 124],
    [uniIds[0], odtuDepts[0], 'Mehmet Kaya', 'Doç. Dr.', 3.8, 4.1, 65, 87],
    [uniIds[0], odtuDepts[1], 'Fatma Demir', 'Prof. Dr.', 4.8, 3.8, 95, 203],
    [uniIds[0], odtuDepts[2], 'Ali Çelik', 'Dr. Öğr. Üyesi', 3.2, 4.5, 42, 56],
    [uniIds[0], odtuDepts[3], 'Zeynep Arslan', 'Prof. Dr.', 4.1, 2.8, 78, 145],
    [uniIds[0], odtuDepts[4], 'Murat Şahin', 'Doç. Dr.', 2.9, 4.8, 35, 92],
    [uniIds[0], odtuDepts[0], 'Selin Koç', 'Doç. Dr.', 4.3, 3.5, 82, 67],
    [uniIds[0], odtuDepts[6], 'Emre Aydın', 'Prof. Dr.', 4.6, 3.1, 91, 189],
    [uniIds[1], bouDepts[0], 'Deniz Öztürk', 'Prof. Dr.', 4.7, 3.6, 90, 156],
    [uniIds[1], bouDepts[0], 'Burak Yıldız', 'Doç. Dr.', 4.2, 4.0, 72, 98],
    [uniIds[1], bouDepts[3], 'Ayşe Kara', 'Prof. Dr.', 4.9, 2.5, 97, 234],
    [uniIds[1], bouDepts[1], 'Hasan Güneş', 'Dr. Öğr. Üyesi', 3.5, 4.3, 55, 43],
    [uniIds[1], bouDepts[2], 'Merve Çetin', 'Prof. Dr.', 4.4, 3.2, 85, 167],
    [uniIds[2], ituDepts[0], 'Okan Dönmez', 'Prof. Dr.', 4.1, 4.2, 68, 112],
    [uniIds[2], ituDepts[1], 'Gül Acar', 'Doç. Dr.', 3.7, 4.0, 60, 78],
    [uniIds[2], ituDepts[2], 'Türker Polat', 'Prof. Dr.', 3.9, 4.5, 58, 134],
    [uniIds[3], null, 'Nilüfer Erdoğan', 'Prof. Dr.', 4.6, 3.3, 89, 201],
    [uniIds[4], null, 'Serkan Toprak', 'Doç. Dr.', 3.4, 4.4, 47, 67],
    [uniIds[5], null, 'Leyla Akman', 'Prof. Dr.', 4.8, 3.0, 94, 178],
    [uniIds[6], null, 'Cenk Bayrak', 'Prof. Dr.', 4.3, 3.7, 80, 89],
  ];

  const profIds: number[] = [];
  for (const p of profData) {
    const r = insertProf.run(...p);
    profIds.push(r.lastInsertRowid);
  }

  const insertCourse = db.prepare(
    'INSERT INTO courses (university_id, department_id, professor_id, code, name, credits, semester, year, day, time_start, time_end, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );

  const courses: any[][] = [
    [uniIds[0], odtuDepts[0], profIds[0], 'CENG111', 'Bilgisayara Giriş', 4, 'Güz', 2024, 'Pazartesi', '09:40', '11:30', 'M-101'],
    [uniIds[0], odtuDepts[0], profIds[0], 'CENG213', 'Veri Yapıları', 4, 'Bahar', 2025, 'Salı', '13:40', '15:30', 'M-103'],
    [uniIds[0], odtuDepts[0], profIds[1], 'CENG315', 'Algoritma Analizi', 3, 'Güz', 2024, 'Çarşamba', '10:40', '12:30', 'M-201'],
    [uniIds[0], odtuDepts[0], profIds[6], 'CENG421', 'Yapay Zeka', 3, 'Bahar', 2025, 'Perşembe', '14:40', '16:30', 'M-105'],
    [uniIds[0], odtuDepts[1], profIds[2], 'EEE201', 'Devre Teorisi', 4, 'Güz', 2024, 'Pazartesi', '11:40', '13:30', 'E-201'],
    [uniIds[0], odtuDepts[4], profIds[5], 'MATH151', 'Kalkülüs I', 4, 'Güz', 2024, 'Salı', '08:40', '10:30', 'M-G01'],
    [uniIds[0], odtuDepts[4], profIds[5], 'MATH152', 'Kalkülüs II', 4, 'Bahar', 2025, 'Çarşamba', '08:40', '10:30', 'M-G01'],
    [uniIds[0], odtuDepts[6], profIds[7], 'IE321', 'Üretim Planlama', 3, 'Bahar', 2025, 'Cuma', '09:40', '11:30', 'IE-101'],
    [uniIds[1], bouDepts[0], profIds[8], 'CMPE150', 'Programlamaya Giriş', 4, 'Güz', 2024, 'Pazartesi', '09:00', '11:00', 'ETA-B5'],
    [uniIds[1], bouDepts[0], profIds[9], 'CMPE250', 'Veri Yapıları', 4, 'Bahar', 2025, 'Salı', '11:00', '13:00', 'ETA-B3'],
    [uniIds[1], bouDepts[3], profIds[10], 'PSY101', 'Psikolojiye Giriş', 3, 'Güz', 2024, 'Çarşamba', '14:00', '16:00', 'AD-1'],
    [uniIds[2], ituDepts[0], profIds[13], 'BLG252E', 'Nesne Yönelimli Programlama', 4, 'Güz', 2024, 'Pazartesi', '13:30', '15:30', 'BİDB-Amfi'],
    [uniIds[2], ituDepts[2], profIds[15], 'MAK211', 'Dinamik', 4, 'Bahar', 2025, 'Perşembe', '10:30', '12:30', 'T-Amfi'],
  ];

  for (const c of courses) {
    insertCourse.run(...c);
  }

  const insertReview = db.prepare(
    'INSERT INTO reviews (professor_id, course_id, overall_rating, difficulty, would_take_again, comment, grade, attendance, textbook) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  );
  const insertTag = db.prepare('INSERT INTO review_tags (review_id, tag) VALUES (?, ?)');

  const reviewsData: any[] = [
    { prof: profIds[0], course: 1, r: 5, d: 3, w: 1, c: 'Harika bir hoca! Dersleri çok eğlenceli ve anlaşılır şekilde anlatıyor. Sorularınızı cevaplamak için her zaman müsait.', g: 'AA', a: 'zorunlu değil', t: 0, tags: ['Çok İyi Anlatım', 'Yardımsever', 'İlham Verici'] },
    { prof: profIds[0], course: 1, r: 4, d: 3, w: 1, c: 'Gayet başarılı bir hoca. Bazen çok hızlı gidiyor ama soru sorarsanız yardımcı oluyor.', g: 'BA', a: 'zorunlu değil', t: 0, tags: ['İyi Anlatım', 'Erişilebilir'] },
    { prof: profIds[0], course: 2, r: 5, d: 4, w: 1, c: 'Veri yapıları dersini çok iyi anlattı. Ödevler zorlu ama öğretici.', g: 'AA', a: 'zorunlu değil', t: 1, tags: ['Ödevler Zor', 'Öğretici'] },
    { prof: profIds[1], course: 3, r: 4, d: 4, w: 1, c: 'Algoritma dersi zorlu ama hoca iyi anlatıyor. Sınavlar adil.', g: 'BB', a: 'zorunlu değil', t: 0, tags: ['Adil Sınav', 'İyi Anlatım'] },
    { prof: profIds[1], course: 3, r: 3, d: 5, w: 0, c: 'Ders çok zor, midterm korkunçtu. Hoca yardımcı olmaya çalışıyor ama tempo çok yüksek.', g: 'CC', a: 'zorunlu değil', t: 1, tags: ['Sınavlar Zor', 'Hızlı Tempo'] },
    { prof: profIds[2], course: 5, r: 5, d: 4, w: 1, c: 'Devre teorisini kristal netliğinde anlatan bir hoca. Çok şey öğrendim.', g: 'AA', a: 'zorunlu', t: 1, tags: ['Çok İyi Anlatım', 'Öğretici', 'İlham Verici'] },
    { prof: profIds[2], course: 5, r: 5, d: 3, w: 1, c: 'Mükemmel hoca, her şeyi sabırla açıklıyor. Sınavları zorlu ama adil.', g: 'AA', a: 'zorunlu', t: 0, tags: ['Sabırlı', 'Adil Sınav', 'Yardımsever'] },
    { prof: profIds[3], course: null, r: 2, d: 5, w: 0, c: 'Ders anlatımı zayıf, çok karmaşık bir yol izliyor. Kaynaklar da yeterli değil.', g: 'DC', a: 'zorunlu değil', t: 0, tags: ['Kötü Anlatım', 'Sınavlar Zor'] },
    { prof: profIds[4], course: null, r: 4, d: 3, w: 1, c: 'İşletme derslerini çok iyi bağlıyor. Gerçek hayattan örnekler veriyor.', g: 'BA', a: 'zorunlu değil', t: 0, tags: ['Pratik Örnekler', 'İyi Anlatım'] },
    { prof: profIds[5], course: 6, r: 3, d: 5, w: 0, c: 'Kalkülüs çok zor, hoca matematiği seviyor ama anlatımı öğrenci odaklı değil.', g: 'CC', a: 'zorunlu', t: 1, tags: ['Sınavlar Zor', 'Hızlı Tempo'] },
    { prof: profIds[8], course: 9, r: 5, d: 3, w: 1, c: "Boğaziçi'nin en iyi bilgisayar mühendisliği hocalarından biri. Dersi çok sevdim.", g: 'AA', a: 'zorunlu değil', t: 0, tags: ['Çok İyi Anlatım', 'İlham Verici', 'Yardımsever'] },
    { prof: profIds[10], course: 11, r: 5, d: 2, w: 1, c: 'Psikoloji dersini bu kadar ilginç anlatan hoca görmedim. Her dersi bekleyerek geliyordum.', g: 'AA', a: 'zorunlu değil', t: 0, tags: ['İlham Verici', 'Çok İyi Anlatım', 'Eğlenceli'] },
    { prof: profIds[10], course: 11, r: 5, d: 2, w: 1, c: 'Harika, her şeyi öğrenciler için basitleştiriyor. Kesinlikle tavsiye ederim.', g: 'AA', a: 'zorunlu değil', t: 0, tags: ['Yardımsever', 'Erişilebilir'] },
    { prof: profIds[13], course: 12, r: 4, d: 4, w: 1, c: 'Nesne yönelimli programlamayı çok iyi öğretti.', g: 'BA', a: 'zorunlu', t: 0, tags: ['Proje Odaklı', 'İyi Anlatım'] },
  ];

  for (const rev of reviewsData) {
    const r = insertReview.run(rev.prof, rev.course, rev.r, rev.d, rev.w, rev.c, rev.g, rev.a, rev.t);
    for (const tag of rev.tags) {
      insertTag.run(r.lastInsertRowid, tag);
    }
  }

  // Update professor stats
  for (const profId of profIds) {
    const stats = db.prepare(
      'SELECT AVG(overall_rating) as ar, AVG(difficulty) as ad, AVG(would_take_again)*100 as wt, COUNT(*) as cnt FROM reviews WHERE professor_id = ?'
    ).get(profId) as any;
    if (stats && Number(stats.cnt) > 0) {
      db.prepare('UPDATE professors SET avg_rating=?, difficulty=?, would_take_again=?, num_ratings=? WHERE id=?')
        .run(
          Math.round(Number(stats.ar) * 10) / 10,
          Math.round(Number(stats.ad) * 10) / 10,
          Math.round(Number(stats.wt)),
          Number(stats.cnt),
          profId
        );
    }
  }

  // Update university stats
  for (const uniId of uniIds) {
    const pCount = db.prepare('SELECT COUNT(*) as c FROM professors WHERE university_id = ?').get(uniId) as any;
    const rCount = db.prepare(
      'SELECT COUNT(*) as c FROM reviews r JOIN professors p ON r.professor_id = p.id WHERE p.university_id = ?'
    ).get(uniId) as any;
    db.prepare('UPDATE universities SET num_professors=?, num_ratings=? WHERE id=?')
      .run(Number(pCount?.c || 0), Number(rCount?.c || 0), uniId);
  }

  console.log('✅ Veritabanı seed verisiyle dolduruldu');
}

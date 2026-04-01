/**
 * Üniversitelerin şehir bilgilerini düzeltir
 * Kullanım: npx ts-node-dev --transpile-only src/db/fix-cities.ts
 */
import { initDb, getDb } from './database';

// Üniversite adı → şehir eşleştirme tablosu
const CITY_OVERRIDES: Record<string, string> = {
  'ABDULLAH GÜL': 'Kayseri',
  'ACIBADEM': 'İstanbul',
  'ADA KENT': 'KKTC',
  'ADANA ALPARSLAN': 'Adana',
  'ADIYAMAN': 'Adıyaman',
  'AFYON KOCATEPE': 'Afyon',
  'AFYONKARAHİSAR': 'Afyon',
  'AĞRI İBRAHİM ÇEÇEN': 'Ağrı',
  'AKSARAY': 'Aksaray',
  'ALANYA ALAADDİN': 'Antalya',
  'ALANYA HAMDULLAH': 'Antalya',
  'ALTINBAŞ': 'İstanbul',
  'AMASYA': 'Amasya',
  'ANADOLU': 'Eskişehir',
  'ANKARA': 'Ankara',
  'ANKARA MEDKAL': 'Ankara',
  'ANKARA SOSYAL': 'Ankara',
  'ANKARA YILDIRIM BEYAZIT': 'Ankara',
  'ANKARA BİLİM': 'Ankara',
  'ANKARA HACI BAYRAM': 'Ankara',
  'ARTVİN ÇORUH': 'Artvin',
  'ATATÜRK': 'Erzurum',
  'ATILIM': 'Ankara',
  'BAHÇEŞEHİR': 'İstanbul',
  'BALIKESİR': 'Balıkesir',
  'BANDIRMA ONYEDİ EYLÜL': 'Balıkesir',
  'BARTIN': 'Bartın',
  'BAŞKENT': 'Ankara',
  'BATMAN': 'Batman',
  'BAYBURT': 'Bayburt',
  'BEYKENt': 'İstanbul',
  'BEYKENT': 'İstanbul',
  'BEYKOZ': 'İstanbul',
  'BİLECİK ŞEYH EDEBALİ': 'Bilecik',
  'BİLGİ': 'İstanbul',
  'BİLKENT': 'Ankara',
  'BİNGÖL': 'Bingöl',
  'BİTLİS EREN': 'Bitlis',
  'BOĞAZİÇİ': 'İstanbul',
  'BOLU ABANT': 'Bolu',
  'BURDUR MEHMET AKİF': 'Burdur',
  'BURSA TEKNİK': 'Bursa',
  'BURSA ULUDAĞ': 'Bursa',
  'ÇANAKKALE ONSEKİZ MART': 'Çanakkale',
  'ÇANKAYA': 'Ankara',
  'ÇANKIRI': 'Çankırı',
  'ÇORUM HİTİT': 'Çorum',
  'CUMHURİYET': 'Sivas',
  'ÇUKUROVA': 'Adana',
  'DENİZLİ PAMUKKALE': 'Denizli',
  'PAMUKKALE': 'Denizli',
  'DİCLE': 'Diyarbakır',
  'DİYARBAKIR': 'Diyarbakır',
  'DOKUZ EYLÜL': 'İzmir',
  'DOĞU AKDENİZ': 'KKTC',
  'DOĞUŞ': 'İstanbul',
  'DÜZCE': 'Düzce',
  'EDİRNE TRAKYA': 'Edirne',
  'TRAKYA': 'Edirne',
  'EGE': 'İzmir',
  'ERCİYES': 'Kayseri',
  'ERZİNCAN BİNALİ': 'Erzincan',
  'ERZURUM TEKNİK': 'Erzurum',
  'ESKİŞEHİR OSMANGAZİ': 'Eskişehir',
  'ESKİŞEHİR TEKNİK': 'Eskişehir',
  'FATİH SULTAN MEHMET': 'İstanbul',
  'FENERBAHÇE': 'İstanbul',
  'FIRAT': 'Elazığ',
  'GALATASARAy': 'İstanbul',
  'GALATASARAY': 'İstanbul',
  'GAZİ': 'Ankara',
  'GAZİANTEP': 'Gaziantep',
  'GAZİOSMANPAŞA': 'Tokat',
  'GEDİK': 'İstanbul',
  'GELİŞİM': 'İstanbul',
  'GİRESUN': 'Giresun',
  'GÜMÜŞHANE': 'Gümüşhane',
  'HACETTEPE': 'Ankara',
  'HAKKARİ': 'Hakkari',
  'HARRAN': 'Şanlıurfa',
  'HATAY MUSTAFA KEMAL': 'Hatay',
  'IĞDIR': 'Iğdır',
  'ISPARTA UYGULAMALI': 'Isparta',
  'İBN HALDUN': 'İstanbul',
  'İHSAN DOĞRAMACI BİLKENT': 'Ankara',
  'İNÖNÜ': 'Malatya',
  'İSTANBUL': 'İstanbul',
  'İZMİR BAKIRÇAY': 'İzmir',
  'İZMİR DEMOKRASİ': 'İzmir',
  'İZMİR EKONOMİ': 'İzmir',
  'İZMİR KATIP ÇELEBİ': 'İzmir',
  'KADİR HAS': 'İstanbul',
  'KAFKAS': 'Kars',
  'KAHRAMANMARAŞ İSTİKLAL': 'Kahramanmaraş',
  'KAHRAMANMARAŞ SÜTÇÜ': 'Kahramanmaraş',
  'KARABÜK': 'Karabük',
  'KARADENIZ TEKNİK': 'Trabzon',
  'KARAMAN': 'Karaman',
  'KASTAMONU': 'Kastamonu',
  'KIBRIS': 'KKTC',
  'KIBRIS TÜRK': 'KKTC',
  'KİLİS 7 ARALIK': 'Kilis',
  'KOÇ': 'İstanbul',
  'KOCAELİ': 'Kocaeli',
  'KONYA TEKNİK': 'Konya',
  'KÜTAHYA DUMLUPINAR': 'Kütahya',
  'LEFKE': 'KKTC',
  'LOKMAN HEKİM': 'Ankara',
  'MALATYA TURGUT ÖZAL': 'Malatya',
  'MANİSA CELAL BAYAR': 'Manisa',
  'MARDİN ARTUKLU': 'Mardin',
  'MARMARA': 'İstanbul',
  'MEDENİYET': 'İstanbul',
  'MEDİPOL': 'İstanbul',
  'MEF': 'İstanbul',
  'MERSİN': 'Mersin',
  'MİMAR SİNAN': 'İstanbul',
  'MUĞLA SITKI KOÇMAN': 'Muğla',
  'MUŞ ALPARSLAN': 'Muş',
  'NECMETTİN ERBAKAN': 'Konya',
  'NEVŞEHİR': 'Nevşehir',
  'NİĞDE ÖMER': 'Niğde',
  'NİŞANTAŞI': 'İstanbul',
  'NUH NACİ YAZGAN': 'Kayseri',
  'OKAN': 'İstanbul',
  'ONDOKUZ MAYIS': 'Samsun',
  'ORDU': 'Ordu',
  'ORTA DOĞU': 'Ankara',
  'ÖZYEĞIN': 'İstanbul',
  'PAMUKKALE': 'Denizli',
  'PIRI REİS': 'İstanbul',
  'RİZE RECEP TAYYİP': 'Rize',
  'SABANCI': 'İstanbul',
  'SAKARYA': 'Sakarya',
  'SAKARYA UYGULAMALI': 'Sakarya',
  'SANKO': 'Gaziantep',
  'SELÇUK': 'Konya',
  'SİİRT': 'Siirt',
  'SİNOP': 'Sinop',
  'SİVAS CUMHURİYET': 'Sivas',
  'SİVAS BİLİM': 'Sivas',
  'SÜLEYMAN DEMİREL': 'Isparta',
  'ŞIRNAK': 'Şırnak',
  'TEKİRDAĞ NAMIK': 'Tekirdağ',
  'TOBB': 'Ankara',
  'TOKAT GAZİOSMANPAŞA': 'Tokat',
  'TRABZON': 'Trabzon',
  'TUNCELİ': 'Tunceli',
  'TÜRK HAVA KURUMU': 'Ankara',
  'UŞAK': 'Uşak',
  'ÜSKÜDAR': 'İstanbul',
  'VAN YÜZÜNCÜ YIL': 'Van',
  'YALOVA': 'Yalova',
  'YAŞAR': 'İzmir',
  'YEDİTEPE': 'İstanbul',
  'YENİ YÜZYIL': 'İstanbul',
  'YILDIZ TEKNİK': 'İstanbul',
  'YOZGAT BOZOK': 'Yozgat',
  'YÜKSEK İHTİSAS': 'Bursa',
  'ZONGULDAK BÜLENT ECEVİT': 'Zonguldak',
  'YAKIN DOĞU': 'KKTC',
  'ULUSLARARASI KIBRIS': 'KKTC',
  'LEFKOŞA': 'KKTC',
  'GIRNE': 'KKTC',
  'GİRNE': 'KKTC',
  'DOĞU AKDENIZ': 'KKTC',
  'ADA KENT': 'KKTC',
};

async function main() {
  console.log('🔄 Veritabanı başlatılıyor...');
  await initDb();
  const db = getDb();

  const unis = db.prepare('SELECT id, name, city FROM universities WHERE city = ?').all('Türkiye') as any[];
  console.log(`🔧 ${unis.length} üniversitenin şehri düzeltiliyor...`);

  const updateCity = db.prepare('UPDATE universities SET city = ? WHERE id = ?');
  let fixed = 0;

  for (const uni of unis) {
    const upperName = uni.name.toUpperCase();
    let foundCity = '';

    for (const [keyword, city] of Object.entries(CITY_OVERRIDES)) {
      if (upperName.includes(keyword.toUpperCase())) {
        foundCity = city;
        break;
      }
    }

    if (foundCity) {
      updateCity.run(foundCity, uni.id);
      fixed++;
    }
  }

  console.log(`✅ ${fixed}/${unis.length} üniversitenin şehri düzeltildi`);

  // Kontrol
  const remaining = db.prepare("SELECT COUNT(*) as c FROM universities WHERE city = 'Türkiye'").get() as any;
  console.log(`ℹ️  Hâlâ şehri bilinmeyen: ${remaining.c} üniversite`);

  // Şehir dağılımını göster
  const cityStats = db.prepare(`
    SELECT city, COUNT(*) as cnt FROM universities GROUP BY city ORDER BY cnt DESC LIMIT 10
  `).all() as any[];
  console.log('\n📊 Şehir Dağılımı (Top 10):');
  for (const s of cityStats) {
    console.log(`  ${s.city}: ${s.cnt}`);
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

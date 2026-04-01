/**
 * Türkçe karakter duyarsız arama yardımcısı
 * "bogazici" → "BOĞAZİÇİ" gibi ASCII girişleri de eşleştirir
 */

// Türkçe büyük harf dönüşümü (i → İ, ı → I)
export function trUpper(s: string): string {
  return s
    .replace(/i/g, 'İ')
    .replace(/ı/g, 'I')
    .toUpperCase();
}

// ASCII → Türkçe normalleştirme için iki ayrı sorgu üret:
// 1) Girişi doğrudan Türkçe büyük harfe çevir
// 2) Girişi ASCII normalleştirip DB'deki kelimeleri de ASCII normalleştirerek karşılaştır
//
// Çözüm: LIKE sorgularında hem orijinal hem translitere edilmiş terim ara
export function buildSearchTerms(input: string): string[] {
  const direct = `%${trUpper(input)}%`;

  // ASCII transliterasyon: ş→s, ğ→g, ü→u, ö→o, ı→i, İ→i, ç→c
  const ascii = input
    .toLowerCase()
    .replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u')
    .replace(/ö/g, 'o').replace(/ı/g, 'i').replace(/ç/g, 'c')
    .replace(/İ/g, 'i').replace(/Ş/g, 's').replace(/Ğ/g, 'g')
    .replace(/Ü/g, 'u').replace(/Ö/g, 'o').replace(/Ç/g, 'c')
    .toUpperCase();

  if (ascii === trUpper(input)) return [direct];
  return [direct, `%${ascii}%`];
}

// Tek bir SQL LIKE koşulu için WHERE clause üret
// Her zaman DB kolonu da ASCII'ye normalize edilmiş formuyla karşılaştırılır,
// böylece "dogu" → "DOĞU", "teknik" → "TEKNİK" gibi eşleşmeler çalışır.
export function buildLikeClause(column: string, terms: string[]): { clause: string; params: string[] } {
  // ASCII arama için DB kolonunu da normalleştir
  const trCol = `UPPER(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(${column},'Ş','S'),'Ğ','G'),'Ü','U'),'Ö','O'),'Ç','C'),'İ','I'))`;
  if (terms.length === 1) {
    // Tek terim olsa bile trCol ile de karşılaştır
    return {
      clause: `(UPPER(${column}) LIKE ? OR ${trCol} LIKE ?)`,
      params: [terms[0], terms[0]],
    };
  }
  return {
    clause: `(UPPER(${column}) LIKE ? OR ${trCol} LIKE ?)`,
    params: terms,
  };
}

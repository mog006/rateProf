# Hocayı Değerlendir — Kurulum ve Çalıştırma

## Gereksinimler
- Node.js 18+
- npm

## Kurulum

```bash
# 1. Root dizininde tüm paketleri yükle
cd rateProf
npm install
cd server && npm install
cd ../client && npm install
cd ..
```

## Çalıştırma

**İki terminal penceresi gereklidir:**

### Terminal 1 — Backend (API)
```bash
cd server
npx ts-node-dev --transpile-only src/index.ts
```
> API: http://localhost:3001

### Terminal 2 — Frontend (React)
```bash
cd client
npm run dev
```
> Uygulama: http://localhost:5173

---

## Özellikler

| Sayfa | URL | Açıklama |
|-------|-----|----------|
| Ana Sayfa | `/` | Arama, son değerlendirmeler |
| Üniversiteler | `/universities` | Tüm üniversiteler (filtreleme) |
| Üniversite Detay | `/universities/:id` | Hocalar, bölümler |
| Hocalar | `/professors` | Tüm hocalar (sıralama) |
| Hoca Detay | `/professors/:id` | Profil, değerlendirmeler |
| Değerlendir | `/professors/:id/review` | Yorum formu |
| Hoca Ekle | `/professors/add` | Yeni hoca ekle |
| Dersler | `/courses` | Ders arama |
| Program | `/schedule` | Ders programı oluşturma |
| Arama | `/search?q=...` | Genel arama sonuçları |
| Giriş | `/login` | Kullanıcı girişi |
| Kayıt | `/register` | Yeni hesap |

## Teknoloji Yığını
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Veritabanı**: SQLite (sql.js — saf WASM, kurulum gerektirmez)
- **Auth**: JWT + bcrypt

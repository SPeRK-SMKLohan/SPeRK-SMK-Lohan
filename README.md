# SPeRK SMK Lohan — Sistem Pengurusan Pelajar dan Resit Koperasi

Aplikasi web untuk pendaftaran murid (e-Daftar) dan merekod bayaran
koperasi serta menjana resit digital (e-Resit Koperasi). Kedua-dua ciri
berkongsi satu pangkalan data murid.
Status: sedia untuk produksi — https://sperk.smk-lohan.workers.dev

## Modul

- **e-Daftar** — sekolah rendah terdahulu, nama, No. IC, tingkatan, status
  OKU, status daftar (kehadiran hari pendaftaran) dan penempatan semula.
  Murid boleh **dipadam** — tunggal atau pilihan sehingga 200 serentak —
  dengan pengesahan kata laluan akaun (pemadaman kekal). Senarai dipaparkan
  50 baris/halaman; nama murid dipaparkan HURUF BESAR.
  Halaman Pendaftaran dioptimumkan sebagai kaunter hari pendaftaran: cari
  murid, tekan **Tanda daftar** (satu ketukan), dengan pilihan **Batal**
  pada maklum balas; status dipaparkan serta-merta.
- **e-Resit Koperasi** — pilih item, kira jumlah, simpan resit, PDF,
  cetakan dan perkongsian WhatsApp. Tunai diprabilih; butang "Resit Baharu
  (murid sama)" pada resit lama mempercepat pembelian berulang.
- **Papan Pemuka** — statistik belum daftar / sudah daftar / didaftarkan
  hari ini / keahlian koperasi, bar kemajuan hari pendaftaran, kad navigasi
  dan resit terkini.
- **Import Data** — muat naik senarai murid daripada fail Excel `.xlsx`.
- **Barangan** dan **Sejarah Resit** — senarai item dan rekod resit.

## Aliran Hari Pendaftaran

1. **Sebelum hari pendaftaran** — Import Data untuk memuat naik senarai
   murid (semua Tingkatan 1–5). Papan Pemuka memaparkan kemajuan.
2. **Semasa** — buka **Pendaftaran**: taip nama atau No. IC (`ahmad 140512`
   juga berfungsi), tekan **Tanda daftar** pada baris murid (atau **Enter**
   jika hanya satu padanan). Tersalah? Tekan **Batal** pada maklum balas
   untuk memulihkan status. Murid baharu yang hadir tanpa rekod: cari
   namanya, kemudian tekan **+ Daftar "..." sebagai murid baharu**.
3. **Pantau** — angka **Sudah daftar / Belum daftar / Didaftarkan hari ini**
   dan bar peratus di atas senarai dikemas kini serta-merta dan disegarkan
   automatik setiap 30 saat (untuk kaunter berbilang). Tekan `/` untuk fokus
   ke kotak carian.
4. **Koperasi** — di **Jana Resit**, cari murid, tambah item, pilih
   pembayaran (Tunai diprabilih) dan simpan; cetak atau kongsi resit.
5. **Kawalan kaunter** — murid yang memohon penempatan semula tetap dikira
   **sudah daftar** jika hadir; isi butiran melalui **Butiran**.

## Struktur

Kod disusun mengikut ciri: e-Daftar dan e-Resit Koperasi berasingan, dengan
kod kongsi dalam `shared/`.

- `frontend/`: antara muka (HTML, CSS, JavaScript, Vite)
  - `src/pages/`: halaman peringkat sistem (log masuk, papan pemuka)
  - `src/features/e-daftar/`: pendaftaran murid dan import data
  - `src/features/e-resit/`: jana resit, barangan, sejarah resit, PDF
  - `src/shared/`: kod kongsi (API, pengesahan, wang, identiti koperasi)
- `worker/`: backend API (Cloudflare Workers)
  - `src/features/e-daftar/`: API murid dan import
  - `src/features/e-resit/`: API barangan dan resit
  - `src/shared/students.js`: lapisan data murid yang dikongsi
  - `src/dashboard.js`: statistik papan pemuka (kedua-dua ciri)
- `docs/`: dokumentasi
  - `Panduan_Pengguna_SPeRK.md` — sumber manual pengguna; panduan semasa turut tersedia dalam aplikasi
  - `Panduan_Teknikal_SPeRK.md` — manual teknikal & operasi untuk pentadbir sistem (juga .pdf dan .docx)
  - `Dokumentasi_SPeRK_SMK_Lohan.md` — dokumentasi perancangan projek
  - `Reka_Bentuk_UI-UX_SPeRK.md` — reka bentuk UI/UX (Warm Slate)
  - `imej/` — tangkapan skrin yang digunakan dalam manual

## Dokumentasi

| Dokumen | Untuk | Format |
|---|---|---|
| [Panduan Pengguna](docs/Panduan_Pengguna_SPeRK.md) | Guru & kakitangan koperasi | Markdown; versi ringkas dalam aplikasi |
| [Panduan Teknikal & Operasi](docs/Panduan_Teknikal_SPeRK.md) | Pentadbir sistem & penyelenggara | Markdown · [PDF](docs/Panduan_Teknikal_SPeRK.pdf) · [Word](docs/Panduan_Teknikal_SPeRK.docx) |
| [Dokumentasi Projek](docs/Dokumentasi_SPeRK_SMK_Lohan.md) | Latar belakang & perancangan | Markdown |
| [Reka Bentuk UI/UX](docs/Reka_Bentuk_UI-UX_SPeRK.md) | Sistem reka bentuk | Markdown |

> Panduan Penggunaan boleh dibuka terus dalam aplikasi melalui menu **Panduan Penggunaan**, footer, atau pautan pada halaman log masuk.

## Nama teknikal

- Worker API: `sperk-smk-lohan-api` —
  https://sperk-smk-lohan-api.smk-lohan.workers.dev
- Frontend (fail statik): `sperk` —
  https://sperk.smk-lohan.workers.dev
- Repositori: https://github.com/SPeRK-SMKLohan/SPeRK-SMK-Lohan
- Projek Firebase: `sperk-smk-lohan` (akaun `sperk.smklohan@gmail.com`,
  sejak 18 Oktober 2026)

## Menjalankan secara tempatan

Frontend:

```
cd frontend
npm install
npm run dev
```

Worker:

```
cd worker
npm install
npm run dev
```

## Deploy

Worker API (folder `worker/`):

```
npx wrangler deploy
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT   # JSON akaun perkhidmatan
npx wrangler secret put ALLOWED_EMAILS             # e-mel yang dibenarkan
```

Frontend (folder `frontend/`, fail statik sahaja — lihat
`frontend/wrangler.toml`):

```
npm run build
npx wrangler deploy
```

Selepas deploy, pastikan domain frontend ada dalam `ALLOWED_ORIGINS`
(`worker/wrangler.toml`) dan `VITE_API_BASE_URL` menunjuk ke URL worker
API.

## Peraturan penting

- Jangan masukkan data murid sebenar ke dalam repositori.
- Jangan commit kunci rahsia, fail `.env` atau `.dev.vars`.

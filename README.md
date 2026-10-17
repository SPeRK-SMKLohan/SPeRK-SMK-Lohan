# SPeRK SMK Lohan — Sistem Pengurusan Pelajar dan Resit Koperasi

Aplikasi web untuk pendaftaran murid (e-Daftar) dan merekod bayaran
koperasi serta menjana resit digital (e-Resit Koperasi). Kedua-dua ciri
berkongsi satu pangkalan data murid.
Status: dalam pembangunan. Gunakan data rekaan sahaja.

## Modul

- **e-Daftar** — sekolah rendah terdahulu, nama, No. IC, tingkatan, status
  OKU, status daftar (kehadiran hari pendaftaran) dan penempatan semula.
- **e-Resit Koperasi** — pilih item, kira jumlah, simpan resit, PDF,
  cetakan dan perkongsian WhatsApp.
- **Papan Pemuka** — statistik belum daftar / sudah daftar / keahlian
  koperasi, kad navigasi dan resit terkini.
- **Import Data** — muat naik senarai murid daripada fail Excel `.xlsx`.
- **Barangan** dan **Sejarah Resit** — senarai item dan rekod resit.

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
- `docs/`: dokumentasi perancangan

## Nama teknikal

- Worker API: `sprek-smk-lohan-api` —
  https://sprek-smk-lohan-api.smk-lohan.workers.dev
- Frontend (fail statik): `sprek-smk-lohan-web` —
  https://sprek-smk-lohan-web.smk-lohan.workers.dev
- Repositori: `sprek-smk-lohan`
- Projek Firebase: `resit-koperasi-lohan` (dikekalkan; penukaran nama
  memerlukan migrasi data)

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
API. Jangan tetapkan `ENABLE_SEED` di produksi.

## Peraturan penting

- Jangan masukkan data murid sebenar ke dalam repositori.
- Jangan commit kunci rahsia, fail `.env` atau `.dev.vars`.
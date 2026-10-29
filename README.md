# SPeRK SMK Lohan

SPeRK ialah aplikasi sekolah untuk pendaftaran murid Tingkatan 1 dan urusan
bayaran koperasi. Aplikasi digunakan oleh guru dan kakitangan yang dibenarkan.

**Laman produksi:** [sperk-smklohan.pages.dev](https://sperk-smklohan.pages.dev)
**API:** `https://sperk-smk-lohan-api.sperk-smklohan.workers.dev`

## Fungsi

- **e-Daftar:** pilih sekolah rendah, cari murid, semak status dan tanda
  kehadiran. Sistem hanya menerima Tingkatan 1.
- **Import Data:** muat naik senarai murid `.xlsx` sebelum hari pendaftaran.
- **e-Resit Koperasi:** rekod bayaran, keluarkan resit, dan lihat sejarah.
- **Laporan Koperasi:** tapis rekod jualan dan eksport laporan.
- **Panduan:** arahan ringkas untuk guru tersedia dalam aplikasi melalui menu
  **Panduan**.

Log masuk menggunakan e-mel sekolah dan kata laluan akaun yang dibenarkan.
Menutup tab tidak melog keluar; gunakan **Log Keluar** selepas menggunakan
peranti bersama.

## Jalankan untuk pembangunan

Gunakan Node.js LTS. Pastikan fail konfigurasi setempat disediakan sebelum
menjalankan aplikasi; jangan kongsi atau commit fail rahsia.

Terminal pertama — API:

```powershell
cd worker
npm install
npx wrangler dev
```

Terminal kedua — laman hadapan:

```powershell
cd frontend
npm install
npm run dev
```

Frontend memerlukan `frontend/.env.local` dengan `VITE_FIREBASE_API_KEY`,
`VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`
dan `VITE_API_BASE_URL`. Untuk pembangunan setempat, URL API lazimnya
`http://127.0.0.1:8787`. Worker menggunakan `worker/.dev.vars` untuk
`FIREBASE_SERVICE_ACCOUNT` dan `ALLOWED_EMAILS`.

## Deploy

Frontend diterbitkan sebagai Cloudflare Pages, API sebagai Cloudflare Worker.
Jalankan arahan dari folder yang dinyatakan:

```powershell
# frontend/
npm run build
npx wrangler pages deploy

# worker/ (hanya apabila API berubah)
npx wrangler deploy
```

Semak `frontend/wrangler.toml` dan `worker/wrangler.toml` sebelum deploy.
Pastikan domain Pages dibenarkan dalam `ALLOWED_ORIGINS`, konfigurasi API
frontend menunjuk kepada Worker produksi, dan Wrangler menggunakan akaun
Cloudflare sekolah. Selepas deploy API, semak
`https://sperk-smk-lohan-api.sperk-smklohan.workers.dev/api/health`.

## Struktur utama

- `frontend/` — SPA JavaScript/Vite dan halaman panduan dalam aplikasi.
- `worker/` — API Cloudflare Worker dan sambungan Firestore.
- `docs/Panduan_Pengguna_SPeRK.md` — panduan guru/kakitangan.
- `docs/Panduan_Teknikal_SPeRK.md` — persediaan, deploy, keselamatan dan operasi.

## Keselamatan data

- Jangan commit data murid, `.env.local`, `.dev.vars`, kunci Firebase atau token.
- Hadkan akses akaun kepada pengguna yang diluluskan sekolah.
- Data operasi disimpan dalam Firestore; repositori bukan tempat sandaran data.

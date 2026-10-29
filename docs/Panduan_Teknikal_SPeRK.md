# Panduan Teknikal dan Operasi SPeRK

**Untuk pentadbir sistem dan penyelenggara**
Laman: [sperk-smklohan.pages.dev](https://sperk-smklohan.pages.dev)
API: `https://sperk-smk-lohan-api.sperk-smklohan.workers.dev`
Repositori: [SPeRK-SMKLohan/SPeRK-SMK-Lohan](https://github.com/SPeRK-SMKLohan/SPeRK-SMK-Lohan)

## Seni bina semasa

| Bahagian | Teknologi | Folder / servis |
|---|---|---|
| Aplikasi web | Vite, JavaScript, Cloudflare Pages | `frontend/`, projek Pages `sperk-smklohan` |
| API | Cloudflare Workers | `worker/`, Worker `sperk-smk-lohan-api` |
| Log masuk | Firebase Authentication | Projek Firebase `sperk-smk-lohan` |
| Rekod | Cloud Firestore melalui API sahaja | Projek Firebase `sperk-smk-lohan` |

Laman web dihoskan pada Pages, bukan Worker laman berasingan. API Worker mengesahkan token Firebase dan menyemak e-mel pengguna dengan secret `ALLOWED_EMAILS` sebelum mengakses Firestore. Frontend dibina sebagai SPA. Semua proses data murid dan resit adalah untuk Tingkatan 1.

## Keperluan konfigurasi

Fail konfigurasi setempat tidak boleh dimasukkan ke Git:

- `frontend/.env.local`: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_API_BASE_URL`.
- `worker/.dev.vars`: `FIREBASE_SERVICE_ACCOUNT` dan `ALLOWED_EMAILS` untuk pembangunan setempat.
- Secret produksi Worker: `FIREBASE_SERVICE_ACCOUNT` dan `ALLOWED_EMAILS`.
- `worker/wrangler.toml`: `FIREBASE_PROJECT_ID` dan `ALLOWED_ORIGINS`.
- `frontend/wrangler.toml`: nama projek Pages dan direktori output `dist`.

`VITE_API_BASE_URL` dimasukkan ke bundle semasa build. Untuk produksi, nilainya mesti URL API Worker. Asalan Pages produksi mesti disenaraikan dalam `ALLOWED_ORIGINS`. Jangan letak kunci akaun perkhidmatan, kata laluan atau token dalam kod, dokumen awam atau pemboleh ubah `VITE_*`.

## Jalankan secara setempat

Prasyarat: Node.js LTS, konfigurasi setempat di atas, dan akses akaun Cloudflare serta Firebase yang dibenarkan.

Terminal API:

```powershell
cd worker
npm install
npx wrangler dev
```

Terminal frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend pembangunan biasanya menggunakan API tempatan `http://127.0.0.1:8787`. Pastikan asalan Vite setempat dibenarkan dalam `ALLOWED_ORIGINS` untuk ujian API dari pelayar.

## Deploy ke produksi

Semak cawangan dan perubahan Git sebelum deploy. Wrangler mesti disahkan masuk ke akaun Cloudflare sekolah. Nama projek dan akaun deploy ditetapkan dalam fail `wrangler.toml` masing-masing.

Frontend, dari folder `frontend/`:

```powershell
npm install
npm run build
npx wrangler pages deploy
```

API, dari folder `worker/` dan hanya apabila kod API atau konfigurasi Worker berubah:

```powershell
npm install
npx wrangler deploy
```

Selepas perubahan frontend sahaja, deploy Pages sahaja. Selepas perubahan API, deploy Worker dan pastikan URL Pages masih sepadan dengan `ALLOWED_ORIGINS`. Semak kesihatan API:

```powershell
curl.exe https://sperk-smk-lohan-api.sperk-smklohan.workers.dev/api/health
```

Kemudian buka laman produksi, log masuk, dan semak satu aliran baca yang sesuai. Jangan cipta atau padam rekod murid sebenar semata-mata untuk ujian deploy.

## Mengurus secret Worker

Arahan dijalankan dari `worker/`. Wrangler akan meminta nilai secret secara interaktif:

```powershell
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT
npx wrangler secret put ALLOWED_EMAILS
```

`ALLOWED_EMAILS` ialah senarai e-mel yang dibenarkan, dipisahkan koma. Pastikan setiap pengguna juga wujud dalam Firebase Authentication. Jangan tampal nilai secret ke terminal yang dirakam, tiket, mesej atau commit.

## Data dan operasi

- Rekod aplikasi berada dalam Firestore. Jangan gunakan repositori sebagai sandaran atau masukkan data murid sebenar ke Git.
- Buat dan simpan sandaran melalui proses pentadbir yang diluluskan sekolah, sebelum import besar atau perubahan struktur data.
- Import murid menerima fail `.xlsx`; had semasa ialah 2 MB dan 2,000 baris.
- Sistem menguatkuasakan Tingkatan 1 untuk pendaftaran dan resit.
- Akaun yang membuat perubahan dikenal pasti menggunakan UID Firebase; nama guru tidak diminta atau disimpan pada resit baharu.
- Gunakan **Sejarah Resit** untuk menyemak simpanan yang statusnya tidak pasti; jangan ulang cipta resit sebelum menyemak rekod.

## Pemantauan dan penyelesaian masalah

| Gejala | Semakan |
|---|---|
| API tidak boleh dicapai | Buka `/api/health`; semak Cloudflare Worker dan log `npx wrangler tail` dari `worker/`. |
| Ralat 403 | Pastikan e-mel Firebase pengguna terdapat dalam secret `ALLOWED_EMAILS`. |
| Ralat sambungan/CORS | Semak URL API dalam `VITE_API_BASE_URL` dan asal Pages dalam `ALLOWED_ORIGINS`; bina semula frontend selepas mengubah `.env.local`. |
| Konfigurasi Firebase tidak lengkap | Semak pemboleh ubah `VITE_FIREBASE_*`, kemudian jalankan semula build dan deploy Pages. |
| Halaman kosong selepas deploy | Pastikan `npm run build` berjaya dan jalankan deploy Pages dari `frontend/`. |
| Pengguna perlu log masuk semula | Sesi menggunakan storan setempat pelayar. Semak sama ada data pelayar dipadam, mod peribadi digunakan, atau pengguna menekan **Log Keluar**. |
| Data belum kelihatan | Semak rangkaian, pilihan sekolah dan status penapis; gunakan **Muat semula**. Jika berterusan, semak log API dan Firestore. |

## Keselamatan

- Jangan commit `.env.local`, `.dev.vars`, kunci Firebase, token, kata laluan atau data murid.
- Berikan akses akaun hanya kepada staf yang diluluskan pihak sekolah.
- Log keluar pada peranti bersama dan jangan kongsi sesi pelayar.
- Hadkan akses konsol Cloudflare, Firebase dan GitHub kepada pentadbir yang bertanggungjawab.
- Semak kandungan dan sasaran deploy sebelum menerbitkan perubahan produksi.

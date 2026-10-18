# Panduan Teknikal & Operasi SPeRK

**Sistem Pengurusan Pelajar dan Resit Koperasi — SMK Lohan, Ranau**
Dokumen dalaman untuk pentadbir sistem dan penyelenggara.

| | |
|---|---|
| **Versi** | 1.0 (18 Oktober 2026) |
| **Akses sistem** | https://sperk.smk-lohan.workers.dev |
| **API** | https://sperk-smk-lohan-api.smk-lohan.workers.dev |
| **Repositori** | https://github.com/SPeRK-SMKLohan/SPeRK-SMK-Lohan |

> **Nota keselamatan dokumen:** Dokumen ini **tidak mengandungi sebarang kata laluan, kunci peribadi atau token**. Semua rahsia (secret) disimpan dalam sistem yang sepatutnya — lihat [Bahagian 4](#4-inventori-akaun--infrastruktur). Repositori GitHub adalah **awam**; jangan sekali-kali commit fail `.env.local`, `.dev.vars` atau kunci perkhidmatan Firebase.

---

## Kandungan

1. [Tujuan dan konteks](#1-tujuan-dan-konteks)
2. [Ringkasan sistem](#2-ringkasan-sistem)
3. [Seni bina dan aliran kerja](#3-seni-bina-dan-aliran-kerja)
4. [Inventori akaun & infrastruktur](#4-inventori-akaun--infrastruktur)
5. [Konfigurasi repositori](#5-konfigurasi-repositori)
6. [Model data Firestore](#6-model-data-firestore)
7. [API](#7-api)
8. [Aliran pembangunan dan deploy](#8-aliran-pembangunan-dan-deploy)
9. [Pengurusan pengguna dan keselamatan](#9-pengurusan-pengguna-dan-keselamatan)
10. [Sandaran dan pemulihan data](#10-sandaran-dan-pemulihan-data)
11. [Pemantauan dan penyelesaian masalah](#11-pemantauan-dan-penyelesaian-masalah)
12. [Kapasiti, had dan kos](#12-kapasiti-had-dan-kos)
13. [Sejarah migrasi dan rekod perubahan](#13-sejarah-migrasi-dan-rekod-perubahan)

---

## 1. Tujuan dan konteks

SPeRK ialah sistem dalam talian untuk SMK Lohan yang menggabungkan dua ciri:

| Ciri | Kegunaan | Pangkalan data |
|---|---|---|
| **e-Daftar** | Senarai murid, status kehadiran hari pendaftaran, permohonan penempatan semula | Koleksi `students` |
| **e-Resit Koperasi** | Janaan resit jualan barangan koperasi | Koleksi `receipts`, `items`, `counters` |

Kedua-dua ciri berkongsi **satu koleksi murid** — murid ditambah sekali sahaja (import atau borang) dan digunakan oleh kedua-dua ciri.

Sistem ini dibina sebagai projek sekolah (bukan komersial). Pentadbir utama pada masa ini ialah pemegang akaun **sperk.smklohan@gmail.com** (akaun rasmi yang dipegang oleh pihak sekolah).

---

## 2. Ringkasan sistem

| Komponen | Teknologi | Lokasi |
|---|---|---|
| Laman hadapan (SPA) | Vite + JavaScript biasa (tanpa kerangka), penghalaan berasaskan hash | Cloudflare Worker `sperk` (asas `frontend/dist`) |
| API | Cloudflare Worker (modul ES) | Worker `sperk-smk-lohan-api` (`worker/`) |
| Pengesahan pengguna | Firebase Authentication (e-mel/kata laluan) | Projek Firebase `sperk-smk-lohan` |
| Pangkalan data | Cloud Firestore (mod produksi) | Projek Firebase `sperk-smk-lohan` |
| Fail statik | `logo.svg` (resit) dan `logo-nav.svg` (bar navigasi, dipotong rapat tanpa ruang kosong), fon Plus Jakarta Sans, Inter & Roboto Mono (dihos sendiri), dan salinan PDF Panduan Pengguna | `frontend/public/` → `/dist` |

Ciri utama seni bina:

- **Harga dikira di pelayan.** Pelanggan hanya menghantar `itemId` dan `quantity`; worker menentukan harga seunit dan jumlah akhir daripada koleksi `items`. Ini menghalang manipulasi harga daripada pelayar.
- **Pengesahan dua lapis.** Firebase mengesahkan kata laluan; worker mengesahkan token ID Firebase pada setiap permintaan API dan menyemak e-mel terhadap senarai `ALLOWED_EMAILS`.
- **Tiada pangkalan data di pelanggan.** Semua data melalui API worker.
- **Panduan awam:** salinan PDF *Panduan Pengguna* dihos pada laman hadapan — `https://sperk.smk-lohan.workers.dev/panduan/Panduan_Pengguna_SPeRK.pdf`.

---

## 3. Seni bina dan aliran kerja

```
Pelayar (guru)
   │  1. Log masuk (e-mel + kata laluan)
   ▼
Firebase Authentication ──► Token ID (JWT)
   │
   │  2. Setiap permintaan API: Authorization: Bearer <token ID>
   ▼
Cloudflare Worker "sperk" (fail statik)          Cloudflare Worker "sperk-smk-lohan-api"
   │                                                  │  3. Sahkan JWT dengan JWKS Google
   │                                                  │  4. Semak e-mel ∈ ALLOWED_EMAILS
   │                                                  ▼
   │                                          Google Firestore (REST, akaun perkhidmatan)
   │                                                  ▲
   └────────── pelayar memuatkan laman ───────────────┘
```

**Aliran pengesahan (worker):**

1. Membaca `Authorization: Bearer <token>`.
2. Mengesahkan tandatangan RS256 menggunakan JWKS rasmi Google (`securetoken@system.gserviceaccount.com`).
3. Menyemak `aud`/`iss` sepadan dengan `FIREBASE_PROJECT_ID = sperk-smk-lohan`.
4. Menyemak e-mel pengguna berada dalam senarai `ALLOWED_EMAILS` (secret worker). Jika tidak → **403 Akaun tidak dibenarkan**.
5. Menyambung ke Firestore menggunakan akaun perkhidmatan (`FIREBASE_SERVICE_ACCOUNT`, secret worker) — token OAuth dijana dalam worker.

**CORS:** worker hanya menerima permintaan daripada asalan dalam var `ALLOWED_ORIGINS` (localhost pembangunan + domain produksi).

---

## 4. Inventori akaun & infrastruktur

Semua perkhidmatan di bawah dimiliki oleh **satu akaun Gmail rasmi: `sperk.smklohan@gmail.com`**. Maklumat pemulihan akaun (kod sandaran, nombor telefon pemulihan) hendaklah disimpan oleh pihak sekolah di tempat yang selamat.

### 4.1 GitHub

| Perkara | Nilai |
|---|---|
| Akaun | `SPeRK-SMKLohan` |
| Repositori | `SPeRK-SMKLohan/SPeRK-SMK-Lohan` (awam) |
| Cawangan utama | `main` |
| Identiti commit | `SPeRK SMK Lohan <sperk.smklohan@gmail.com>` |
| Pengesahan push dari PC ini | Fine-grained PAT (skop *Contents: Read & Write*) disimpan dalam Git Credential Manager Windows |

### 4.2 Cloudflare

| Perkara | Nilai |
|---|---|
| Akaun | Akaun sekolah — `account_id` `d38ad14997c2236d1875f7289f774025` |
| Pelan | Workers Free |
| Worker laman hadapan | `sperk` (aset statik, SPA fallback) → `sperk.smk-lohan.workers.dev` |
| Worker API | `sperk-smk-lohan-api` → `sperk-smk-lohan-api.smk-lohan.workers.dev` |
| Secret worker API | `FIREBASE_SERVICE_ACCOUNT` (JSON akaun perkhidmatan Firebase), `ALLOWED_EMAILS` (senarai e-mel dibenarkan, dipisah koma) |
| Var worker API | `FIREBASE_PROJECT_ID=sperk-smk-lohan`, `ALLOWED_ORIGINS` |
| Log masuk wrangler | OAuth akaun `sperk.smklohan@gmail.com` |

> **Penting:** `account_id` telah dipin (*pinned*) dalam kedua-dua `wrangler.toml`. Ini kerana Gmail yang sama juga memiliki satu akaun Cloudflare peribadi yang kosong; pin memastikan setiap deploy sentiasa menuju ke akaun sekolah.

### 4.3 Firebase

| Perkara | Nilai |
|---|---|
| Projek | `sperk-smk-lohan` (Spark / percuma) |
| Authentication | E-mel/kata laluan; pengguna berdaftar: `sperk.smklohan@gmail.com` |
| Firestore | Mod produksi; koleksi `items`, `students`, `receipts`, `counters` |
| Akaun perkhidmatan | `firebase-adminsdk-fbsvc@sperk-smk-lohan.iam.gserviceaccount.com` (kunci disimpan sebagai secret Cloudflare + fail setempat yang tidak di-commit) |

### 4.4 Di mana setiap rahsia disimpan

| Rahsia | Lokasi simpanan | Di-commit? |
|---|---|---|
| Kata laluan akaun Gmail sekolah | Pengurus kata laluan / pihak sekolah | Tidak |
| Kunci akaun perkhidmatan Firebase (JSON) | Secret Cloudflare `FIREBASE_SERVICE_ACCOUNT`; salinan tempatan `worker/.dev.vars` (untuk pembangunan) | Tidak (gitignored) |
| Senarai pengguna dibenarkan | Secret Cloudflare `ALLOWED_EMAILS` | Tidak |
| Konfigurasi web Firebase (apiKey awam) | `frontend/.env.local` (tempatan); dibina ke dalam bundle | Tidak (kunci awam, bukan rahsia) |
| PAT GitHub | Git Credential Manager (PC ini) | Tidak |

---

## 5. Konfigurasi repositori

```
sprek-smk-lohan/
├─ frontend/                  # Laman hadapan (Vite)
│  ├─ src/                    # Kod SPA: pages/, features/, shared/
│  ├─ public/                 # logo.svg, logo-nav.svg, fonts/, panduan/Panduan_Pengguna_SPeRK.pdf
│  ├─ .env.local              # (gitignored) VITE_FIREBASE_* + VITE_API_BASE_URL
│  └─ wrangler.toml           # name="sperk", assets ./dist, account_id
├─ worker/                    # API (Cloudflare Worker)
│  ├─ src/                    # index.js (penghalaan), firestore.js, util.js, features/
│  ├─ .dev.vars               # (gitignored) FIREBASE_SERVICE_ACCOUNT, ALLOWED_EMAILS
│  └─ wrangler.toml           # name="sperk-smk-lohan-api", FIREBASE_PROJECT_ID, ALLOWED_ORIGINS, account_id
└─ docs/                      # Dokumentasi (termasuk dokumen ini)
```

| Fail | Kandungan penting |
|---|---|
| `frontend/.env.local` | `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`, `VITE_API_BASE_URL` |
| `worker/.dev.vars` | `FIREBASE_SERVICE_ACCOUNT='{...}'` (JSON satu baris), `ALLOWED_EMAILS=...` |
| `frontend/wrangler.toml` | Nama worker, `account_id` pin, aset `./dist`, SPA fallback |
| `worker/wrangler.toml` | Nama worker, `main`, `account_id` pin, vars awam |

**Sejarah penting:** projek Firebase lama (`resit-koperasi-lohan`) telah dipadamkan pada 18 Oktober 2026 selepas migrasi selesai. Jangan rujuk kepada projek itu lagi.

---

## 6. Model data Firestore

### 6.1 `students` (murid)

| Medan | Jenis | Nota |
|---|---|---|
| `name` | string | Nama penuh. |
| `icNumber` | string | 12 digit, disimpan berformat `######-##-####`. Pendua IC dikesan dengan membandingkan digit sahaja. |
| `formerPrimarySchool` | string | Mesti salah satu daripada senarai sekolah rendah (lihat `worker/src/features/e-daftar/schools.js`). |
| `tingkatan` | number \| null | 1–5. |
| `oku` | boolean \| null | |
| `registrationStatus` | string | `SUDAH` atau `BELUM`. |
| `registeredAt` | timestamp \| null | Diisi automatik apabila status bertukar `SUDAH`. |
| `registeredBy` | string \| null | E-mel pengguna yang menanda. |
| `transferSchool`, `transferReason`, `transferNotes` | string \| null | Permohonan penempatan semula. `transferReason` dipilih daripada senarai rasmi (`transferReasons` dalam `frontend/src/features/e-daftar/constants.js`); `transferNotes` diisi automatik dengan huraian sebab tersebut (boleh diedit). Nilai teks lain (import/rekod lama) tetap diterima dan dipaparkan sebagai *"(rekod lama)"* dalam borang. |
| `active` | boolean | `true` semasa dicipta. |
| `createdAt`, `updatedAt` | timestamp | |

### 6.2 `receipts` (resit)

| Medan | Jenis | Nota |
|---|---|---|
| *(ID dokumen)* | string | = `requestId` (UUID) daripada pelanggan → **kunci idempotensi**: permintaan berulang dengan ID sama tidak akan menjana resit pendua (dokumen dicipta dengan `mustNotExist`). |
| `receiptNo` | string | `YYYY-NNNNNN`, contoh `2026-000001`. |
| `year` | number | Tahun suratcara (waktu Malaysia). |
| `studentId`, `studentNameSnapshot`, `formerPrimarySchoolSnapshot` | | Salinan nama semasa jana — resit kekal tepat walaupun data murid berubah kemudian. |
| `items[]` | array | `{ itemId, itemNameSnapshot, variant, unitPriceSen, quantity, subtotalSen }`. |
| `totalSen` | number | Jumlah dalam sen (contoh `9700` = RM97.00). |
| `paymentMethod` | string | `CASH` atau `BANK_TRANSFER`. |
| `bankRef` | string \| null | No. rujukan (wajib bagi `BANK_TRANSFER`). |
| `status` | string | `ISSUED`. |
| `createdAt` | timestamp | |

**Penomboran resit:** nombor diambil daripada dokumen `counters/receipts-<tahun>` di dalam transaksi Firestore (`nilai = nilai + 1`). Untuk **mengulang semula penomboran** (contoh selepas bersih data ujian), tetapkan `value` kepada `0` — resit seterusnya akan menjadi `2026-000001`.

### 6.3 `items` (barangan koperasi)

| Medan | Jenis | Nota |
|---|---|---|
| `name` | string | Nama dipaparkan. |
| `priceSen` | number | Harga seunit dalam sen. |
| `active` | boolean | Hanya `true` boleh dijual (disenaraikan pada borang resit). |
| `fixedQuantity` | number \| null | Jika ada (contoh `1` untuk Keahlian Koperasi), kuantiti dikunci pada nilai itu dalam borang resit. |
| `koperasiMembership` | boolean | `true` untuk barangan keahlian → digunakan oleh Papan Pemuka untuk mengira murid yang telah membayar keahlian. |

Sebanyak 9 barangan disenaraikan (senarai harga penuh dalam *Panduan Pengguna*, Lampiran A).

### 6.4 `counters`

| Dokumen | Kandungan |
|---|---|
| `receipts-2026`, `receipts-2027`, … | `{ value: <nombor terakhir>, year, updatedAt }` |

### 6.5 Peraturan perniagaan penting

- **Harga pelayan:** jumlah resit sentiasa dikira semula oleh worker daripada `items.priceSen`.
- **Panduan dalam app:** pautan **Panduan** (bar atas), **Panduan Pengguna (PDF)** (footer dan halaman log masuk) merujuk kepada `public/panduan/Panduan_Pengguna_SPeRK.pdf`. Setiap kali manual dijana semula, salin PDF baharu ke folder itu sebelum `npm run build`.
- **Kongsi WhatsApp:** WhatsApp tidak membenarkan lampiran fail melalui pautan `wa.me`. App memuat turun PDF serentak apabila **Buka WhatsApp** ditekan (kotak *"Muat turun PDF resit supaya boleh dilampirkan"*), dan menyediakan butang **Kongsi PDF (peranti)** melalui Web Share API pada peranti yang menyokong perkongsian fail (Android/iPhone).
- **Keahlian koperasi** tidak disimpan pada murid; ia *diperoleh* daripada resit yang mengandungi barangan bertanda `koperasiMembership`.
- **Import murid:** maksimum 2,000 baris / 2 MB fail; baris dengan IC yang sudah wujud **dilangkau** (tidak diganti); penulisan dipecahkan kepada kelompok 400 untuk had Firestore.
- **Papan Pemuka:** tarikh "hari ini" menggunakan zon waktu **Malaysia (UTC+8)**.

---

## 7. API

Semua laluan selain `/api/health` memerlukan `Authorization: Bearer <Firebase ID token>`.

| Kaedah | Laluan | Fungsi |
|---|---|---|
| GET | `/api/health` | Semak kesihatan worker (awam). |
| GET | `/api/me` | E-mel pengguna yang disahkan. |
| GET | `/api/dashboard` | Statistik gabungan e-Daftar + e-Resit. |
| GET | `/api/students` | Senarai/carian murid — 50 baris/halaman (`q`, `tingkatan`, `status`, `school`, `offset`, `limit`); respons termasuk `students[]`, `total`, `hasMore`. |
| POST | `/api/students` | Tambah murid baharu. |
| GET | `/api/students/:id` | Butiran murid. |
| PUT | `/api/students/:id` | Kemas kini murid (hanya medan yang dihantar). |
| DELETE | `/api/students/:id` | Padam kekal satu murid. Klien mengesahkan kata laluan akaun melalui Firebase dahulu (kata laluan tidak dihantar ke API pelayan). |
| DELETE | `/api/students/bulk` | Padam kekal banyak murid — badan `{ "ids": [...] }`, maksimum 200 ID, satu commit atomik. Laluan ini disemak **sebelum** pola `/api/students/:id`. |
| POST | `/api/students/:id/status` | Tanda/batal daftar (`registrationStatus`). |
| POST | `/api/students/import` | Import senarai murid (JSON baris daripada fail Excel). |
| GET | `/api/items` | Senarai barangan. |
| GET | `/api/receipts` | Senarai resit (`q`, `from`, `to`, `limit`). |
| POST | `/api/receipts` | Jana resit (`requestId`, `studentId`, `paymentMethod`, `bankRef?`, `lines[]`). |
| GET | `/api/receipts/:id` | Butiran satu resit. |

Nota penting:

- **Paginasi:** `offset` (lalai 0) + `limit` (lalai 50, maksimum 200) mengehadkan payload kepada satu halaman (≈400 murid kini 6–8 halaman). Carian nama/IC dijalankan atas senarai penuh yang dicache — padanan tepat **tanpa** indeks Firestore tambahan.
- **Pemadaman adalah kekal:** pelayan tiada mekanisme *soft-delete*; pemulihan hanya melalui sandaran (§10). Resit lama kekal memaparkan nama murid (snapshot) walaupun rekod murid dipadam.
- **Nama HURUF BESAR:** semua respons menormalkan nama murid kepada HURUF BESAR (`publicStudent` dan `receiptSummary`) — paparan sahaja; data disimpan seperti diimport/ditaip.

Cuba cepat selepas deploy:

```powershell
curl.exe https://sperk-smk-lohan-api.smk-lohan.workers.dev/api/health
# {"status":"ok","time":"..."}
```

Halaman web tersedia di `https://sperk.smk-lohan.workers.dev` (SPA — semua laluan kembali ke `index.html`).

---

## 8. Aliran pembangunan dan deploy

### 8.1 Persediaan awal

```powershell
# Prasyarat: Node.js LTS, git; sekali sahaja:
cd frontend; npm install
cd ..\worker; npm install
npx wrangler login    # log masuk sebagai sperk.smklohan@gmail.com
```

### 8.2 Pembangunan tempatan

```powershell
cd frontend; npm run dev        # http://localhost:5173
cd worker;   npx wrangler dev   # API tempatan (menggunakan .dev.vars)
```

Asalan `http://localhost:5173` sudah dibenarkan dalam `ALLOWED_ORIGINS`.

### 8.3 Deploy ke produksi

```powershell
# 1. Laman hadapan
cd frontend
npm run build
npx wrangler deploy

# 2. API worker
cd ..\worker
npx wrangler deploy
```

Kedua-dua arahan akan menuju ke akaun sekolah kerana `account_id` dipin dalam fail `wrangler.toml`. Selepas deploy:

1. `curl.exe .../api/health` → `status: ok`.
2. Buka `https://sperk.smk-lohan.workers.dev`, log masuk, semak Papan Pemuka.
3. `npx wrangler deployments list` (dalam `worker/`) untuk mengesahkan versi terkini.

### 8.4 Mengemas kini rahsia (secret)

```powershell
cd worker
npx wrangler secret put FIREBASE_SERVICE_ACCOUNT   # tampal JSON SA satu baris
npx wrangler secret put ALLOWED_EMAILS             # emel dipisah koma
```

Selepas menukar secret, worker mengambil versi baharu dalam beberapa saat tanpa perlu deploy semula kod.

### 8.5 Membina semula selepas menukar `.env.local`

`VITE_*` dibaca semasa **build**, bukan semasa jalan. Selepas mengubah `frontend/.env.local`, ulang `npm run build` + `npx wrangler deploy`.

---

## 9. Pengurusan pengguna dan keselamatan

### 9.1 Menambah pengguna baharu

1. **Firebase Console** → projek `sperk-smk-lohan` → *Authentication* → *Add user* → masukkan e-mel + kata laluan sementara.
2. Tambah e-mel itu ke dalam `ALLOWED_EMAILS` (secret worker):

```powershell
cd worker
npx wrangler secret put ALLOWED_EMAILS
# contoh input: sperk.smklohan@gmail.com,guru.lain@moe-dl.edu.my
```

3. Uji log masuk dengan akaun baharu → `/api/me` patut mengembalikan e-mel tersebut.

### 9.2 Membuang pengguna

Buang e-mel daripada `ALLOWED_EMAILS` (dan padam pengguna dalam Firebase Console jikaakaun tidak diperlukan lagi). Kesan serta-merta pada permintaan API seterusnya.

### 9.3 Tetapan semula kata laluan

1. Firebase Console → *Authentication* → pilih pengguna → **Reset password** (menghantar e-mel penetapan semula kepada pemilik akaun), atau
2. Pengguna sendiri membuka pautan *forgot password* Firebase (sistem kini tiada pautan itu dalam UI — penetapan semula dibuat oleh pentadbir).

### 9.4 Amalan keselamatan

- Jangan **pernah** commit `.env.local`, `.dev.vars`, kunci perkhidmatan atau token.
- Guna PAT GitHub berskop minimum (*Contents: Read & Write*, tempoh terhad) untuk push dari PC ini; jika PC bertukar milik, **revoke** PAT itu dan janakan yang baharu.
- Sekiranya kunci akaun perkhidmatan terdedah: janakan kunci baharu dalam Firebase Console → kemas kini secret `FIREBASE_SERVICE_ACCOUNT` → padam kunci lama.
- Simpan maklumat pemulihan akaun Gmail (nombor telefon/kod sandaran) di tempat yang selamat — ia membuka akses kepada GitHub, Cloudflare dan Firebase sekaligus.

---

## 10. Sandaran dan pemulihan data

Firestore pada pelan Spark **tidak menyokong eksport terjadual** daripada konsol. Amalan yang digunakan:

### 10.1 Sandaran (disyorkan setiap bulan / sebelum aktiviti besar)

1. Baca koleksi melalui REST Firestore (akaun perkhidmatan) atau skrip Node ringkas — hasilkan fail JSON bagi setiap koleksi:
   - `items.json`, `students.json`, `receipts.json`, `counters.json`.
2. Simpan fail berkenaan dalam storan awan koperasi (contohnya Google Drive akaun rasmi) **di luar repositori awam**.

Skrip semakan/sandaran boleh diletakkan dalam folder alat tempatan (tidak di-commit); gunakan `FIREBASE_SERVICE_ACCOUNT` daripada `worker/.dev.vars` dan projek `sperk-smk-lohan`.

### 10.2 Pemulihan

- **Resit** tidak boleh dijana semula secara automatik — simpan sandaran `receipts` sebagai suratcara rasmi.
- Untuk memulihkan data: cipta semula dokumen melalui konsol Firestore atau guna skrip yang menulis dokumen JSON kembali ke koleksi berkenaan.
- Sekiranya projek Firebase terpadam secara tidak sengaja, Google menyimpan projek selama **~30 hari** (boleh dipulihkan melalui Google Cloud Console), tetapi jangan bergantung pada ini.

---

## 11. Pemantauan dan penyelesaian masalah

### 11.1 Pemantauan

| Alat | Kegunaan |
|---|---|
| `npx wrangler tail` (dalam `worker/`) | Log masa nyata permintaan API + ralat. |
| `npx wrangler deployments list` | Semak versi deploy terkini. |
| Cloudflare Dashboard → Workers → Metrics | Kuantiti permintaan, kadar ralat. |
| Firebase Console → Firestore → Usage | Penggunaan baca/tulis harian. |
| `/api/health` | Semakan pantas worker hidup. |

### 11.2 Masalah biasa

| Gejala | Punca biasa | Tindakan |
|---|---|---|
| "Konfigurasi Firebase tidak lengkap" selepas buka laman | `frontend/.env.local` hilang / tidak lengkap | Isi semula, `npm run build`, deploy semula. |
| 403 "Akaun tidak dibenarkan" | E-mel tiada dalam `ALLOWED_EMAILS` | Tambah e-mel melalui `wrangler secret put`. |
| 401 / log masuk meluru keluar | Token tamat atau jam peranti jauh berbeza | Log masuk semula; pastikan tarikh/masa komputer betul. |
| 500 daripada API | Secret `FIREBASE_SERVICE_ACCOUNT` tidak sah/dipadam | Janakan kunci baharu, kemas kini secret. |
| Laman putih selepas deploy | `dist/` kosong (build gagal) | Jalankan `npm run build` semula, deploy. |
| Deploy menuju akaun salah | Wrangler log masuk sebagai akaun peribadi | `npx wrangler login` sebagai `sperk.smklohan@gmail.com`; pastikan `account_id` kekal dipin. |
| "Resit mungkin telah disimpan" semasa simpan | Sambungan terputus selepas simpan berjaya (perlindungan idempotensi) | Buka **Sejarah Resit** — jangan jana semula. |
| Papan Pemuka menunjukkan angka lama | Cache murid (60 saat) dan papan pemuka (30 saat) dalam worker | Tunggu sebentar, muat semula halaman. |

---

## 12. Kapasiti, had dan kos

### 12.1 Kapasiti direka

Skala rasmi untuk hari pendaftaran (anggaran 300–400 murid, 30–40 peranti serentak):

| Parametra | Kapasiti direka | Catatan |
|---|---|---|
| Murid aktif | 300–400 (import maksimum 2,000 baris sekali gus) | Senarai dipaparkan 50 baris/halaman; cache memegang senarai penuh (~160 KB untuk 400 murid). |
| Peranti serentak | 30–40 peranti | Setiap peranti menyemak senarai setiap 30 saat; cache senarai dikongsi antara isolate dalam rantau (PoP) yang sama, dengan muatan penuh sekali dan kemudian hanya dokumen yang berubah. |
| Anggaran permintaan | ≤ ~40,000/hari (40 peranti × 30 saat × 8 jam + tindakan kaunter) | Di bawah had Cloudflare Free (~100,000/hari). |
| Masa muatan disasarkan | <1–2 saat selepas cache panas; muatan sejuk pertama 3–5 saat | Muatan sejuk menarik kunci Google + soalan penuh + render sekali sahaja. |

Apabila melebihi kapasiti direka (melebihi ~1,000 murid atau ~50 peranti), sistem masih berfungsi tetapi pertimbangkan: indeks komposit Firestore, cache merentas rantau (Cloudflare KV / Workers DO), dan carian berindeks.

### 12.2 Had operasi

| Had | Nilai | Sebab / catatan |
|---|---|---|
| Badan permintaan borang | 20 KB | Perlindungan `readJson`. |
| Badan import | 1 MB / 2,000 baris / fail ≤2 MB | Pecahkan fail besar kepada beberapa import. |
| Halaman senarai murid | 50 baris (lalai), maksimum 200 | Parameter `offset` + `limit`. |
| Padam pilihan (bulk) | 200 ID setiap panggilan | Firestore had 500 tulisan/commit; ulangi mengikut kumpulan. |
| Padam murid | **Kekal** — tiada fungsi "undur" | Sandaran (§10) ialah satu-satunya pemulihan. |
| Baris resit | 1–30 item; kuantiti 1–99 | Pengesahan `validateBody`. |
| Senarai resit | had 100 (lalai), maksimum 200 | Parameter `limit`. |
| Kiraan hari papan pemuka | Kaunter harian (1 bacaan) | Menggunakan kaunter `counters/daily-YYYY-MM-DD` yang dikemas kini dalam transaksi yang sama dengan resit. |
| Kesegaran antara peranti | ≤ 10–15 saat | Cache murid 10 saat (delta sync); tulisan membersihkan cache segerak. |
| Carian nama/IC | Padanan "setiap perkataan" atas senarai penuh dalam memori | Tiada carian penuh teks (full-text) Firestore. |
| Nama murid | Dipaparkan **HURUF BESAR** di semua skrin, resit, PDF, WhatsApp | Paparan sahaja; data disimpan seperti diimport. |
| Akaun pengguna | Senarai benar `ALLOWED_EMAILS` (e-mel sahaja) | Tiada peranan/pengguna biasa — semua akaun yang dibenarkan mempunyai akses penuh. |

### 12.3 Cache dan kesegaran data

| Lapisan | TTL | Skop |
|---|---|---|
| Senarai murid (memori + Cache API) | 10 saat + delta | Per-PoP; muatan penuh sekali sahaja, kemudian hanya dokumen yang berubah (`updatedAt`); tulisan tunggal digabung terus ke cache. |
| Papan pemuka | 30 saat | Per-PoP; angka hari ini dibaca daripada kaunter harian (1 bacaan). |
| Token Google (akses Firestore) | 1 jam | Per-isolate; dipra-ambil pada permintaan awal (selari dengan pengesahan JWT pengguna). |
| Token pengguna (JWT) | 5 minit | Per-isolate; pengesahan ulangan dilangkau. |
| Auto-segar senarai e-Daftar | 30 saat | Per-peranti (dihentikan semasa menaip atau dialog terbuka). |
| Aset statik berhash (`/assets/*`) | 1 tahun (immutable) | Ditetapkan melalui `frontend/public/_headers` (Workers static assets). |
| Fon (`/fonts/*`) | 1 tahun (immutable) | WOFF2 subhimpunan Latin; ~84% lebih kecil daripada TTF asal. |

### 12.4 Kos dan had pelan percuma

Sistem ini direka supaya kekal dalam pelan percuma untuk skala sebuah sekolah:

| Perkhidmatan | Pelan | Had percuma (anggaran) |
|---|---|---|
| Cloudflare Workers | Free | ~100,000 permintaan/hari. |
| Cloudflare | Free | Bandwidth aset statik besar; mencukupi. |
| Firebase Authentication | Spark | Puluhan ribu pengguna aktif bulanan; 1 akaun sahaja digunakan. |
| Cloud Firestore | Spark | ~50k bacaan + ~20k tulisan sehari, 1 GiB storan. |

**Nasihat:** jangan naik taraf pelan atau memasukkan kad kredit tanpa keperluan. Pantau penggunaan Firestore semasa musim pendaftaran; jika hampir had, hubungi penyelenggara untuk mengoptimumkan pertanyaan.

---

## 13. Sejarah migrasi dan rekod perubahan

| Tarikh | Perubahan |
|---|---|
| 2026 (fasa awal) | Projek dibangunkan di bawah akaun peribadi (`srpk2026@gmail.com`): GitHub `srpk2026/…`, Firebase `resit-koperasi-lohan`, Cloudflare akaun sama. |
| **18 Okt 2026** | **Migrasi penuh ke akaun rasmi sekolah `sperk.smklohan@gmail.com`:** repositori dipindahkan ke `SPeRK-SMKLohan/SPeRK-SMK-Lohan` (sejarah penuh dikekalkan); projek Firebase baharu `sperk-smk-lohan` (auth + Firestore disemai semula: 9 barangan); Cloudflare kekal akaun sekolah-akaun yang sama, Gmail sekolah dijadikan Super Admin, akaun lama dibuang; `account_id` dipin dalam kedua-dua `wrangler.toml`; penomboran resit dimulakan semula pada `2026-000001`. |
| 18 Okt 2026 | Projek Firebase lama `resit-koperasi-lohan` dipadamkan oleh pemilik selepas pengesahan silang (permintaan lama tidak lagi berfungsi). Google akan membersihkan sisa dalam ~30 hari. |
| 18 Okt 2026 | Reka bentuk UI "Warm Slate" dimuktamadkan dan didokumentasikan (`docs/Reka_Bentuk_UI-UX_SPeRK.md`). |
| 18 Okt 2026 | Penempatan semula: **Sebab** kini senarai pilihan rasmi dengan **autofill Catatan**; **Kongsi WhatsApp** memuat turun PDF resit serentak (butang **Kongsi PDF** pada peranti menyokong Web Share); pautan **Panduan Pengguna (PDF)** ditambah pada bar atas, footer dan halaman log masuk. |
| 18 Okt 2026 | Panduan Pengguna & Panduan Teknikal (dokumen ini) diterbitkan bersama tangkapan skrin. |
| 18 Okt 2026 | **Padam murid**: butang **Padam** pada setiap baris e-Daftar + dialog pengesahan **kata laluan akaun** (disahkan melalui Firebase — kata laluan tidak dihantar ke API pelayan). Pemadaman **kekal**; `DELETE /api/students/:id`. |
| 18 Okt 2026 | **Padam pilihan (bulk)**: kotak semak setiap baris + "Pilih semua" + toolbar **Padam Terpilih** — maksimum 200 ID dalam satu commit atomik, pengesahan kata laluan; `DELETE /api/students/bulk` (laluan disemak sebelum pola `:id`). |
| 18 Okt 2026 | **Nama murid HURUF BESAR** pada semua skrin, resit, PDF dan mesej WhatsApp (normakan pada lapisan API — paparan sahaja, tiada migrasi data). |
| 18 Okt 2026 | **Prestasi produksi (fasa 2)**: (a) fon bertukar TTF → **WOFF2 subhimpunan Latin** (Inter 876 KB → 138 KB, Plus Jakarta 176 KB → 47 KB, Roboto Mono 184 KB → 51 KB; ~1 MB dijimatkan pada muatan pertama); (b) **cache lama** ditetapkan melalui `frontend/public/_headers` (aset berhash dan fon 1 tahun *immutable*; PDF 7 hari); (c) **pramuat fon kritikal** + `preconnect` ke Google Identity Toolkit dan API worker dalam `index.html`; (d) **cache senarai murid delta-sync** (muatan penuh sekali, kemudian hanya dokumen berubah — bacaan Firestore kekal kecil walaupun 30–40 peranti meninjau setiap 30 saat; dikongsi antara isolate melalui Cache API); (e) **papan pemuka** menggunakan kaunter harian (1 bacaan) dan medan `koperasiMember` pada murid (tiada lagi imbasan penuh koleksi resit); (f) `findStudentByIC` ditukar kepada pertanyaan tepat (1 bacaan) dengan sandaran senarai cache; (g) token Google dipra-ambil selari dengan pengesahan JWT pengguna; (h) logo SVG dioptimumkan (65 KB → 24 KB) untuk nav/favicon/log masuk; logo resit kekal tidak berubah. Anggaran bacaan Firestore harian turun daripada ~170k kepada ~15k (kekal dalam pelan Spark). |
| 18 Okt 2026 | Kemasan UI/UX: bar atas satu baris dengan logo dipotong rapat (tanpa bulatan); menu lungsur boleh dibaca; Papan Pemuka tanpa panel *Kemajuan Hari Pendaftaran*; halaman e-Daftar dinyahsesak (kad statistik, bar kemajuan dan notis bawah senarai dibuang; e-mel penanda tidak lagi dipaparkan); borang murid diratakan (tiada kotak kad dalam borang) dengan radio sejajar; templat import bertanda **(wajib)/(pilihan)** (penghurai mengabaikan penanda ini); fon angka bertukar kepada **Roboto Mono**. Tangkapan skrin manual diambil semula. |

**Sisa pilihan (tidak menjejaskan sistem):** akaun GitHub lama `srpk2026` (tiada repositori) dan pengguna Cloudflare lama `srpk2026` (tiada akaun) masih wujud; boleh dipadamkan oleh pemiliknya pada bila-bila masa.

---

## Rujukan dokumen lain dalam repositori

| Dokumen | Kandungan |
|---|---|
| `docs/Panduan_Pengguna_SPeRK.md` | Manual pengguna akhir (guru/kakitangan). |
| `docs/Dokumentasi_SPeRK_SMK_Lohan.md` | Dokumentasi projek (konteks, keperluan, koperasi). |
| `docs/Reka_Bentuk_UI-UX_SPeRK.md` | Sistem reka bentuk Warm Slate, tipografi, aksesibiliti. |
| `README.md` | Ringkasan projek dan panduan pemasangan pantas untuk pembangun. |

---

*Dokumen dalaman — kemas kini apabila infrastruktur, pengguna atau ciri berubah. Sumber Markdown: `docs/Panduan_Teknikal_SPeRK.md`.*

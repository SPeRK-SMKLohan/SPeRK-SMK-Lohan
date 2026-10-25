# SPeRK SMK Lohan — Dokumen Reka Bentuk UI/UX

**Panduan lengkap keadaan semasa, aliran pengguna dan pelan reka bentuk semula dengan Google Stitch AI.**

| | |
|---|---|
| Sistem | SPeRK — Sistem Pengurusan Pelajar dan Resit Koperasi |
| Sekolah | SMK Lohan, Ranau, Sabah |
| Skrin | 9 (7 aliran utama + log masuk + ralat 404) |
| Platform | Aplikasi web (penghalaan hash), desktop-first, menyokong tablet |
| Alat reka bentuk baharu | Google Stitch AI — https://stitch.withgoogle.com |
| Versi dokumen | 1.1 · 18 Oktober 2026 (tema “Warm Slate” dilaksanakan) |

---

## 0. Cara guna dokumen ini

1. **Bahagian 1–3** ialah sumber kebenaran (source of truth) bagi fungsi dan rupa UI semasa.
   Jangan ubah semasa mereka bentuk — ia menyatakan apa yang mesti terus berfungsi.
2. **Bahagian 4** menyatakan kekangan keras (mesti dikekalkan) dan kebebasan kreatif
   (tema baharu sepenuhnya dibenarkan: palet, tipografi, bentuk, kedalaman).
3. **Bahagian 5–6** ialah proses kerja Stitch AI dan **pustaka prompt sedia guna** untuk
   setiap skrin — salin tampal terus ke Stitch.
4. **Bahagian 7–9** ialah senarai semak penerimaan, fail `DESIGN.md` untuk Stitch, dan
   peta pelaksanaan ke kod (kelas CSS dan token sedia ada).

> **Ringkasan keputusan reka bentuk:** tema visual baharu sepenuhnya dibenarkan
> (warna, fon, bentuk, kedalaman). Yang kekal: logo sekolah, nama SPeRK, bahasa Melayu,
> semua fungsi, dan **halaman resit yang mesti kekal gaya dokumen rasmi** (lihat 4.1).

> **Status pelaksanaan (18 Oktober 2026):** tema **Warm Slate** daripada eksport Google
> Stitch telah dilaksanakan sepenuhnya pada frontend — lihat 2.2 dan 2.3 yang dikemas kini.
> Spesifikasi skrin dalam 2.5 kekal sebagai rujukan **struktur, kandungan dan interaksi**;
> butiran gaya visual kini mengikut sistem reka bentuk baharu dalam 2.3.

---

## 1. Pengenalan

### 1.1 Apakah SPeRK

SPeRK ialah aplikasi web sekolah dengan **dua ciri yang berkongsi satu pangkalan data murid**:

- **e-Daftar** — pendaftaran murid: sekolah rendah terdahulu, nama, No. IC, status OKU,
  status daftar (kehadiran hari pendaftaran) dan penempatan semula. Dioptimumkan sebagai
  **kaunter hari pendaftaran**: cari murid, tekan **Tanda daftar** (satu ketukan).
- **e-Resit Koperasi** — kaunter bayaran koperasi: pilih murid, tambah barangan,
  pilih pembayaran (**Tunai** atau **Pindahan Bank**), simpan resit; cetak/PDF kongsi
  WhatsApp.

Sokongan: **Papan Pemuka** (statistik), **Import Data** (fail `.xlsx`), **Barangan**
(senarai harga rasmi — 9 item), **Sejarah Resit**.

### 1.2 Pengguna & konteks penggunaan

| Peranan | Konteks | Peranti utama |
|---|---|---|
| Petugas kaunter pendaftaran | Hari pendaftaran: 300–400 murid Tingkatan 1 beratur; berbilang kaunter serentak; murid dijangka tahu nama sahaja | Laptop kaunter / tablet — **laju mengalahkan segala-galanya** |
| Petugas koperasi | Bayaran tunai/pindahan bank; resit rasmi dicetak untuk ibu bapa | Laptop/tablet kaunter koperasi |
| Pentadbir / kerani data | Import senarai penuh (~1,800 murid), semak sejarah, pembetulan butiran | Desktop |

Ciri konteks yang mempengaruhi reka bentuk:

- **Berbilang kaunter serentak** — senarai perlu sentiasa segar (auto-refresh 30 saat) dan
  tindakan satu ketukan mesti pantas serta boleh dibatalkan (undo).
- **Operasi tekanan tinggi** — teks kecil dielakkan; sasaran ketuk ≥ 44 px; keadaan sibuk dan
  ralat mesti jelas.
- **Data peribadi** — No. IC sentiasa **bertopeng** (`******-**-0001`) dan tidak pernah
  muncul pada resit atau mesej WhatsApp.

### 1.3 Prinsip UX SPeRK

1. **Kelajuan kaunter** — satu ketukan untuk menanda; Enter untuk menanda padanan tunggal;
   carian kabur (nama + No. IC); fokus diletak pada carian sebaik halaman dibuka.
2. **Boleh dipulihkan** — tiada pengesahan mengganggu untuk tindakan pantas; sebaliknya
   **toast dengan butang "Batal"** (8 saat) membatalkan tindakan. Pengesahan hanya untuk
   tindakan memusnah (Batal daftar).
3. **Keterlihatan status sekilas pandang** — warna baris, lencana `✓ Sudah daftar`,
   kiraan `Sudah / Belum / Hari ini` pada Papan Pemuka dan masa menanda pada senarai.
4. **Perlumbaan data selamat** — UI optimistik (status berubah serta-merta), respons basi
   dibuang (`mutationGen`), auto-refresh dilangkau semasa sibuk/dialog/penaipan.
5. **Konteks tempatan** — semua teks Bahasa Melayu, RM, masa Malaysia (UTC+8),
   istilah sekolah Malaysia (SK terdahulu, penempatan semula, koperasi).
6. **Kebolehcapaian** — fokus kelihatan (outline 3 px), `aria-label` pada kumpulan kawalan,
   dialog natif, `prefers-reduced-motion`, kontras teks ≥ WCAG AA.
7. **Nombor rasmi tidak boleh silap** — susunan item mengikut senarai harga rasmi;
   nombor resit dijana pelayan (bukan UI); simpan-tanpa-tekan-dua-kali (idempotensi).

### 1.4 Metrik kejayaan reka bentuk semula

- Menanda kehadiran seorang murid **< 5 saat** dari kotak carian (dengan latihan).
- **Sifar kehilangan fungsi** berbanding senarai semak Bahagian 4.3.
- Semua skrin mematuhi kontras WCAG AA dan sasaran ketuk ≥ 44 px.
- Rupa baharu kelihatan **konsisten antara 9 skrin** (satu bahasa visual).
- Resit cetakan **100% kekal format rasmi** (bukan sebahagian daripada tema baharu).

---

## 2. Inventori UI/UX semasa

### 2.1 Peta halaman & navigasi

Navigasi berasaskan hash (tiada muat semula halaman). Pandangan berkongsi satu rangka (shell).

| Laluan | Nama skrin | Fail |
|---|---|---|
| `#/login` | Log Masuk (skrin penuh, tanpa navigasi) | `frontend/src/pages/login.js` |
| `#/` | Papan Pemuka | `frontend/src/pages/dashboard.js` |
| `#/pendaftaran` | e-Daftar — kaunter pendaftaran | `frontend/src/features/e-daftar/page.js` |
| `#/import` | Import Data | `frontend/src/features/e-daftar/import-page.js` |
| `#/jana-resit` | e-Resit Koperasi — jana resit | `frontend/src/features/e-resit/page.js` |
| `#/barangan` | Barangan (senarai harga) | `frontend/src/features/e-resit/items-page.js` |
| `#/sejarah` | Sejarah Resit | `frontend/src/features/e-resit/history-page.js` |
| `#/resit/{id}` | Butiran Resit (+ cetak/PDF/WhatsApp) | `frontend/src/features/e-resit/receipt-page.js` |
| lain-lain | 404 — Halaman tidak dijumpai | `frontend/src/main.js` |

Pindahan jalan lama: `#/murid` → `#/pendaftaran` · `#/e-daftar` → `#/pendaftaran` ·
`#/e-resit` → `#/jana-resit`. Sokongan pertanyaan: `#/jana-resit?student=<id>` (pra-pilih murid).

**Kumpulan menu** (dalam topbar):

- **Papan Pemuka** → `#/`
- **e-Daftar** → `Pendaftaran`, `Import Data`
- **e-Resit Koperasi** → `Jana Resit`, `Barangan`, `Sejarah Resit`

Butiran Resit mengekalkan `Sejarah Resit` sebagai menu aktif.

### 2.2 Rangka aplikasi (shell)

Fail: `frontend/src/main.js`, `frontend/src/style.css`

1. **Devbar** (mod pembangunan sahaja, tersembunyi di produksi, `.no-print`):
   `Mod pembangunan: disambung ke pangkalan data sebenar`.
2. **Header** (`.topbar`, `position: sticky`, `.no-print`; **satu baris** sahaja, tinggi ≈72 px,
   latar legap `rgba(249,249,249,.92)` + kesan kabur, bayang bawah halus):
   - Logo sekolah 42 px **dipotong rapat tanpa bulatan atau latar** (`logo-nav.svg`;
     `.brand-badge` + `.brand-logo`) + nama **`SPeRK SMK Lohan`**
     (fon tajuk, 22 px, tebal 600, `.brand-name`).
   - **Navigasi**: pautan `Papan Pemuka` + dua menu lungsur (`e-Daftar`, `e-Resit Koperasi`;
     `.nav-drop`). Menu terbuka melalui hover/fokus dan **klik** (sokongan sentuh);
     pautan aktif ialah pil gelap `#1E2A3A`.
   - Kanan: e-mel pengguna (`.who`) + butang **`Log Keluar`** (latar kelabu lembut, teks
     terracotta; hover terracotta penuh dengan teks putih).
   - Bawah 1080 px barulah navigasi melipat ke baris kedua secara automatik (tiada sidebar).
3. **Kandungan** — `main.page` selebar **maks 1120 px**, padding `40px 24px 64px`.
4. **Footer** (`.footer`, `.no-print`): latar `#F3F3F4`, dua teks — hak cipta
   (`© {tahun} SMK Lohan, Ranau, Sabah. Hak Cipta Terpelihara.`) dan nama penuh sistem.

Cetakan: `.no-print` (devbar, header, footer, semua toolbar, kad WhatsApp, toast)
disembunyikan; hanya kad resit dicetak.

### 2.3 Sistem reka bentuk — tema “Warm Slate” (dilaksanakan)

Tema daripada eksport Google Stitch (18 Oktober 2026), dilaksanakan sepenuhnya dalam
`frontend/src/style.css`. Semua nama kelas lama dikekalkan supaya JS tidak berubah
(kecuali kelas rangka lama `.topbar-main` / `.nav-group*` / `.container` yang diganti).

**Token warna** (`:root` dalam `style.css`):

| Token | Nilai | Guna |
|---|---|---|
| `--primary` | `#1E2A3A` | Butang utama, pil navigasi aktif, bulatan langkah |
| `--primary-deep` | `#091525` | Hover butang utama, warna tajuk |
| `--accent` | `#8C322A` | Pautan, teks “Log Keluar”/“Batal daftar”, toast amaran |
| `--accent-soft` | `#FFDAD5` / teks `#76221B` | Lencana “Sudah daftar” (terracotta lembut) |
| `--green` / `--green-soft` | `#205B3E` / `#E8F3EC` | **Kejayaan sahaja**: pil “sah”, notis import selesai, lencana “n dalam resit” |
| `--indigo-soft` | `#D7E3F9` / teks `#101C2C` | Tag tingkatan (T1), lencana “Pindahan Bank” |
| `--gold-soft` | `#FFDEA6` / teks `#271900` | Tag OKU |
| `--amber-soft` | `#FEF7E6` / teks `#8C6505` | Devbar, lencana “Pendua” |
| `--danger-soft` | `#FFDAD6` / teks `#93000A` | Lencana “Tidak sah”, butang buang |
| `--background` | `#F9F9F9` | Latar halaman |
| `--surface` / `--surface-low` | `#FFFFFF` / `#F3F3F4` | Kad & header / footer, kepala jadual, latar input |
| `--surface-mid` … `--surface-highest` | `#EEEEEE` … `#E2E2E2` | Butang neutral, hover menu, item menu aktif |
| `--text-primary` / `--text-secondary` | `#1A1C1C` / `#44474C` | Teks utama / sekunder (`.muted`) |
| `--border` / `--border-strong` | `#E8E8E8` / `#C5C6CC` | Garis baris jadual / sempadan tegas |

**Tipografi:** tajuk **Plus Jakarta Sans** (100–900), teks/UI **Inter** dan angka/nombor
**Roboto Mono** — semuanya dihoskan sendiri dari `/fonts/` (Urbanist dibuang). `h1` 28 px/600 ·
`h2` 18 px/600 · body 14 px/1.45 · label huruf besar kecil 11 px/600 · nilai statistik 32 px/600 ·
amaun wang guna `--font-mono` (Roboto Mono, 13.4 px/500) dengan digit tabular.

**Bentuk, bayang & gerakan:** radius `8 px` (kawalan/butang/input), `12 px` (kad & dialog;
16 px untuk dialog dan kad log masuk), `999 px` (pil/lencana). Bayang satu
lapis halus untuk kad (`--shadow-card`), bayang lebih tinggi untuk hover kad navigasi
(`--shadow-raise`), dan bayang besar untuk dialog (`--shadow-modal`).
Fokus: outline 2 px `#8C322A` offset 2 px. `prefers-reduced-motion` mematikan semua peralihan.

**Plat guna semula yang sedia ada:**

| Komponen | Kelas | Ciri penting |
|---|---|---|
| Kad | `.card` | Latar putih, radius 12 px, bayang halus, padding 20/24 px |
| Panel metrik | `.cards` + `.card.stat` | **Satu jalur panel** dengan sel berselang latar; nombor 32 px |
| Kad navigasi | `.nav-cards` / `.nav-card` | Grid auto-fit, hover naik sedikit + bayang lebih tinggi |
| Butang | `.btn` (+ `.primary`, `.ok`, `.danger`, `.wa`, `.small`, `.block`) | Semua sasaran ketuk ≥ 40 px (44 px lalai) |
| Input | `.input` (+ `.input-lg`, `.input-school`); `.stepper` | Latar abu `#F3F3F4`, fokus putih + cincin gelap; stepper −/＋ untuk kuantiti |
| Barisan alat | `.toolbar`, `.search-row`, `.filter-row` | Flex wrap |
| Chip penapis | `.chips` / `.chip` | Kontrol bersegmen; aktif = pil gelap; chip status ada titik |
| Jadual | `.table-wrap`, `.table` (+ `.wide` min 880 px, `.compact`, `.num` mono) | Kepala abu huruf besar, garis baris `#E8E8E8` |
| Lencana status | `.badge` (+ `.done` terracotta, `.cart` hijau, `.indigo`, `.bad`, `.warn`) | “✓ Sudah daftar” terracotta; “Belum daftar” kelabu |
| Tag kecil | `.tag` (+ `.tag.oku`) | “T1” indigo, “OKU” kuning lembut |
| Pil ringkasan | `.pill` (+ `.ok`, `.bad`, `.warn`) | Import: nombor besar + label kecil dalam jubin |
| Langkah bernombor | `.step` / `.step-num` | Bulatan 32 px gelap + tajuk (Jana Resit) |
| Pilihan bayaran | `.pay-option` | Kad radio; yang dipilih bersempadan cincin gelap |
| Dialog | `.modal` (dialog natif) | Bar aksen gradien di atas, backdrop 45% + kabur, toolbar bawah kelabu |
| Toast | `.toast-wrap`, `.toast`, `.toast-action` | Bawah tengah, gelap `#1E2A3A`, tindakan “Batal” terracotta lembut |
| Baris khas | `.row-done` (latar kelabu lembut), `.row-in-cart` (latar hijau lembut) | Isyarat keadaan baris tanpa mengganggu |
| Butiran resit | `.receipt-toolbar`, `.receipt-main`, `.receipt-layout` + `aside` WhatsApp | Toolbar jalur kelabu; resit kiri, kad kongsi kanan (satu lajur < 1020 px) |
| Log masuk | `.login-wrap`, `.login-card`, `.login-crest` | Kad tengah 420 px; logo 84 px bertindih di atas bucu; cahaya ambien halus |
| Footer | `.footer`, `.footer-in` | Jalur `#F3F3F4` dua teks (hak cipta + nama sistem) |

**Pengecualian penting — Resit:** kad resit (`#/resit/{id}`, PDF dan cetakan) **keluar dari
sistem reka bentuk**. Ia menggunakan **Helvetica** untuk semua teks dan **Times New Roman**
hanya untuk nama koperasi + tajuk resit. Gaya dokumen rasmi: tajuk bergaris tebal atas/bawah,
jadual item lajur tetap (44/14/21/21%), footer "Jumlah Keseluruhan". Jangan reka semula kad ini.
Lihat 2.5 S9.

### 2.4 Galeri komponen & keadaan kongsi

- **Keadaan sibuk** — butang dilumpuhkan + teks berubah: `Sedang log masuk...`, `Menyimpan…`,
  `Mengimport...`, `Menjana PDF...`.
- **Keadaan kosong** — ayat membimbing (contoh: `Belum ada resit.`, `Tiada barangan.`,
  `Belum ada data murid. Import senarai murid dahulu...`).
- **Keadaan ralat** — teks merah dekat tempat kejadian (`.error`), bukan hanya toast.
- **Toast** — hanya di e-Daftar: putih pada gelap, dengan butang tindakan `Batal` (undo).
- **Fokus** — diletak automatik pada kotak carian e-Daftar apabila halaman dibuka;
  pintasan papan kekunci `/` memfokus carian dari mana-mana.

### 2.5 Spesifikasi skrin

#### S1 · Log Masuk — `#/login`

**Tujuan:** pengesahan staf (e-mel + kata laluan). Sesi kekal selepas tab ditutup; pengguna log keluar melalui butang Log Keluar.
**Susun atur:** skrin penuh tanpa navigasi; kad tengah (maks 380 px) atas latar lembut;
logo sekolah 80 px di atas sekali.

**Kandungan & teks:**
- Tajuk `Log Masuk`; sub `Sistem Pengurusan Pelajar dan Resit Koperasi (SPeRK) SMK Lohan, Ranau`
- Medan `E-mel` + `Kata laluan` (label di atas input, autocomplete)
- Ralat sebaris (contoh: `E-mel atau kata laluan tidak betul.`,
  `Terlalu banyak percubaan. Sila cuba lagi sebentar.`, `Tiada sambungan rangkaian.`)
- Butang utama penuh: `Log Masuk` → sibuk: `Sedang log masuk...`
- Butang 403: `Akaun ini tidak dibenarkan menggunakan sistem.`

**Interaksi:** Enter menghantar borang; butang dilumpuhkan semasa proses.
**Keadaan:** lalai, sibuk, ralat (validasi kosong `Sila isi e-mel dan kata laluan.`).

#### S2 · Papan Pemuka — `#/`

**Tujuan:** ringkasan statistik + aktiviti resit + pintasan kerja.
**Susun atur (urut):** tajuk → panel 4 metrik → 2 kad navigasi → kad resit terkini.

**Kandungan & teks:**
- Tajuk `Papan Pemuka` + nama penuh sistem.
- **Panel metrik (4 sel satu panel):** `Belum daftar` · `Sudah daftar` ·
  `Didaftarkan hari ini` · `Keahlian koperasi` (nombor besar, digit tabular).
- **Dua kad navigasi:** `e-Daftar` —
  *“Sekolah terdahulu, status OKU, status daftar dan permohonan penempatan semula murid.”*;
  `e-Resit Koperasi` — *“Menjana resit bayaran barangan koperasi untuk murid.”*
- **Kad `Resit Koperasi`:** baris ringkasan `Resit diterbitkan hari ini: {n} · Jumlah: RM{n}`;
  jadual `No. Resit` (pautan) · `Tarikh` · `Murid` · `Jumlah` (kanan) · `Bayaran`;
  kosong: `Belum ada resit.`

**Keadaan:** `Memuatkan...`; ralat sebaris merah menggantikan kandungan.

#### S3 · e-Daftar (kaunter pendaftaran) — `#/pendaftaran` — **skrin paling penting**

**Tujuan:** menanda kehadiran seramai mungkin murid secepat mungkin, dengan pembetulan mudah.
**Susun atur (urut):** tajuk → kad alat kaunter (carian, penapis, kiraan) →
jadual lebar → dialog borang (tersembunyi).

**Kandungan & teks:**
- Tajuk `e-Daftar` + ayat panduan: `Cari murid, kemudian tekan **Tanda daftar**.`
- **Carian besar:** placeholder `Cari nama atau No. IC — contoh: ahmad 140512`
  (carian berbilang token: semua perkataan dalam nama + token digit mesti ada dalam IC);
  butang `↻ Muat semula` (tooltip: Muat semula senarai) + `+ Murid baharu` (utama).
- **Penapis:** chip `Semua ting.` / `Tingkatan 1` … `Tingkatan 5`;
  chip `Semua status` / `Sudah daftar` / `Belum daftar`;
  dropdown `Semua sekolah rendah` + 10 sekolah (SK Bongkud, SK Kirokot, SK Langsat, SK Lohan,
  SK Nalapak, SK Napong, SK Narawang, SK Perancangan, SK Poring, SK Sagiban).
- **Baris kiraan:** `Menunjukkan {x} daripada {y} padanan` atau `{y} padanan`,
  petunjuk `· Tekan Enter untuk tanda daftar {nama}`.
- **Jadual (min 720 px, skrol mendatar):** kolum `Murid` · `Sekolah Rendah Asal` ·
  `Status Daftar` · `Penempatan Semula` · `Tindakan`.
- **Anatomi baris murid:**
  - Nama tebal + tag `T{tingkatan}` + tag `OKU` (jika ada) + No. IC bertopeng di bawah.
  - Status: `✓ Sudah daftar` (lencana hijau) + baris kecil `{masa}`;
    atau `Belum daftar` (lencana kelabu).
  - Penempatan semula: nama sekolah dipohon atau `—`.
  - Tindakan: `Butiran` + `✓ Tanda daftar` (hijau) **atau** `↩ Batal daftar`;
    butang dilumpuhkan sementara (`.row-done` = bar hijau di tepi kiri baris).

**Interaksi:** debounce carian 250 ms; Enter menanda bila padanan tunggal (status Belum);
pintasan `/` fokus carian; auto-refresh 30 s (dilangkau bila tab tersembunyi, sibuk,
dialog terbuka, atau sedang menaip); toast undo `Batal` (8 s).

**Keadaan kosong (3 varian penting):**
1. Ada carian: `Tiada padanan untuk “{query}”.` + butang
   `+ Daftar “{query}” sebagai murid baharu` (walk-in);
2. Ada penapis: `Tiada murid yang sepadan dengan penapis ini. Klik Semua ting. dan Semua status untuk melihat senarai penuh.`
3. Tiada data: `Belum ada data murid. Import senarai murid dahulu (Papan Pemuka › e-Daftar › Import Data).`

**Toast:** `✓ {nama} ditanda sudah daftar.` + `Batal` ·
`Status {nama} dikembalikan kepada belum daftar.` + `Batal` · ralat = toast merah.
**Konfirmasi** hanya untuk batal daftar: `Kembalikan status {nama} kepada "Belum daftar"?`

#### S4 · Dialog borang murid (dalam S3) + dialog/toast

**Tujuan:** rekod penuh murid baharu atau pembetulan butiran (dibuka dari S3 dan dari walk-in).
**Susun atur:** dialog natif, lebar min(720 px, 94 vw); tajuk `Daftar murid baharu` atau
`Kemaskini murid: {nama}`; grid borang 2 lajur; footer butang.

**Medan (label sebenar):** `Sekolah (SK Terdahulu)` (`— Pilih sekolah —`) · `Nama murid` ·
`No. IC (12 digit)` (placeholder `140512-12-1234`) · `Tingkatan` (`— Belum ditetapkan —`)
· radio `Status OKU`: `Ya` / `Tidak` · radio `Status daftar`:
`Sudah daftar` / `Belum daftar` · checkbox `Mohon penempatan semula ke sekolah lain`
→ tunjuk medan `Nama sekolah dipohon` · `Sebab` · `Catatan` (kotak borang rata, tanpa
kad dalam kad) + nota:
`Murid yang hadir pada hari pendaftaran tetap dikira **sudah daftar**, walaupun memohon penempatan semula.`

**Butang:** `Simpan` (sibuk `Menyimpan…`) · `Kosongkan borang` · `Tutup`.
**Ralat:** `Sila isi nama sekolah dipohon, atau nyahpilih penempatan semula.`
**Toast selepas simpan:** `{nama} telah didaftarkan.` / `Maklumat {nama} dikemas kini.`

#### S5 · Import Data — `#/import`

**Tujuan:** muat naik senarai murid `.xlsx` (maks 2 MB / 2,000 baris) dengan pratonton sahkan dahulu.
**Kandungan & teks:**
- Tajuk `Import Data` + penerangan kegunaan sebelum hari pendaftaran.
- Kad `Fail murid`: satu ayat ringkas (lajur templat sudah ditanda **(wajib)/(pilihan)**);
  nota `Murid yang sudah wujud (No. IC sama) dilangkau, tidak diganti.`;
  input fail + butang `Muat turun templat` (fail `templat-murid.xlsx` — helaian "Murid" +
  "Panduan"; kepala lajur bertanda **(wajib)/(pilihan)**, penghurai mengabaikan penanda ini).
- **Pratonton** selepas pilih fail (`Membaca dan menyemak fail...`):
  pil: `{n} baris dibaca` · `{n} sah` · `{n} tidak sah` · `{n} pendua dalam fail` ·
  `{n} sudah wujud`; jadual masalah (maks 50): `Baris` · `Nama` · `No. IC` (bertopeng) ·
  `Status` (`Tidak sah` / `Pendua dalam fail` / `Sudah wujud`) · `Sebab`;
  nota `Hanya baris yang sah akan diimport. Baris bermasalah dilangkau.`
- Butang `Import {n} murid` (utama) + `Batal`.
- Selepas selesai: notis `Import selesai. {n} murid ditambah. {m} baris dilangkau (...)`
  + pautan ke e-Daftar.

**Keadaan:** tiada fail → hanya kad penerangan; membaca → teks proses; ralat → merah sebaris.

#### S6 · e-Resit Koperasi / Jana Resit — `#/jana-resit`

**Tujuan:** aliran 3 langkah + ringkasan melekat (sticky) untuk menerbitkan resit.
**Susun atur:** grid 2 lajur — kiri: langkah 1 `1. Murid`, `2. Barangan`,
`3. Kaedah pembayaran`; kanan: kad `Ringkasan` (sticky, 360 px). Bawah 860 px → 1 lajur.

**1. Murid:** kotak carian `Cari nama atau no. IC (sekurang-kurangnya 2 aksara)`;
keputusan sebagai butang besar boleh klik (nama tebal, IC bertopeng, tingkatan, sekolah);
`Mencari...` / `Tiada padanan.`; Enter memilih padanan pertama; murid dipilih dipaparkan
dengan butang `Tukar`. Pra-pilih melalui `?student=<id>`.

**2. Barangan:** jadual `Item` · `Harga` (kanan) · `Kuantiti` (kanan) + butang;
baris yang sudah dipilih mendapat lencana `{n} dalam resit` dan latar lembut
(`.row-in-cart`); kuantiti tetap dipapar sebagai teks (`Tetap`), yang lain input nombor
(1–99); butang `Tambah` / `Tambah lagi`; ralat `Kuantiti mesti antara 1 dan 99.`

**3. Kaedah pembayaran:** radio `Pindahan Bank` / `Tunai` — **`Tunai` dipilih lalai**;
`Pindahan Bank` menunjuk medan `No. Rujukan pindahan`
(placeholder `Contoh: MBB2026010112345`).

**Ringkasan (kanan):** `Murid:` (atau `Belum dipilih`) · baris item dengan harga seunit,
input kuantiti, jumlah baris dan butang buang `✕` · `Belum ada barangan.` ·
`Jumlah: RM{n}` · `Bayaran:` · `No. Rujukan:` ·
checkbox `Pembayaran telah disahkan mengikut prosedur koperasi` ·
butang utama penuh `Simpan Resit` (sibuk `Menyimpan...`);
butang hanya aktif apabila lengkap (murid + item + bayaran + pengesahan + rujukan jika pindahan).

**Selepas simpan:** pergi ke `#/resit/{id}`. **Ralat lewat:** `Semak Sejarah Resit dahulu,
kerana resit mungkin telah disimpan.`

#### S7 · Barangan — `#/barangan`

**Tujuan:** rujukan harga rasmi koperasi (baca sahaja — 9 item, termasuk variasi harga).
**Kandungan:** tajuk `Barangan`; notis
`Harga daripada senarai yang diluluskan pihak sekolah. Sesetengah item mempunyai jenis dengan harga berbeza.`;
jadual `Item` · `Harga` (kanan) · `Kuantiti` (`Tetap (1)` / `Boleh pilih`) · `Status`
(`Aktif` / `Tidak aktif`); kosong `Tiada barangan.`

#### S8 · Sejarah Resit — `#/sejarah`

**Tujuan:** cari dan buka semula resit lalu.
**Kandungan:** tajuk `Sejarah Resit`; baris alat: carian
`Cari no. resit atau nama murid` + `Dari` / `Hingga` (tarikh);
kiraan `{n} resit` atau `Menunjukkan {n} resit terkini. Gunakan carian atau tarikh untuk mengecilkan senarai.`;
jadual `No. Resit` · `Tarikh` · `Murid` · `Jumlah` (kanan) · `Bayaran` + tindakan `Lihat`;
kosong `Tiada resit.`; carian debounce 300 ms.

#### S9 · Butiran Resit — `#/resit/{id}`

**Tujuan:** papar resit tersimpan + cetak, PDF, kongsi WhatsApp.
**Susun atur (urut):** toolbar → kad kongsi WhatsApp → **kad resit (KEKAL GAYA LAMA)**.

- **Toolbar:** `← Sejarah` · `Resit Baharu` · `Cetak` · `Muat turun PDF`
  (sibuk `Menjana PDF...`; ralat `PDF gagal dijana. Sila cuba lagi.`).
- **Kad `Kongsi melalui WhatsApp`:** nota (nombor pilihan, tidak disimpan, IC tidak dimasukkan);
  input `Contoh: 012-3456789` + butang `Buka WhatsApp`; ralat
  `Nombor telefon tidak sah. Gunakan format seperti 012-3456789.`
- **Kad resit (dokumen rasmi — jangan reka semula):**
  - Kepala: logo 60 px + nama `Koperasi SMK Lohan Ranau Berhad` (**Times New Roman**) ·
    `Peti Surat 197, 89308, Ranau, Sabah` · `No. Tel: 088-875241` (Helvetica kecil).
  - Tajuk `Resit Bayaran Koperasi` (Times New Roman, huruf besar, garis tebal atas/bawah).
  - Meta: `No. Resit` · `Tarikh` · `Nama Murid` (label kiri, nilai kanan).
  - Jadual: `Item` (44%) · `Kuantiti` (14%) · `Harga (RM)` (21%) · `Jumlah (RM)` (21%);
    pada skrin telefon, kepala lajur dipendekkan dan lebar lajur dilaras supaya tidak bertindih;
    footer `Jumlah Keseluruhan`.
  - Bayaran: `Kaedah Pembayaran` (`Tunai` / `Pindahan Bank`) · `No. Rujukan` (jika ada).
  - Penutup tengah: `Terima kasih.`
  - Cetakan: putih bersih, hanya resit kelihatan (semua `.no-print` hilang);
    PDF = A5, fon sama (Times untuk kepala/tajuk, Helvetica untuk isi).
- **Ralat:** `Resit tidak dapat dibuka` + pautan `Kembali ke Sejarah Resit`.
- **WhatsApp:** teks ringkas tanpa No. IC (tajuk, no. resit, nama murid, jumlah, bayaran).

#### S10 · 404 — Halaman tidak dijumpai

`Halaman tidak dijumpai` + pautan `Kembali ke Papan Pemuka`.

---

## 3. Aliran UX utama

**3.1 Hari pendaftaran (kaunter)**
Import senarai (sebelum) → buka `Pendaftaran` → taip nama/IC → **Enter / Tanda daftar** →
toast + baris bertukar hijau (`✓ Sudah daftar`, masa, petugas) → angka dan bar dikemas kini
segera → auto-refresh menyegerakkan kaunter lain → balik ke carian (fokus kekal).
Tersalah? `Batal` pada toast atau `↩ Batal daftar` (dengan pengesahan).
Murid tiada dalam senarai → walk-in `+ Daftar “{nama}” sebagai murid baharu`.

**3.2 Jana resit koperasi**
`Jana Resit` → cari murid → tambah barangan (badge "{n} dalam resit") → laraskan kuantiti
dalam `Ringkasan` → pilih `Tunai`/`Pindahan Bank` (+ no. rujukan) → **checkbox pengesahan** →
`Simpan Resit` → `Butiran Resit` → cetak / PDF / WhatsApp.

**3.3 Import senarai murid**
`Import Data` → pilih `.xlsx` → pratonton pil + baris masalah → `Import {n} murid` →
notis selesai → semak di `Pendaftaran`.

**3.4 Semakan & pembetulan**
`Sejarah Resit` (carian/tarikh) → `Lihat` resit; atau di `Pendaftaran`, `Butiran` murid →
`Kemaskini murid` → simpan.

---

## 4. Keperluan & kekangan untuk reka bentuk baharu

### 4.1 Kekangan keras (mesti dikekalkan)

1. **Logo sekolah** sebagai aset imej (bulat latar putih bila diletak pada warna).
   Warna logo: kuning `#F6E10D`, merah `#D9201E`, hijau `#409448`, hitam `#0B0706`,
   putih `#FBFBFC`.
2. **Nama sistem:** `SPeRK SMK Lohan` (brand) dan nama penuh pada halaman log masuk.
3. **Bahasa UI: Bahasa Melayu** sepenuhnya — kekalkan mikro-teks sedia ada (senarai dalam
   Bahagian 2.5 dianggap teks rasmi; boleh ditulis semula hanya jika makna kekal).
4. **Halaman resit kekal gaya dokumen rasmi** — Helvetica + Times New Roman pada tajuk/nama
   koperasi sahaja, susun atur invois, lajur jadual tetap, kertas putih. **Jangan** sapukan
   tema baharu pada kad resit, PDF atau cetakan.
5. **Sasaran ketuk** ≥ 44 px untuk kawalan utama kaunter (butang baris, chip, carian besar);
   butang kecil dalam jadual ≥ 36 px.
6. **Kebolehcapaian:** kontras teks ≥ WCAG AA 4.5:1; fokus kelihatan jelas; status tidak
   bergantung pada warna semata-mata (selalu ada teks/lencana: "Sudah daftar"/"Belum daftar").
7. **Elakkan kuning terang sebagai warna dominan navigasi/header** (kuning pekat ada dalam
   logo; gunakan sebagai aksen kecil sahaja) — sebab kontras dan identiti.
8. **Percetakan:** hanya kawasan resit dicetak; semua chrome kekal `.no-print`.
9. **Semua fungsi dalam Bahagian 4.3** mesti terus ada — reka bentuk tidak boleh memotong
   ciri walaupun kelihatan "lebih bersih" tanpanya.

### 4.2 Kebebasan kreatif (tema baharu sepenuhnya)

Stitch **bebas** mencadangkan dan kami akan pilih:

> **Dilaksanakan 18 Okt 2026** — tema “Warm Slate”: indigo gelap `#1E2A3A` + terracotta
> `#8C322A`, tajuk Plus Jakarta Sans + teks Inter, radius 8/12 px, bayaran pilihan menjadi
> kad radio, stepper −/＋ untuk kuantiti, dan footer hak cipta. Butiran penuh: 2.3.

- **Palet warna baharu** (primary, accent, semantic success/warning/danger, neutral/surface).
- **Tipografi baharu** untuk tajuk dan teks UI (boleh ganti Urbanist/Inter; fon mesti
  tersedia sebagai web font yang boleh dihos sendiri, contoh: Google Fonts).
- **Bentuk** (radius), **kedalaman** (bayang/lapisan), **gaya kad & jadual**,
  **ikonografi**, **pergerakan halus** (150–250 ms).
- **Susun atur semula** yang lebih baik untuk kaunter: contoh, panel metrik + carian
  melekat (sticky), penapis lebih jelas, toast lebih menonjol — asalkan aliran kerja kekal.

Gaya yang dicadangkan untuk dieksperimen (pilih satu atau gabungkan):

- **A — Tenang institusi:** teal/navy dalam, neutral hangat, tajuk humanis, permukaan rata berlapis halus.
- **B — Mesra & pantas:** hijau hutan + krim, sudut lebih bulat, lencana lembut, kontras tinggi untuk kaunter.
- **C — Efisien kontras tinggi:** kelabu sejuk + satu warna aksen tegas, tipografi padat,
  jadual tebal-pelbagai untuk jarak baca jauh.

### 4.3 Fungsi yang mesti dikekalkan (per skrin)

| Skrin | Fungsi kritikal |
|---|---|
| Log Masuk | Validasi kosong; sibuk `Sedang log masuk...`; mesej ralat spesifik; sesi kekal selepas tab ditutup; log keluar manual |
| Papan Pemuka | 4 metrik; 2 kad pintasan navigasi; jadual resit terkini (5 kolum + jumlah harian) |
| e-Daftar | Carian berbilang token + No. IC; chips tingkatan/status; tapis sekolah; Enter menanda padanan tunggal; pintasan `/`; **Tanda daftar / Batal daftar** dengan toast undo + pengesahan untuk batal; baris tunjuk masa; walk-in dari carian kosong; auto-refresh 30 s; 3 keadaan kosong; kiraan `Menunjukkan x daripada y` |
| Dialog murid | Semua medan + radio OKU/status + medan penempatan semula bersyarat + nota; butang Simpan/Kosongkan/Tutup; sibuk `Menyimpan…` |
| Import Data | Pilih fail; pratonton pil (dibaca/sah/tidak sah/pendua/wujud); jadual masalah 5 kolum; butang `Import {n} murid`; Batal; templat; mesej ralat fail |
| Jana Resit | 3 langkah bernombor + ringkasan sticky; cari murid (Enter pilih pertama); bakul kuantiti 1–99 + badge "{n} dalam resit"; **Tunai lalai**; medan no. rujukan wajib untuk pindahan; checkbox pengesahan sebelum simpan; sebab-simpan (idempoten) |
| Barangan | 4 kolum; harga rasmi; status Aktif/Tidak aktif; bahan rujukan sahaja |
| Sejarah Resit | Carian + julat tarikh; 6 kolum; `Lihat`; keadaan mampat `Menunjukkan {n} resit terkini...` |
| Butiran Resit | Toolbar cetak/PDF/WhatsApp/resit baharu; kad WhatsApp tanpa IC; **kad resit rasmi tidak berubah**; ralat sendiri |

---

## 5. Proses reka bentuk dengan Stitch AI

**Stitch (Google)** menjana skrin UI daripada prompt bahasa semula jadi, boleh diulang
secara perbualan, menyambung skrin jadi prototaip, menyokong input imej (logo), fail
`DESIGN.md` untuk sistem reka bentuk, dan eksport HTML/TailwindCSS.
Pautan: https://stitch.withgoogle.com (perlu akaun Google).

### 5.1 Aliran kerja yang disyorkan

1. **Projek baharu** → medium: **Web app** → nama projek: `SPeRK SMK Lohan`.
2. **Tampal Prompt 0** (Bahagian 6) sebagai konteks induk.
3. **Jana satu skrin dahulu** — Papan Pemuka (Prompt 2) — untuk menetapkan tema.
4. **Eksperimen tema** dengan Prompt 0B (3 arah). Pilih satu; minta Stitch sapukan
   ke semua skrin yang dijana seterusnya.
5. **Jana skrin demi skrin ikut turutan** dalam 5.3 (± 2–4 skrin setiap sesi).
6. **Semak selepas setiap langkah** — simpan tangkapan skrin keadaan yang menjadi
   (Stitch kadang "reset" jika prompt terlalu banyak serentak).
7. **Lengkapkan keadaan** — Prompt 12 (kosong, ralat, sibuk, toast, dialog).
8. **Sambung aliran** — Prompt 13 (klik Pendaftaran → carian → tanda → toast).
9. **Eksport** HTML/Tailwind untuk rujukan pelaksanaan, kemudian petakan ke kelas CSS
   sedia ada (Lampiran B). Ganti token dalam `style.css` dengan palet baharu.

### 5.2 Tips prompt (ringkasan panduan rasmi Stitch)

- **Satu perubahan besar satu masa** — jangan campur ubah susun atur dengan komponen baharu
  dalam satu prompt.
- **Plain language + spesifik:** sebut nama elemen sebenar ("primary button on the search
  bar", "filter chips row").
- **Adjektif menetapkan vibe** ("calm, trustworthy, efficient").
- **Nyatakan warna/fon/sempadan secara literal** ("use 8px radius", "humanist sans headings").
- **Stitch ingat konteks perbualan** — rujuk skrin dengan nama ("on the e-Daftar counter page...").
- **Tangkapan skrin selepas setiap keadaan yang baik** — jaring keselamatan.
- Teks UI mesti kekal **Bahasa Melayu** — selalu sertakan teks sebenar dalam petikan
  di dalam prompt.

### 5.3 Turutan penjanaan skrin (disyorkan)

| Urutan | Skrin | Sebab |
|---|---|---|
| 1 | Papan Pemuka | Menetapkan tema, kad, metrik, jadual — asas bahasa visual |
| 2 | e-Daftar (kaunter) | Skrin paling kompleks & paling penting; uji ketumpatan jadual + chips + baris keadaan |
| 3 | Dialog murid + toast | Komponen borang & maklum balas |
| 4 | Jana Resit | Susun atur 2 lajur sticky + bakul |
| 5 | Sejarah Resit + Barangan | Jadual dan penapis |
| 6 | Butiran Resit | Chrome + kad resit klasik (kecualian) |
| 7 | Import Data | Pratonton + pil |
| 8 | Log Masuk + 404 | Skrin mudah, lengkapkan set |

---

## 6. Pustaka prompt Stitch

> Prompt ditulis dalam **bahasa Inggeris** untuk hasil penjanaan terbaik daripada Stitch,
> tetapi **teks UI dalam petikan mesti kekal Bahasa Melayu** — itu teks rasmi aplikasi.

### Prompt 0 — Konteks induk (tampal dahulu)

```
Design a web app called "SPeRK" for a Malaysian secondary school (SMK Lohan, Ranau, Sabah).
It has two features sharing one student database:
1) Student registration counter ("e-Daftar") used by teachers on laptops/tablets on
   registration day — 300-400 students arrive; speed and one-tap marking matter most.
2) School cooperative counter ("e-Resit Koperasi") that issues official payment receipts
   (cash or bank transfer) and manages items and receipt history.
All UI text is in Bahasa Melayu. Users are school staff; they sign in with email.
Primary navigation groups: "Papan Pemuka", "e-Daftar" (Pendaftaran, Import Data),
"e-Resit Koperasi" (Jana Resit, Barangan, Sejarah Resit).
Medium: desktop-first web app (content max-width ~1080px), usable on portrait tablets.
Vibe: calm, trustworthy, efficient, institutional but friendly; no marketing elements,
no hero images, no illustrations of people.
Hard constraints: keep the provided school crest logo; keep the name "SPeRK";
WCAG AA contrast; touch targets >= 44px; avoid bright yellow as a dominant navigation color.
Do not redesign the official receipt document itself (it stays a formal Times New Roman /
Helvetica invoice) — only its surrounding page chrome may be restyled.
Propose a fresh modern visual language (palette, typography, shapes, elevation).
```

### Prompt 0B — Eksperimen tema (pilih satu)

```
A) Update the theme to a calm institutional look: deep teal primary, warm neutral
   background, humanist sans headings, 8px radius, very subtle elevation.
B) Update the theme to a friendly school-cooperative look: forest green primary,
   cream background, softly rounded 12px cards, high-contrast badges for counter use.
C) Update the theme to a high-efficiency look: cool grey surfaces, one strong accent
   color, dense but readable data tables, crisp 4px radius, minimal shadows.
```

Selepas memilih: `Apply the selected theme consistently to all screens I generate next.`

### Prompt 1 — Log Masuk

```
Screen: Login page for "SPeRK SMK Lohan" (school staff web app).
Layout: full-screen centered card (max-width ~380px) on a soft background; school crest
logo at top center; heading "Log Masuk"; subtitle "Sistem Pengurusan Pelajar dan Resit
Koperasi (SPeRK) SMK Lohan, Ranau"; labeled fields "E-mel" and "Kata laluan";
inline error text area; full-width primary button "Log Masuk".
Show these states: default; busy (button disabled, label "Sedang log masuk...");
error example shown in red: "E-mel atau kata laluan tidak betul."
No navigation bar on this screen. Sessions end when the tab closes — do not add
"remember me" or social login.
```

### Prompt 2 — Papan Pemuka

```
Screen: Dashboard ("Papan Pemuka") of SPeRK, after staff login.
Top: page heading "Papan Pemuka" with a small subtitle line:
"Sistem Pengurusan Pelajar dan Resit Koperasi (SPeRK) SMK Lohan".
Row 1: one metrics panel with 4 equal cells, big tabular numbers:
"Belum daftar" 324 · "Sudah daftar" 1476 · "Didaftarkan hari ini" 212 · "Keahlian koperasi" 640.
Row 2: card "Kemajuan Hari Pendaftaran" with a rounded progress bar at 82% and caption
"82% sudah daftar · 1476 daripada 1800 murid aktif", plus two buttons:
primary "Tandakan kehadiran murid", secondary "Jana resit koperasi".
Row 3: two large clickable navigation cards side by side:
"e-Daftar" — "Sekolah terdahulu, status OKU, status daftar dan permohonan penempatan
semula murid." ; "e-Resit Koperasi" — "Menjana resit bayaran barangan koperasi untuk murid."
Row 4: card "Resit Koperasi" with summary line "Resit diterbitkan hari ini: 12 ·
Jumlah: RM860.00" and a table with headers "No. Resit | Tarikh | Murid | Jumlah | Bayaran";
5 sample rows with right-aligned amounts like RM140.00 and payments "Tunai" / "Pindahan Bank".
Also show the empty variant of row 4: muted text "Belum ada resit."
```

### Prompt 3 — e-Daftar (kaunter) — paling penting

```
Screen: Registration-day counter page "e-Daftar" (route #/pendaftaran) — the most
important screen. Goal: mark a student present in under 5 seconds.
Top: heading "e-Daftar" with helper text: "Cari murid, kemudian tekan Tanda daftar.
Data ini dikongsi dengan e-Resit Koperasi."
Row 1: metrics panel with 4 cells: "Sudah daftar" 1476 · "Belum daftar" 324 ·
"Didaftarkan hari ini" 212 · "Jumlah murid aktif" 1800.
Row 2: slim progress bar with caption "82% sudah daftar (1476 daripada 1800 murid)".
Row 3 (tool card): a large search input (height ~52px) with placeholder
"Cari nama atau No. IC — contoh: ahmad 140512", plus buttons "↻ Muat semula" and
primary "+ Murid baharu".
Row 4 (filters): two rows of pill filter chips — first: "Semua ting." (active),
"Tingkatan 1" ... "Tingkatan 5"; second: "Semua status" (active), "Sudah daftar",
"Belum daftar"; plus a dropdown "Semua sekolah rendah".
A small count line: "Menunjukkan 12 daripada 37 padanan · dikemas kini 09:41:22 ·
Tekan Enter untuk tanda daftar Aiman Hakim".
Row 5: wide data table (horizontal scroll on narrow screens) with headers:
"Murid | Sekolah Rendah Asal | Status Daftar | Penempatan Semula | Tindakan".
Row anatomy: bold student name + small tags "T1" and (if applicable) "OKU" +
masked IC "******-**-1401" below; then former school; then either a green badge
"✓ Sudah daftar" with small line "09:41 · sperk.smklohan@gmail.com" or a grey badge
"Belum daftar"; then transfer school name or "—"; then row actions: "Butiran"
and either green "✓ Tanda daftar" or neutral "↩ Batal daftar".
Rows already registered get a subtle green left edge accent.
Below the table, a note: "No. IC dipaparkan separa. Guna Butiran untuk membetulkan
maklumat atau merekod permohonan penempatan semula."
Also design the empty state: "Tiada padanan untuk “ahmad”. "+ secondary button
"+ Daftar “ahmad” sebagai murid baharu".
Touch targets >= 44px for row buttons and chips. Keep everything in Bahasa Melayu.
```

### Prompt 4 — Dialog murid + toast (komponen)

```
Component set for the e-Daftar page:
1) Modal dialog (max-width 720px) titled "Daftar murid baharu" (or "Kemaskini murid:
   Aiman Hakim") with a 2-column form grid: select "Sekolah (SK Terdahulu)" ("— Pilih
   sekolah —"), text "Nama murid", text "No. IC (12 digit)" with placeholder
   "140512-12-1234", select "Tingkatan" ("— Belum ditetapkan —"), radio group
   "Status OKU": "Ya"/"Tidak", radio group "Status daftar (kehadiran hari pendaftaran)":
   "Sudah daftar"/"Belum daftar", checkbox "Mohon penempatan semula ke sekolah lain",
   then three conditional fields "Nama sekolah dipohon", "Sebab", "Catatan" and a note
   "Murid yang hadir pada hari pendaftaran tetap dikira sudah daftar, walaupun memohon
   penempatan semula." Footer buttons: primary "Simpan", secondary "Kosongkan borang",
   ghost "Tutup". Busy state: button label "Menyimpan…".
2) Undo toast pinned bottom-center (max-width 560px, dark surface, white text) with
   message "✓ Aiman Hakim ditanda sudah daftar." and an outlined action button "Batal";
   plus a red error variant, e.g. "Tidak dapat menyambung ke pelayan."
```

### Prompt 5 — Import Data

```
Screen: "Import Data" (route #/import).
Heading "Import Data"; helper text: "Muat naik senarai murid daripada fail Excel (.xlsx).
Gunakan halaman ini sebelum hari pendaftaran untuk menyediakan senarai murid dalam sistem."
Card "Fail murid": explanation of required columns "Nama Murid", "No. IC", "Sekolah
Rendah Asal" and optional ones "Tingkatan", "Status OKU", "Status Daftar", "Sekolah
Dipohon", "Sebab Penempatan Semula", "Catatan"; note "Murid yang sudah wujud (IC sama)
dilangkau, tidak diganti."; a file input and a small button "Muat turun templat".
Preview state (after choosing a file): pill badges "120 baris dibaca" (neutral), "115 sah"
(green), "3 tidak sah" (red), "2 pendua dalam fail" (amber), "1 sudah wujud" (amber);
a compact problems table with headers "Baris | Nama | No. IC | Status | Sebab" showing
masked ICs and status labels "Tidak sah", "Pendua dalam fail", "Sudah wujud";
caption "Hanya baris yang sah akan diimport. Baris bermasalah dilangkau.";
buttons: primary "Import 115 murid", secondary "Batal".
Done state: a success notice "Import selesai. 114 murid ditambah. 6 baris dilangkau
(3 tidak sah, 3 pendua)." with an inline link "e-Daftar".
```

### Prompt 6 — Jana Resit

```
Screen: "e-Resit Koperasi" receipt counter (route #/jana-resit).
Two-column layout (right column sticky, ~360px): left column has three numbered cards;
right column is a summary card "Ringkasan".
Card 1 "1. Murid": search input with placeholder "Cari nama atau no. IC (sekurang-kurangnya
2 aksara)"; results as large clickable rows: bold "Nurul Izzah" + line
"******-**-1402 · Tingkatan 1 · SK Lohan"; then selected state: student name + line
"******-**-1402 · SK Lohan" + button "Tukar".
Card 2 "2. Barangan": table "Item | Harga | Kuantiti" + action button column;
one row already added shows a small badge "2 dalam resit" and a soft tinted background;
buttons are "Tambah" / "Tambah lagi"; prices like "RM12.00"; a fixed-quantity item shows
plain text "1" instead of an input.
Card 3 "3. Kaedah pembayaran": radio options "Pindahan Bank" and "Tunai" with "Tunai"
selected by default; when "Pindahan Bank" is chosen show a field "No. Rujukan pindahan"
with placeholder "Contoh: MBB2026010112345".
Summary card "Ringkasan": "Murid:" value or "Belum dipilih"; item lines with per-unit
price, quantity input, right-aligned line total and a small "✕" remove button;
"Belum ada barangan." when empty; then "Jumlah: RM140.00" prominent; "Bayaran:" value;
"No. Rujukan:" value; a confirmation checkbox "Pembayaran telah disahkan mengikut
prosedur koperasi"; full-width primary button "Simpan Resit" (busy label "Menyimpan...").
```

### Prompt 7 — Barangan

```
Screen: "Barangan" (route #/barangan) — read-only reference of the cooperative's price list.
Heading "Barangan"; notice "Harga daripada senarai yang diluluskan pihak sekolah.
Sesetengah item mempunyai jenis dengan harga berbeza."
Table headers "Item | Harga | Kuantiti | Status"; sample rows:
"Lencana Sekolah + Tanda Nama (3 Set)" RM12.00 "Tetap (1)" "Aktif";
"Baju PJK (Lengan Pendek)" RM40.00 "Boleh pilih" "Aktif";
"Baju PJK (Lengan Panjang)" RM43.00 "Boleh pilih" "Aktif";
"Keahlian Koperasi (sekali sepanjang tempoh persekolahan)" RM5.00 "Tetap (1)" "Aktif".
Amounts right-aligned. Empty state "Tiada barangan."
```

### Prompt 8 — Sejarah Resit

```
Screen: "Sejarah Resit" (route #/sejarah).
Heading "Sejarah Resit". Toolbar: search input "Cari no. resit atau nama murid",
two date inputs labeled "Dari" and "Hingga".
Count line: "31 resit" or the truncated variant "Menunjukkan 100 resit terkini.
Gunakan carian atau tarikh untuk mengecilkan senarai."
Table headers "No. Resit | Tarikh | Murid | Jumlah | Bayaran" + a row action "Lihat"
(rightmost). Sample rows: "2026-000128 | 18 Okt 2026, 9:41 PG | Aiman Hakim | RM140.00 |
Tunai" and one "Pindahan Bank" row. Empty state "Tiada resit."
```

### Prompt 9 — Butiran Resit (chrome baharu + resit klasik)

```
Screen: "Receipt detail" (route #/resit/:id).
IMPORTANT: the receipt document card itself must NOT be restyled. It stays a formal
document: white paper card, Helvetica body text, with Times New Roman only for the
cooperative name "Koperasi SMK Lohan Ranau Berhad" and the centered uppercase title
"RESIT BAYARAN KOPERASI". Fixed table columns "Item | Kuantiti | Harga (RM) | Jumlah (RM)"
with right-aligned numbers, a "Jumlah Keseluruhan" footer row, payment lines
"Kaedah Pembayaran" ("Tunai"/"Pindahan Bank") and "No. Rujukan", and centered "Terima kasih."
Design ONLY the surrounding chrome:
- Toolbar above the receipt: buttons "← Sejarah", "Resit Baharu",
  "Cetak", "Muat turun PDF" (busy: "Menjana PDF...").
- Card "Kongsi melalui WhatsApp" with note "Nombor telefon penerima adalah pilihan.
  Jika dikosongkan, WhatsApp akan membenarkan anda memilih penerima. Nombor tidak
  disimpan. No. IC tidak dimasukkan dalam mesej.", an input "Contoh: 012-3456789"
  and button "Buka WhatsApp".
- A framed neutral area/label showing where the classic receipt is embedded, so the
  transition between new theme and formal receipt looks intentional.
```

### Prompt 10 — Log Masuk + 404 (semakan tema)

```
Generate two simple screens in the current theme:
1) Login page: centered card with school crest, "Log Masuk", subtitle
   "Sistem Pengurusan Pelajar dan Resit Koperasi (SPeRK) SMK Lohan, Ranau",
   fields "E-mel" and "Kata laluan", primary button "Log Masuk", busy state
   "Sedang log masuk..." and error "E-mel atau kata laluan tidak betul."
2) Not-found page: heading "Halaman tidak dijumpai" with a link "Kembali ke Papan Pemuka".
```

### Prompt 11 — Konsistensi tema menyeluruh

```
Review every screen in this project and apply the chosen theme consistently:
same color roles, same type scale, same card and table styling, same button
variants (primary, secondary, ghost, danger), same badge and chip styles,
same spacing rhythm. Keep all UI text in Bahasa Melayu exactly as provided.
Then list any screen that looks visually inconsistent and fix it.
```

### Prompt 12 — Keadaan lengkap (kosong / ralat / sibuk)

```
For the e-Daftar counter screen and the receipt counter screen, add and design:
- loading state: "Memuatkan..." skeleton or spinner in tables;
- empty states: "Tiada padanan untuk “ahmad”." with button
  "+ Daftar “ahmad” sebagai murid baharu"; "Tiada murid yang sepadan dengan penapis
  ini. Klik Semua ting. dan Semua status untuk melihat senarai penuh.";
  "Belum ada data murid. Import senarai murid dahulu (Papan Pemuka › e-Daftar › Import Data).";
- error states: inline red text, e.g. "Tidak dapat menyambung ke pelayan." and
  "Kuantiti mesti antara 1 dan 99.";
- busy states: disabled buttons with labels "Menyimpan…", "Mengimport...", "Menjana PDF...".
Keep counters and progress numbers tabular so they don't jump.
```

### Prompt 13 — Sambung aliran (prototaip)

```
Connect the screens into a clickable flow:
Papan Pemuka → "Tandakan kehadiran murid" → e-Daftar counter → type in search →
tap "✓ Tanda daftar" on a row → show the undo toast "✓ Aiman Hakim ditanda sudah daftar."
with button "Batal".
Papan Pemuka → "Jana resit koperasi" → e-Resit counter → select student → add item →
check payment confirmation → "Simpan Resit" → receipt detail → "Cetak".
```

### Prompt 14 — Kemasan pada tablet

```
Show the e-Daftar counter screen and the e-Resit counter screen at tablet width
(768px portrait): sticky search stays visible, table scrolls horizontally,
the summary column stacks below the items, touch targets stay >= 44px,
and the top navigation collapses gracefully.
```

---

## 7. Senarai semak penerimaan

Selepas reka bentuk Stitch selesai, semak:

**Setiap skrin**
- [ ] Tajuk dan mikro-teks Melayu sama maksudnya dengan Bahagian 2.5 (tiada teks hilang).
- [ ] Semua butang/kawalan dalam senarai 4.3 hadir dan boleh dikenal pasti fungsinya.
- [ ] Keadaan kosong dan ralat kelihatan (bukan hanya laluan bahagia).
- [ ] Nombor & wang: digit tabular, rata kanan, format `RM0.00` / `0.00`.

**Kaunter (e-Daftar & Jana Resit)**
- [ ] Sasaran ketuk ≥ 44 px untuk carian, chip, butang baris.
- [ ] Status boleh dibezakan tanpa warna sahaja (teks "Sudah daftar"/"Belum daftar").
- [ ] Carian jelas fokusnya; pintasan `/` dan Enter masih munasabah dalam reka bentuk.

**Global**
- [ ] Kontras WCAG AA; fokus kelihatan pada semua kawalan.
- [ ] Tema konsisten merentas 9 skrin (satu set warna/komponen).
- [ ] Resit (kad S9, PDF, cetakan) **tidak berubah** — Times New Roman + Helvetica kekal.
- [ ] Logo sekolah kelihatan jelas pada latar baharu (bulat putih jika perlu).
- [ ] Tiada kuning terang dominan dalam navigasi.

---

## 8. Lampiran A — `DESIGN.md` untuk Stitch (tema terbuka)

Fail ini mengikuti spesifikasi DESIGN.md Google
(https://github.com/google-labs-code/design.md). Warna dan tipografi **sengaja
dikeluarkan** (`omitted`) kerana tema baharu akan dipilih melalui Stitch; selepas memilih
tema, tambah dua seksyen itu (contoh di bawah) dan jalankan
`npx @google/design.md lint DESIGN.md`.

```markdown
---
version: "0.1"
name: SPeRK SMK Lohan
description: Sistem pengurusan pelajar & resit koperasi sekolah (Bahasa Melayu); desktop-first; kaunter laju.
omitted:
  - colors
  - typography
rounded:
  sm: 6px
  md: 8px
  pill: 999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
components:
  button-primary:
    rounded: "{rounded.sm}"
    padding: 10px 14px
  button-secondary:
    rounded: "{rounded.sm}"
    padding: 10px 14px
  input:
    rounded: "{rounded.sm}"
    padding: 8px 10px
  card:
    rounded: "{rounded.md}"
    padding: 16px 18px
  chip-filter:
    rounded: "{rounded.pill}"
    padding: 6px 12px
  badge-status:
    rounded: "{rounded.pill}"
    padding: 2px 8px
  table-row-action:
    rounded: "{rounded.sm}"
    height: 36px
  counter-touch-target:
    height: 44px
---

## Overview

SPeRK ialah aplikasi web untuk dua kaunter sekolah: pendaftaran murid (kaunter laju,
satu ketukan) dan resit koperasi (dokumen rasmi). Antara muka Bahasa Melayu,
desktop-first (kandungan maks ~1080px), boleh guna pada tablet.

## Layout

- Rangka: topbar dengan logo + dua kumpulan navigasi; kandungan `max-width: 1080px`,
  margin auto, padding sisi 20px.
- Kaunter: panel metrik satu baris, kemudian kad alat (carian besar + penapis),
  kemudian jadual lebar (skrol mendatar apabila sempit).
- Jana resit: dua lajur (kandungan + ringkasan sticky 360px); bawah 860px jadi satu lajur.

## Elevation & Depth

Kedalaman minimum: permukaan rata dengan sempadan halus; bayang hanya untuk elemen
terapung (dialog, toast). Tiada bayang pada kad biasa.

## Shapes

Radius kecil (6–8px) untuk kawalan dan kad; bentuk pil untuk chip, lencana dan bar
kemajuan. Resit dikecualikan (sudut minimum, gaya dokumen).

## Components

- Butang: primer, sekunder, bahaya, halus; kecil ≥36px, kaunter ≥44px.
- Input: tinggi selesa, sempadan jelas, fokus sangat kelihatan.
- Jadual: kepala ringkas, angka rata kanan dan tabular, baris keadaan
  (hijau kiri = sudah daftar; latar lembut = dalam bakul).
- Lencana status dan chip penapis seperti dalam spesifikasi.
- Dialog dan toast: melihatkan tindakan "Batal" (undo) untuk tindakan cepat.

## Do's and Don'ts

- DO keep all UI copy in Bahasa Melayu.
- DO keep the receipt card unchanged (Times New Roman for cooperative name/title,
  Helvetica elsewhere; formal invoice layout; print-friendly).
- DO keep touch targets large on counter screens and show status with text + color.
- DON'T let bright yellow dominate navigation (logo accent only).
- DON'T hide flows behind hover-only interactions; staff use touch screens.
- DON'T add marketing content, illustrations or decorative imagery.
```

Selepas tema dipilih, tambah (contoh — ganti nilai dengan tema sebenar):

```yaml
colors:
  primary: "#0F766E"
  on-primary: "#FFFFFF"
  surface: "#FFFBF5"
  text-primary: "#1C2B2A"
typography:
  h1:
    fontFamily: Sora
    fontSize: 1.6rem
    fontWeight: 700
  body-md:
    fontFamily: "Public Sans"
    fontSize: 1rem
```

## 9. Lampiran B — Peta pelaksanaan (kelas CSS & token sedia ada)

Untuk fasa pelaksanaan selepas Stitch: ganti nilai dalam `frontend/src/style.css`
(`:root` token), kekalkan nama kelas supaya JS tidak berubah.

| Bahagian | Kelas CSS utama | Nota pelaksanaan |
|---|---|---|
| Rangka | `.devbar`, `.topbar`, `.topbar-in`, `.brand`, `.brand-badge`, `.brand-logo`, `.nav`, `.nav-link`, `.nav-drop`, `.nav-menu`, `.topbar-user`, `.who`, `.page`, `.footer`, `.footer-in` | Header + footer baharu (lihat 2.2); kelas lama `.topbar-main` / `.nav-group*` / `.container` telah dibuang |
| Kad | `.card`, `.cards`, `.card.stat`, `.nav-cards`, `.nav-card`, `.notice`, `.muted`, `.error` | Papan Pemuka = satu jalur panel; halaman e-Daftar tanpa kad statistik |
| Borang | `.input`, `.input-lg`, `.input-school`, `.stepper`, `.pay-option`, `.bankref`, `.form-grid`, `.radio-group`, `.radio`, `label.check`, `.login-wrap`, `.login-card`, `.login-crest`, `.login-logo` | Kekalkan id (`#q`, `#f-name`, …) |
| Butang | `.btn` + `.primary`, `.ok`, `.danger`, `.wa`, `.small`, `.block`; `.toolbar`, `.search-row`, `.filter-row` | Kekalkan kelas aksi (`data-action`) |
| Jadual | `.table-wrap`, `.table`, `.wide`, `.compact`, `.num`, `.nowrap`, `.row-done`, `.row-in-cart`, `.row-actions` | `.wide` min 880 px; `.num` guna fon mono |
| Maklum balas | `.badge` (+ `.done`, `.cart`, `.indigo`, `.bad`, `.warn`), `.tag`, `.tag.oku`, `.pill`, `.pill.ok/.bad/.warn`, `.chips`, `.chip`, `.step`, `.step-num`, `.toast-wrap`, `.toast`, `.toast-action`, `.modal` | Toast & dialog struktur JS kekal |
| Resit | `.receipt`, `.receipt-head`, `.receipt-logo`, `.receipt-org`, `.receipt-title`, `.receipt-meta`, `.receipt-pay`, `.receipt-thanks`; kroma: `.receipt-toolbar`, `.receipt-main`, `.receipt-layout` | Dokumen resit **jangan ubah** (kecuali pemetaan warna `--text`, `--muted`, `--line` yang dikongsi); kroma halaman boleh ikut tema |
| Utiliti | `.hidden`, `.fixed-qty`, `.sticky`, `.results`, `.result`, `.selected`, `.avatar`, `.receiver`, `.total`, `.sum-row`, `.import-summary`, `.import-layout` | — |
| Token | `--primary`, `--primary-deep`, `--accent`, `--accent-soft`, `--green*`, `--indigo-soft*`, `--gold-soft*`, `--amber*`, `--danger*`, `--background`, `--surface*`, `--text*`, `--border*`, `--radius-*`, `--shadow-*`, `--font-heading`, `--font-body`, `--font-mono` | Satu tempat ganti = tema baharu |

Fon: tema semasa menggunakan fon Google **Plus Jakarta Sans** (tajuk), **Inter** (teks) dan
**Roboto Mono** (angka/nombor),
fail variable `.woff2` (subhimpunan Latin) dihos sendiri di `frontend/public/fonts/` (corak sedia ada); kemas kini
`@font-face` dan token `--font-heading` / `--font-body` jika bertukar tema.

## 10. Rujukan

- Google Stitch AI — https://stitch.withgoogle.com
- Panduan prompt Stitch (rasmi) — https://discuss.ai.google.dev/t/stitch-prompt-guide/83844
- Spesifikasi DESIGN.md — https://github.com/google-labs-code/design.md
- Dokumentasi sistem — `docs/Dokumentasi_SPeRK_SMK_Lohan.md`
- Pelaksanaan semasa — `frontend/src/style.css`, `frontend/src/main.js`, `worker/src/`

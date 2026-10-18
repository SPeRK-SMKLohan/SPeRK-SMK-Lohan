# Dokumentasi Ciri-ciri dan Aliran Kerja

## Sistem Pengurusan Pelajar dan Resit Koperasi (SPeRK) SMK Lohan, Ranau

**Status:** Draf perancangan untuk semakan pihak sekolah.

## 1. Pengenalan

SPeRK (Sistem Pengurusan Pelajar dan Resit Koperasi) SMK Lohan, Ranau
ialah aplikasi web dengan dua modul utama:

1. **e-Daftar** — pendaftaran murid: sekolah rendah terdahulu, nama, No.
   IC, status OKU, status daftar (kehadiran hari pendaftaran) dan
   permohonan penempatan semula.
2. **e-Resit Koperasi** — merekod pembayaran koperasi, menjana resit
   digital dan mencari semula rekod transaksi.

Kedua-dua modul menggunakan pangkalan data murid yang sama. Beberapa
petugas boleh mengakses rekod yang sama melalui komputer berbeza.

Modul e-Resit meliputi pengurusan senarai item, pengiraan bayaran,
penjanaan resit, PDF/cetakan, perkongsian WhatsApp dan sejarah resit.
Data murid tidak terhad kepada murid Tingkatan 1.

## 2. Perubahan keperluan terkini

Maklumat murid yang digunakan (medan e-Daftar):

-   Sekolah (SK Terdahulu)
-   Nama murid
-   Nombor kad pengenalan (IC)
-   Status OKU (Ya/Tidak)
-   Status daftar: belum daftar / sudah daftar (merujuk kepada kehadiran
    pada hari pendaftaran, ditanda oleh guru)
-   Mohon penempatan semula: nama sekolah dipohon dan sebab, serta
    catatan (jika berkenaan)
-   Tingkatan (1 hingga 5, pilihan — murid tidak terhad kepada Tingkatan
    1)

Murid yang hadir pada hari pendaftaran tetap dikira **sudah daftar**,
walaupun memohon penempatan semula.

**Kelas tidak diperlukan. Item PIBG dikeluarkan daripada senarai.**

### Senarai sekolah rendah asal awal

Berdasarkan imej rujukan, senarai awal ialah: - SK Bongkud - SK
Kirokot - SK Langsat - SK Lohan - SK Nalapak - SK Napong - SK Narawang -
SK Perancangan - SK Poring - SK Sagiban

Senarai ini perlu disahkan oleh pihak sekolah. Angka bilangan murid yang
kelihatan pada imej tidak dianggap sebagai jumlah terkini atau rekod
murid individu.

## 3. Teknologi yang dicadangkan

  -----------------------------------------------------------------------
  Komponen                Teknologi               Peranan
  ----------------------- ----------------------- -----------------------
  Kod dan versi           GitHub                  Repositori kod, sejarah
                                                  perubahan dan semakan

  Antara muka             HTML, CSS, JavaScript,  Paparan sistem dan
                          Vite                    aliran pengguna

  Hosting frontend        Cloudflare Workers      Menyediakan aplikasi
                          (fail statik)           web

  Pengesahan              Firebase Authentication Log masuk akaun yang
                                                  dibenarkan

  Backend API             Cloudflare Workers      Pengesahan permintaan
                                                  dan logik resit

  Pangkalan data          Cloud Firestore         Menyimpan murid, item
                                                  dan resit

  Import Excel            SheetJS (`xlsx`)        Membaca dan mengesahkan
                                                  fail `.xlsx`

  PDF                     jsPDF atau kaedah PDF   Menjana resit PDF
                          yang diuji              

  WhatsApp                Click-to-chat           Membuka WhatsApp dengan
                                                  mesej yang disediakan
  -----------------------------------------------------------------------

Worker perlu mengesahkan token pengguna, mengesahkan data dan mengira
jumlah di bahagian backend. Kelayakan pelayan atau kunci rahsia tidak
boleh diletakkan dalam kod frontend atau repositori GitHub.

### 3.1 Susunan kod (dua ciri berasingan)

e-Daftar dan e-Resit Koperasi ialah dua ciri berasingan dalam satu
aplikasi SPeRK, berkongsi satu pangkalan data murid:

-   `frontend/src/pages/` — halaman peringkat sistem (log masuk, papan
    pemuka)
-   `frontend/src/features/e-daftar/` — pendaftaran murid dan import data
-   `frontend/src/features/e-resit/` — jana resit, barangan, sejarah
    resit dan PDF
-   `frontend/src/shared/` — kod kongsi (API, pengesahan, wang, identiti
    koperasi)
-   `worker/src/features/e-daftar/` — API murid dan import
-   `worker/src/features/e-resit/` — API barangan dan resit
-   `worker/src/shared/students.js` — lapisan data murid yang dikongsi
-   `worker/src/dashboard.js` — statistik papan pemuka (kedua-dua ciri)

Nama teknikal: Worker Cloudflare `sperk-smk-lohan-api` dan repositori
`SPeRK-SMK-Lohan` (https://github.com/SPeRK-SMKLohan/SPeRK-SMK-Lohan).
Projek Firebase `sperk-smk-lohan` (akaun `sperk.smklohan@gmail.com`) —
migrasi penuh daripada akaun lama pada 18 Oktober 2026.

## 4. Ciri-ciri sistem

### 4.1 Pengurusan maklumat murid (e-Daftar)

Sistem menyimpan nama murid, IC, sekolah rendah terdahulu, tingkatan,
status OKU, status daftar dan maklumat penempatan semula. Fungsi: - Import
data daripada Excel `.xlsx` melalui halaman Import Data yang berasingan. -
Tambah murid baharu atau kemas kini rekod sedia ada. - Cari murid
mengikut nama atau nombor IC (carian berbilang perkataan: `ahmad 140512`). -
Tapis mengikut sekolah rendah, tingkatan dan status daftar. - **Mod kaunter
hari pendaftaran:** tanda daftar dengan satu ketukan pada baris murid,
dengan **Batal** untuk memulihkan, bar kemajuan dan angka **Didaftarkan
hari ini**, kemas kini automatik setiap 30 saat dan pintasan papan
kekunci (`/` fokus carian, `Enter` menanda murid tunggal). - Rekod masa
(`registeredAt`) dan petugas (`registeredBy`) bagi setiap pendaftaran. -
Pilih sekolah rendah asal daripada senarai. - Semak
medan wajib yang kosong (nama, IC, sekolah, status OKU). - Kesan
kemungkinan rekod pendua (No. IC sama). - Paparkan statistik belum
daftar, sudah daftar dan keahlian koperasi pada papan pemuka. - Paparkan
maklumat murid sebelum resit dikeluarkan.

Lajur fail Excel (lajur bertanda pilihan boleh dikosongkan):

   Lajur                          Wajib
   ------------------------------ --------
   Nama Murid                     Ya
   No. IC                         Ya
   Sekolah Rendah Asal            Ya
   Tingkatan (1-5)                Tidak
   Status OKU (Ya/Tidak)          Tidak
   Status Daftar                  Tidak
   Sekolah Dipohon                Tidak
   Sebab Penempatan Semula        Tidak
   Catatan                        Tidak

Contoh format Excel:

  Nama Murid     No. IC           Sekolah Rendah Asal
  -------------- ---------------- ---------------------
  Contoh Murid   000000-00-0000   SK Lohan

Contoh ini ialah data rekaan. IC perlu disimpan sebagai teks supaya
sifar di hadapan tidak hilang. Nombor IC ialah data peribadi; akses dan
paparan pada resit perlu dihadkan kepada tujuan yang diluluskan.

Proses import: 1. Baca dan semak tajuk lajur. 2. Sahkan medan wajib. 3.
Semak rekod pendua atau data tidak sah. 4. Paparkan ringkasan rekod yang
akan diimport. 5. Minta pengesahan pengguna. 6. Simpan rekod yang sah
dan laporkan hasil import.

### 4.2 Senarai item dan jenis bayaran

Senarai dan harga terkini daripada pihak sekolah (tanpa PIBG):

  1. Lencana Sekolah + Tanda Nama (3 Set)              RM12.00   (kuantiti tetap 1)
  2. Baju PJK (Lengan Pendek)                          RM40.00
     Baju PJK (Lengan Panjang)                         RM43.00
  3. Tali Leher Sekolah                                RM15.50
  4. Fail murid                                        RM3.50
  5. Buku PAJSK (Kegunaan T1-T5)                       RM7.00
  6. Buku Peraturan Sekolah                            RM5.50
  7. Keahlian Koperasi (sekali sepanjang tempoh persekolahan)  RM5.00   (kuantiti tetap 1)
  8. Buku Tulis SMK Lohan (4 buku panjang + 8 buku pendek)     RM24.00

Pengguna boleh memilih beberapa item dalam satu resit dan menetapkan
kuantiti. Baju PJK disenaraikan sebagai dua item berasingan (Lengan
Pendek RM40.00 dan Lengan Panjang RM43.00) supaya pengguna terus melihat
kedua-dua pilihan. Item tertentu dikunci pada kuantiti tetap (contoh:
Lencana/Tanda Nama dan Keahlian Koperasi = 1). Harga yang digunakan pada
resit mesti disimpan sebagai snapshot supaya perubahan harga baharu
tidak mengubah resit lama.

Senarai item tersimpan dalam koleksi `items` di Firestore. Perubahan
harga dibuat terus pada koleksi itu; halaman **Barangan** hanya
memaparkan senarai semasa.

### 4.3 Pengiraan jumlah automatik

Formula:

`Jumlah item = Kuantiti × Harga seunit`

Jumlah keseluruhan ialah jumlah semua item. Contoh:

  Item                        Kuantiti   Harga seunit       Jumlah
  ------------------------- ---------- -------------- ------------
  Baju PJK (Lengan Panjang)          1        RM43.00       RM43.00
  Buku Tulis SMK Lohan (1 set)       2        RM24.00       RM48.00
  **Jumlah**                                              **RM91.00**

Harga contoh bukan harga rasmi. Frontend boleh memaparkan jumlah
sementara, tetapi backend mesti mengambil harga sah dan mengira semula
sebelum menyimpan transaksi. Wang disyorkan disimpan sebagai integer
sen; contohnya RM5.50 disimpan sebagai `550`.

### 4.4 Kaedah pembayaran

Pilihan: - Pindahan bank (Bank Transfer) - Tunai (Cash)

Tiada pilihan QR. Pindahan bank memerlukan **no. rujukan** yang diisi
oleh petugas; no. rujukan disimpan bersama resit dan dipaparkan pada
resit. Kaedah yang dipilih dipaparkan pada resit. Pemilihan kaedah sahaja
tidak mengesahkan wang diterima secara automatik; petugas perlu mengikut
prosedur pengesahan koperasi.

### 4.5 Penjanaan nombor dan resit

Format nombor resit yang dicadangkan: `YYYY-XXXXXX`, contohnya
`2027-000001`.

Peraturan: - Nombor dijana oleh backend, bukan pelayar. - Nombor mesti
unik walaupun beberapa komputer membuat resit serentak. - Nombor yang
telah digunakan tidak boleh digunakan semula. - Polisi bagi resit
dibatalkan atau nombor yang tertinggal perlu dipersetujui. - Permintaan
ulangan selepas gangguan rangkaian tidak boleh mencipta transaksi
pendua.

Resit mengandungi: - Logo dan nama koperasi (Koperasi SMK Lohan Ranau
Berhad), alamat (Peti Surat 197, 89308, Ranau, Sabah) dan no. telefon
(088-875241) pada kepala resit - Nombor resit dan tarikh/masa - Nama
murid - IC hanya jika sekolah mengesahkan ia perlu dipaparkan - Senarai
item, kuantiti, harga seunit dan jumlah item -
Jumlah keseluruhan - Kaedah pembayaran - No. rujukan (bagi pindahan bank)

Reka bentuk resit (paparan web dan PDF) menggunakan fon Times New Roman
pada nama koperasi dan kepala resit sahaja; semua teks dan nombor lain
menggunakan Helvetica. Lajur jadual disusun seimbang dan susunan item
mengikut senarai harga rasmi sekolah, walaupun item ditambah tidak
mengikut turutan.

Antara muka web selain resit mengikut tema "Warm Slate": Plus Jakarta Sans
untuk tajuk, Inter untuk teks, warna utama indigo gelap (#1E2A3A) dengan aksen
terracotta (#8C322A), permukaan rata (#F9F9F9) dengan kad putih beradius 12 px
dan bayang halus, serta footer hak cipta di bawah setiap halaman.

Tiada medan kelas dalam skop semasa.

### 4.6 PDF dan cetakan

Pengguna boleh: - Memuat turun resit PDF. - Mencetak resit. - Membuka
resit yang telah disimpan. - Mencetak atau memuat turun semula resit
lama.

PDF perlu dijana daripada rekod yang telah disimpan supaya kandungannya
sepadan dengan pangkalan data.

### 4.7 Perkongsian WhatsApp

Sistem menyediakan mesej ringkas dan membuka WhatsApp melalui
click-to-chat. Pengguna memilih penerima dan menghantar mesej sendiri;
integrasi WhatsApp API tidak termasuk dalam skop asas.

Contoh mesej:

> Resit Bayaran Koperasi Koperasi SMK Lohan Ranau Berhad\
> Nombor Resit: 2027-000001\
> Nama Murid: Contoh Murid\
> Jumlah Bayaran: RM43.00\
> Kaedah Pembayaran: Pindahan Bank\
> No. Rujukan: MBB2027010112345\
> Terima kasih.

Jangan masukkan nombor IC dalam mesej WhatsApp secara lalai.

### 4.8 Sejarah resit

Fungsi: - Senarai resit terdahulu. - Carian nombor resit atau nama
murid. - Carian IC hanya jika diperlukan dan dibenarkan. - Penapisan
mengikut tarikh. - Paparan butiran, muat turun dan cetak semula.

Resit yang telah dikeluarkan tidak patut dipadam secara senyap. Proses
pembetulan atau pembatalan mesti mengikut polisi yang dipersetujui.

### 4.9 Antara muka

Halaman sistem: 1. Log Masuk 2. Papan Pemuka 3. e-Daftar (Pendaftaran) 4.
Import Data 5. Jana Resit (e-Resit Koperasi) 6. Barangan 7. Sejarah Resit
8. Butiran Resit

Navigasi dikelompokkan mengikut ciri:

-   **Papan Pemuka**
-   **e-Daftar** — Pendaftaran, Import Data
-   **e-Resit Koperasi** — Jana Resit, Barangan, Sejarah Resit

Papan pemuka memaparkan statistik murid (belum daftar, sudah daftar,
keahlian koperasi) dan kad navigasi ke e-Daftar serta e-Resit Koperasi.

Antara muka hendaklah ringkas, responsif dan boleh digunakan melalui
pelayar komputer sekolah.

## 5. Aliran kerja petugas

### 5.1 Persediaan awal (sebelum hari pendaftaran)

1.  Petugas log masuk.
2.  Buka halaman Import Data dan muat naik fail Excel yang telah
    disahkan.
3.  Semak ringkasan import (sah, tidak sah, pendua) dan sahkan.
4.  Buka e-Daftar untuk memastikan senarai murid lengkap.
5.  Semak senarai item dan harga yang diluluskan pada halaman Barangan.

### 5.2 Hari pendaftaran (e-Daftar)

Halaman Pendaftaran berfungsi sebagai **kaunter**: cari murid, kemudian
tanda kehadiran dengan satu ketukan.

1.  Buka halaman Pendaftaran. Angka **Sudah daftar / Belum daftar /
    Didaftarkan hari ini** dan bar peratus dipaparkan di atas sekali, dan
    disegarkan automatik setiap 30 saat (sesuai untuk kaunter berbilang).
2.  Taip nama atau No. IC di kotak carian (contoh: `ahmad 140512` — setiap
    perkataan nama dan digit IC dipadankan). Tekan `/` untuk fokus ke
    kotak carian pada bila-bila masa. Guna cip **Tingkatan** / **Status
    daftar** / sekolah rendah untuk menapis.
3.  Tekan **✓ Tanda daftar** pada baris murid. Jika hanya **satu**
    padanan, tekan **Enter** untuk tanda terus. Status berubah serta-merta
    (optimistik) dan diselaraskan dengan pelayan.
4.  Tersalah tanda? Tekan **Batal** pada maklum balas di bawah skrin untuk
    memulihkan status asal.
5.  Untuk pembetulan maklumat (tingkatan, status OKU, penempatan semula),
    tekan **Butiran** — borang penuh dibuka dalam dialog. Murid baharu yang
    hadir tanpa rekod: cari namanya, kemudian tekan
    **+ Daftar "..." sebagai murid baharu** dalam senarai kosong.
6.  **Batal daftar** (pada baris yang sudah daftar) memerlukan pengesahan
    kerana ia memadam jejak kehadiran murid.

Setiap pendaftaran merekod **masa** (`registeredAt`) dan **petugas**
(`registeredBy`) yang menandakannya. Murid yang memohon penempatan semula
tetap dikira **sudah daftar** jika hadir pada hari pendaftaran.

### 5.3 Mengeluarkan resit

1.  Buka halaman Jana Resit (e-Resit Koperasi).
2.  Cari murid melalui nama atau IC.
3.  Pilih murid yang betul.
4.  Pilih item (Baju PJK ada dua pilihan: Lengan Pendek / Lengan Panjang)
    serta masukkan kuantiti.
5.  Semak jumlah.
6.  Pilih pindahan bank atau tunai. Bagi pindahan bank, isi no. rujukan.
7.  Sahkan pembayaran mengikut prosedur koperasi.
8.  Hantar permintaan untuk menyimpan resit.
9.  Backend mengesahkan data, mengira jumlah, memperuntukkan nombor unik
    dan menyimpan resit.
10. Selepas penyimpanan berjaya, sistem memaparkan resit.
11. Muat turun PDF, cetak atau kongsi melalui WhatsApp.

Apabila resit mengandungi item **Keahlian Koperasi**, murid tersebut
dikira sebagai ahli koperasi pada papan pemuka.

### 5.4 Mencari resit lama

1.  Buka Sejarah Resit.
2.  Cari menggunakan nombor resit atau maklumat yang dibenarkan.
3.  Pilih rekod.
4.  Semak dan cetak atau muat turun semula.

### 5.5 Gangguan rangkaian

Jika sambungan terputus, sistem tidak boleh memaparkan transaksi sebagai
berjaya sebelum backend mengesahkannya. Permintaan ulangan perlu
menggunakan ID permintaan unik atau semakan pendua supaya tidak mencipta
resit kedua.

## 6. Aliran teknikal

### Log masuk

1.  Pelayar log masuk melalui Firebase Authentication.
2.  Firebase memberikan token.
3.  Frontend menghantar token kepada Worker.
4.  Worker mengesahkan token dan kebenaran akaun.
5.  Permintaan tidak sah ditolak.

### Cipta resit

1.  Frontend menghantar ID murid, item, kuantiti, kaedah pembayaran dan
    ID permintaan unik.
2.  Worker mengesahkan pengguna.
3.  Worker mengesahkan murid dan item.
4.  Worker mengambil harga yang sah dan mengira semula jumlah.
5.  Worker memperuntukkan nombor resit melalui mekanisme atomik.
6.  Worker menyimpan resit dan butiran item secara konsisten.
7.  Worker memulangkan rekod yang telah disimpan.
8.  Frontend memaparkan resit dan menyediakan PDF.

### Import Excel

1.  Pilih fail `.xlsx` pada halaman Import Data.
2.  Semak lajur wajib (Nama Murid, No. IC, Sekolah Rendah Asal) dan lajur
    pilihan (Tingkatan, Status OKU, Status Daftar, Sekolah Dipohon, Sebab
    Penempatan Semula, Catatan).
3.  Paparkan rekod sah, tidak sah dan pendua.
4.  Pengguna mengesahkan import.
5.  Hantar melalui backend yang dilindungi.
6.  Paparkan ringkasan kejayaan dan kegagalan.

### Simpan / kemas kini murid (e-Daftar)

1.  Frontend menghantar medan e-Daftar (nama, IC, sekolah, tingkatan,
    status OKU, status daftar, penempatan semula).
2.  Worker mengesahkan pengguna, membersihkan teks, menyemak No. IC (12
    digit dan tarikh lahir yang munasabah), sekolah dalam senarai dan
    status OKU.
3.  Worker menyemak pendua No. IC (digit sahaja).
4.  **Cipta:** dokumen baharu disimpan dengan `active: true`. **Kemas
    kini:** hanya medan yang dihantar ditulis (updateMask), jadi tarikh
    cipta dan status aktif kekal.
5.  Jika status bertukar kepada **SUDAH**, worker merekod `registeredAt`
    (masa) dan `registeredBy` (e-mel petugas); jika kembali **BELUM**,
    kedua-dua medan dikosongkan. Status yang kekal SUDAH mengekalkan masa
    asal.
6.  Cache senarai murid dikosongkan supaya papan pemuka dan senarai
    menunjukkan data terbaharu.

### Tanda daftar pantas (hari pendaftaran)

Endpoint khas `POST /api/students/:id/status` dengan
`{"registrationStatus": "SUDAH" | "BELUM"}` — hanya menyentuh status daftar
dan jejak kehadiran (lebih ringan daripada kemas kini penuh, dan tidak
memerlukan No. IC penuh). Frontend memaparkan kesan optimistik serta-merta,
kemudian menggantikan baris dengan respons pelayan; jika gagal, keadaan
asal dipulihkan dan ralat dipaparkan sebagai maklum balas. Senarai murid
dan papan pemuka turut memulangkan `registeredTodayCount` (bilangan murid
yang ditandakan hari ini mengikut waktu Malaysia).

## 7. Struktur data dicadangkan

### `students`

-   `studentId`
-   `name`
-   `icNumber` (teks)
-   `formerPrimarySchool`
-   `tingkatan` (1-5 atau `null`)
-   `oku` (`true`/`false` atau `null` jika belum diisi)
-   `registrationStatus` (`"SUDAH"` atau `"BELUM"`; rekod lama tanpa
    medan ini dianggap `"BELUM"`)
-   `registeredAt` (masa murid ditandakan sudah daftar; `null` jika belum —
    rekod lama mungkin tiada medan ini)
-   `registeredBy` (e-mel petugas yang menandakan; untuk rujukan kaunter)
-   `transferSchool`, `transferReason`, `transferNotes` (penempatan
    semula; `null` jika tidak berkenaan)
-   `active`
-   `createdAt`
-   `updatedAt`

Tiada medan kelas; `tingkatan` hanya menandakan tahun persekolahan.

### `items`

-   `itemId`
-   `name`
-   `priceSen`
-   `active`
-   `sortOrder` (susunan mengikut Senarai Harga rasmi sekolah)
-   `fixedQuantity` (pilihan; contoh 1 untuk item yang dikunci)
-   `koperasiMembership` (pilihan; `true` pada item Keahlian Koperasi —
    digunakan untuk statistik keahlian koperasi pada papan pemuka)
-   `createdAt`
-   `updatedAt`

### `receipts`

-   `receiptId`
-   `receiptNo`
-   `year`
-   `studentId`
-   `studentNameSnapshot`
-   `formerPrimarySchoolSnapshot` jika diperlukan
-   `totalSen`
-   `paymentMethod`
-   `bankRef` (bagi pindahan bank)
-   `status`
-   `items` (tatasusunan baris resit, lihat di bawah)
-   `createdAt`
-   `createdByAccountId`
-   `requestId`

### Baris resit (`items` dalam dokumen resit)

-   `itemId`
-   `itemNameSnapshot`
-   `quantity`
-   `unitPriceSen`
-   `subtotalSen`
-   `variant` (hanya pada resit lama yang menggunakan pilihan jenis)

### Pembilang resit

Gunakan rekod pembilang tahunan atau mekanisme setara yang dikemas kini
secara atomik. Ini mengelakkan dua permintaan serentak menerima nombor
yang sama.

## 8. API Worker dicadangkan

Endpoint dikelompokkan mengikut ciri. Endpoint murid digunakan oleh
kedua-dua ciri kerana pangkalan data murid dikongsi: e-Daftar menyimpan
dan mengemas kini murid, manakala e-Resit Koperasi mencari murid untuk
resit.

  Kaedah   Endpoint                 Fungsi
  -------- ------------------------ ---------------------------
  GET      `/api/dashboard`         Statistik murid dan ringkasan resit
  GET      `/api/students`          Cari murid (q, school, tingkatan, status)
  POST     `/api/students`          Daftar murid baharu (e-Daftar)
  GET      `/api/students/:id`      Dapatkan satu murid (untuk kemas kini)
  PUT      `/api/students/:id`      Kemas kini maklumat murid
  POST     `/api/students/:id/status`  Tanda daftar pantas (SUDAH/BELUM)
  POST     `/api/students/import`   Import data murid
  GET      `/api/items`             Dapatkan item aktif
  POST     `/api/receipts`          Cipta resit
  GET      `/api/receipts`          Cari sejarah resit
  GET      `/api/receipts/:id`      Dapatkan butiran resit
  GET      `/api/health`            Semak status perkhidmatan

Statistik papan pemuka: `notRegisteredStudents`, `registeredStudents`
(mengikut `registrationStatus`), `koperasiStudents` (murid yang mempunyai
resit berstatus `ISSUED` yang mengandungi item bertanda
`koperasiMembership`), `activeStudents`, `todayCount` dan
`todayTotalSen`.

Semua endpoint yang dilindungi mesti mengesahkan token dan kebenaran
pengguna. Endpoint pengurusan harga atau pembatalan hanya ditambah jika
diluluskan dalam skop.

## 9. Akaun bersama dan keselamatan

Beberapa petugas akan menggunakan satu akaun koperasi. Oleh itu: - Rekod
yang disimpan boleh dilihat oleh pengguna yang dibenarkan. - Catat masa
transaksi dan ID akaun. - Jangan mendakwa sistem dapat mengenal pasti
petugas individu jika semua menggunakan akaun sama. - Gunakan HTTPS,
pengesahan token dan kawalan akses. - Jangan simpan kata laluan atau
rahsia backend dalam GitHub. - Hadkan akses dan paparan nombor IC. -
Sediakan log keluar dan pengurusan sesi. - Sediakan sandaran dan uji
pemulihan.

Akaun bersama mengurangkan kebolehkesanan tindakan individu. Dapatkan
kelulusan sekolah sebelum menggunakannya. Jika audit individu
diperlukan, gunakan akaun berasingan untuk setiap petugas.

## 10. Pelan pembangunan

### Fasa 1 --- Persediaan

-   Cipta repositori GitHub.
-   Sediakan Vite dan struktur frontend/Worker.
-   Sediakan README projek.

**Hasil:** aplikasi asas berjalan secara tempatan.

### Fasa 2 --- Antara muka

-   Bina log masuk dan dashboard.
-   Bina carian murid.
-   Bina pemilihan item, kuantiti dan pengiraan.
-   Bina pratonton resit.

**Hasil:** aliran kerja boleh diuji tanpa pangkalan data sebenar.

### Fasa 3 --- Firebase

-   Cipta projek Firebase.
-   Konfigurasi Authentication.
-   Tetapkan struktur Firestore dan kawalan akses.
-   Uji pengesahan token Worker.

**Hasil:** pengesahan dan akses data berfungsi.

### Fasa 4 --- Backend

-   Bina endpoint Worker.
-   Sahkan input dan kebenaran.
-   Laksanakan pengiraan backend dan nombor unik.
-   Simpan resit dan butiran item.
-   Kendalikan permintaan ulangan dan kegagalan.

**Hasil:** backend mencipta dan mendapatkan semula resit dengan betul.

### Fasa 5 --- Ciri lengkap

-   Import Excel.
-   PDF dan cetakan.
-   Sejarah dan carian resit.
-   Perkongsian WhatsApp.

**Hasil:** semua ciri teras siap.

### Fasa 6 --- Ujian dan kelulusan

-   Uji data tidak sah dan pendua.
-   Uji beberapa komputer serentak.
-   Uji nombor resit, jumlah dan PDF.
-   Uji akses, sandaran dan pemulihan.
-   Semak dengan pihak sekolah.

**Hasil:** sistem memenuhi keperluan yang diluluskan.

### Fasa 7 --- Deploy dan penyelenggaraan

-   Deploy frontend sebagai fail statik (Cloudflare Workers).
-   Deploy Worker API.
-   Tetapkan rahsia dan URL produksi (`ALLOWED_ORIGINS`,
    `VITE_API_BASE_URL`).
-   Uji versi langsung dengan pengguna yang dibenarkan.
-   Dokumentasikan sandaran dan penyelenggaraan.

**Hasil:** sistem sedia untuk kegunaan rasmi selepas kelulusan.

## 11. Senarai ujian penerimaan

-   [ ] Fail Excel yang betul boleh diimport (lajur wajib dan pilihan).
-   [ ] Data wajib kosong atau tidak sah ditangani.
-   [ ] Rekod pendua dikenal pasti.
-   [ ] Carian nama dan IC berfungsi.
-   [ ] Sekolah rendah asal boleh dipilih.
-   [ ] Murid baharu boleh didaftarkan melalui e-Daftar.
-   [ ] Status daftar, status OKU dan penempatan semula boleh dikemas
    kini dan bertahan selepas muat semula halaman.
-   [ ] Statistik papan pemuka (belum daftar, sudah daftar, keahlian
    koperasi) tepat.
-   [ ] Pengiraan jumlah tepat.
-   [ ] Backend menolak harga atau kuantiti tidak sah.
-   [ ] Nombor resit unik ketika permintaan serentak.
-   [ ] Permintaan ulangan tidak mencipta resit pendua.
-   [ ] Harga lama kekal pada resit terdahulu.
-   [ ] PDF sepadan dengan rekod tersimpan.
-   [ ] Resit lama boleh dicari dan dicetak semula.
-   [ ] Pengguna tidak dibenarkan ditolak.
-   [ ] Sandaran boleh dipulihkan.
-   [ ] Aplikasi berfungsi pada komputer dan pelayar yang digunakan.

## 12. Perkara yang perlu disahkan oleh sekolah

1.  Senarai item dan harga akhir tanpa PIBG.
2.  Format Excel dan medan murid.
3.  Senarai sekolah rendah asal yang lengkap.
4.  Senarai sekolah menengah untuk dropdown "nama sekolah dipohon"
    (buat masa ini medan teks bebas).
5.  Senarai sebab penempatan semula untuk dropdown (buat masa ini medan
    teks bebas).
6.  Sama ada IC perlu dicetak pada resit.
7.  Format nombor resit dan tahun permulaan.
8.  Susun atur resit dan logo.
9.  Kebenaran menggunakan satu akaun bersama.
10. Prosedur pembetulan atau pembatalan resit.
11. Pemilik akaun GitHub, Firebase dan Cloudflare.
12. Tempoh penyimpanan data, sandaran dan akses.

## 13. Rumusan

SPeRK (Sistem Pengurusan Pelajar dan Resit Koperasi) SMK Lohan ialah
aplikasi web untuk pendaftaran murid (e-Daftar) dan bayaran koperasi
(e-Resit Koperasi), berkongsi satu pangkalan data murid. Keperluan
terkini: **Sekolah (SK Terdahulu), Nama Murid, No. IC, Status OKU,
Status Daftar dan Penempatan Semula**, tanpa kelas dan tanpa PIBG; data
murid tidak terhad kepada Tingkatan 1.

Pembangunan bermula dengan frontend, kemudian Firebase, Firestore dan
Cloudflare Workers disambungkan secara berperingkat. Data murid sebenar
hanya dimasukkan selepas format, kawalan akses dan penggunaan sistem
disahkan oleh pihak sekolah.

------------------------------------------------------------------------

*Dokumen ini ialah rujukan perancangan. Senarai sekolah rendah dan sebab
penempatan semula masih menunggu senarai rasmi daripada pihak sekolah.*

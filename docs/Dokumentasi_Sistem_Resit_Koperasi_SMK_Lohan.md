# Dokumentasi Ciri-ciri dan Aliran Kerja

## Sistem Resit Bayaran Koperasi SMK Lohan, Ranau

**Status:** Draf perancangan untuk semakan pihak sekolah.

## 1. Pengenalan

Sistem Resit Bayaran Koperasi SMK Lohan, Ranau ialah aplikasi web untuk
merekod pembayaran koperasi, menjana resit digital dan mencari semula
rekod transaksi. Beberapa petugas boleh mengakses rekod yang sama
melalui komputer berbeza.

Skop utama ialah pengurusan maklumat murid, senarai item, pengiraan
bayaran, penjanaan resit, PDF/cetakan, perkongsian WhatsApp dan sejarah
resit.

## 2. Perubahan keperluan terkini

Maklumat murid yang digunakan: - Nama murid - Nombor kad pengenalan
(IC) - Sekolah rendah asal

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

  Hosting frontend        Cloudflare Pages        Menyediakan aplikasi
                                                  web

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

## 4. Ciri-ciri sistem

### 4.1 Pengurusan maklumat murid

Sistem menyimpan nama murid, IC dan sekolah rendah asal. Fungsi: -
Import data daripada Excel `.xlsx`. - Cari murid mengikut nama atau
nombor IC. - Pilih sekolah rendah asal daripada senarai. - Semak medan
wajib yang kosong. - Kesan kemungkinan rekod pendua. - Paparkan maklumat
murid sebelum resit dikeluarkan.

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

Senarai item dalam pangkalan data boleh dikemas kini tanpa menyentuh
data murid dengan memanggil `POST /api/dev/seed?items=1` (memerlukan
`ENABLE_SEED=true`). Panggilan tanpa `?items=1` akan menulis semula
murid contoh dan item sekali gus.

### 4.3 Pengiraan jumlah automatik

Formula:

`Jumlah item = Kuantiti × Harga seunit`

Jumlah keseluruhan ialah jumlah semua item. Contoh rekaan:

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

Antara muka web selain resit mengikut Design System sekolah: Urbanist
untuk tajuk, Inter untuk teks, warna utama biru (#355C7D), dan permukaan
rata tanpa bayang-bayang yang berlebihan.

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

Halaman yang dicadangkan: 1. Log Masuk 2. Dashboard 3. Murid 4. Barangan
5. Jana Resit 6. Sejarah Resit

Antara muka hendaklah ringkas, responsif dan boleh digunakan melalui
pelayar komputer sekolah.

## 5. Aliran kerja petugas

### 5.1 Persediaan awal

1.  Petugas log masuk.
2.  Import fail Excel yang telah disahkan.
3.  Semak senarai item dan harga yang diluluskan.
4.  Pastikan rekod yang diperlukan tersedia.

### 5.2 Mengeluarkan resit

1.  Buka halaman Jana Resit.
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

### 5.3 Mencari resit lama

1.  Buka Sejarah Resit.
2.  Cari menggunakan nombor resit atau maklumat yang dibenarkan.
3.  Pilih rekod.
4.  Semak dan cetak atau muat turun semula.

### 5.4 Gangguan rangkaian

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

1.  Pilih fail `.xlsx`.
2.  Semak lajur dan data.
3.  Paparkan rekod sah, tidak sah dan pendua.
4.  Pengguna mengesahkan import.
5.  Hantar melalui backend yang dilindungi.
6.  Paparkan ringkasan kejayaan dan kegagalan.

## 7. Struktur data dicadangkan

### `students`

-   `studentId`
-   `name`
-   `icNumber` (teks)
-   `formerPrimarySchool`
-   `active`
-   `createdAt`
-   `updatedAt`

Tiada medan kelas.

### `items`

-   `itemId`
-   `name`
-   `priceSen`
-   `active`
-   `sortOrder` (susunan mengikut Senarai Harga rasmi sekolah)
-   `fixedQuantity` (pilihan; contoh 1 untuk item yang dikunci)
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

  Kaedah   Endpoint                 Fungsi
  -------- ------------------------ ---------------------------
  GET      `/api/students`          Cari murid
  POST     `/api/students/import`   Import data murid
  GET      `/api/items`             Dapatkan item aktif
  POST     `/api/receipts`          Cipta resit
  GET      `/api/receipts`          Cari sejarah resit
  GET      `/api/receipts/:id`      Dapatkan butiran resit
  GET      `/api/health`            Semak status perkhidmatan

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
pemulihan. - Gunakan data rekaan semasa pembangunan.

Akaun bersama mengurangkan kebolehkesanan tindakan individu. Dapatkan
kelulusan sekolah sebelum menggunakannya. Jika audit individu
diperlukan, gunakan akaun berasingan untuk setiap petugas.

## 10. Pelan pembangunan

### Fasa 1 --- Persediaan

-   Cipta repositori GitHub.
-   Sediakan Vite dan struktur frontend/Worker.
-   Sediakan README dan data rekaan.

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

-   Sambungkan GitHub dengan Cloudflare Pages.
-   Deploy Worker.
-   Tetapkan rahsia dan URL produksi.
-   Uji versi langsung dengan pengguna yang dibenarkan.
-   Dokumentasikan sandaran dan penyelenggaraan.

**Hasil:** sistem sedia untuk kegunaan rasmi selepas kelulusan.

## 11. Senarai ujian penerimaan

-   [ ] Fail Excel yang betul boleh diimport.
-   [ ] Data wajib kosong atau tidak sah ditangani.
-   [ ] Rekod pendua dikenal pasti.
-   [ ] Carian nama dan IC berfungsi.
-   [ ] Sekolah rendah asal boleh dipilih.
-   [ ] Tiada medan kelas atau item PIBG.
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
4.  Sama ada IC perlu dicetak pada resit.
5.  Format nombor resit dan tahun permulaan.
6.  Susun atur resit dan logo.
7.  Kebenaran menggunakan satu akaun bersama.
8.  Prosedur pembetulan atau pembatalan resit.
9.  Pemilik akaun GitHub, Firebase dan Cloudflare.
10. Tempoh penyimpanan data, sandaran dan akses.

## 13. Rumusan

Sistem ini ialah aplikasi web ringkas untuk merekod bayaran koperasi,
menjana resit dan menyimpan sejarah transaksi. Keperluan terkini ialah
**Nama Murid, IC dan Sekolah Rendah Asal**, tanpa kelas dan tanpa PIBG.

Pembangunan dimulakan dengan frontend dan data rekaan. Firebase,
Firestore dan Cloudflare Workers disambungkan secara berperingkat. Data
sebenar murid hanya dimasukkan selepas format, kawalan akses dan
penggunaan sistem disahkan oleh pihak sekolah.

------------------------------------------------------------------------

*Dokumen ini ialah draf perancangan. Harga, format resit, senarai
sekolah rendah dan akses pengguna perlu disahkan sebelum penggunaan
produksi.*

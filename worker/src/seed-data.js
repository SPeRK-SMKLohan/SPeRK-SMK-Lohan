// DATA REKAAN SAHAJA. Harga dan murid bukan data sebenar.
export const SEED_STUDENTS = [
  { studentId: "s1", name: "Murid Contoh Satu", icNumber: "000000-00-0001", formerPrimarySchool: "SK Lohan", active: true },
  { studentId: "s2", name: "Murid Contoh Dua", icNumber: "000000-00-0002", formerPrimarySchool: "SK Poring", active: true },
  { studentId: "s3", name: "Murid Contoh Tiga", icNumber: "000000-00-0003", formerPrimarySchool: "SK Bongkud", active: true },
  { studentId: "s4", name: "Murid Contoh Empat", icNumber: "000000-00-0004", formerPrimarySchool: "SK Kirokot", active: true },
  { studentId: "s5", name: "Murid Contoh Lima", icNumber: "000000-00-0005", formerPrimarySchool: "SK Langsat", active: true },
  { studentId: "s6", name: "Murid Contoh Enam", icNumber: "000000-00-0006", formerPrimarySchool: "SK Nalapak", active: true },
  { studentId: "s7", name: "Murid Contoh Tujuh", icNumber: "000000-00-0007", formerPrimarySchool: "SK Napong", active: true },
  { studentId: "s8", name: "Murid Contoh Tujuh", icNumber: "000000-00-0008", formerPrimarySchool: "SK Sagiban", active: true },
  { studentId: "s9", name: "Murid Tidak Aktif", icNumber: "000000-00-0009", formerPrimarySchool: "SK Lohan", active: false },
];

// Harga daripada "Senarai Harga Barangan Koperasi dan Yuran" (pihak sekolah).
// fixedQuantity: kuantiti dikunci (pengguna tidak boleh ubah).
// Susunan item mengikut Bil. dalam Senarai Harga rasmi sekolah.
export const SEED_ITEMS = [
  { itemId: "i1", name: "Lencana Sekolah + Tanda Nama (3 Set)", priceSen: 1200, active: true, sortOrder: 1, fixedQuantity: 1 },
  { itemId: "i2", name: "Baju PJK (Lengan Pendek)", priceSen: 4000, active: true, sortOrder: 2 },
  { itemId: "i10", name: "Baju PJK (Lengan Panjang)", priceSen: 4300, active: true, sortOrder: 3 },
  { itemId: "i3", name: "Tali Leher Sekolah", priceSen: 1550, active: true, sortOrder: 4 },
  { itemId: "i4", name: "Fail murid", priceSen: 350, active: true, sortOrder: 5 },
  { itemId: "i5", name: "Buku PAJSK (Kegunaan T1-T5)", priceSen: 700, active: true, sortOrder: 6 },
  { itemId: "i6", name: "Buku Peraturan Sekolah", priceSen: 550, active: true, sortOrder: 7 },
  { itemId: "i7", name: "Keahlian Koperasi (sekali sepanjang tempoh persekolahan)", priceSen: 500, active: true, sortOrder: 8, fixedQuantity: 1 },
  { itemId: "i8", name: "Buku Tulis SMK Lohan (4 buku panjang + 8 buku pendek)", priceSen: 2400, active: true, sortOrder: 9 },
];
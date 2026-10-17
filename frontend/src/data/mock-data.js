// DATA REKAAN SAHAJA. Harga dan murid bukan data sebenar.

// Senarai awal, perlu disahkan oleh pihak sekolah.
export const schools = [
  "SK Bongkud", "SK Kirokot", "SK Langsat", "SK Lohan", "SK Nalapak",
  "SK Napong", "SK Narawang", "SK Perancangan", "SK Poring", "SK Sagiban",
];

export const paymentMethods = [
  { value: "QR", label: "QR" },
  { value: "BANK_TRANSFER", label: "Pindahan Bank" },
  { value: "CASH", label: "Tunai" },
];

export const items = [
  { itemId: "i1", name: "Lencana & Tanda Nama", priceSen: 300, active: true },
  { itemId: "i2", name: "Baju PJK", priceSen: 2500, active: true, sizes: ["S", "M", "L", "XL"] },
  { itemId: "i3", name: "Tali Leher Sekolah", priceSen: 800, active: true },
  { itemId: "i4", name: "Fail Murid", priceSen: 500, active: true },
  { itemId: "i5", name: "Buku PAJSK", priceSen: 400, active: true },
  { itemId: "i6", name: "Buku Peraturan Sekolah", priceSen: 300, active: true },
  { itemId: "i7", name: "Keahlian Koperasi", priceSen: 1000, active: true },
  { itemId: "i8", name: "Buku Tulis Panjang", priceSen: 200, active: true },
  { itemId: "i9", name: "Buku Tulis Pendek", priceSen: 150, active: true },
];

// IC disimpan sebagai teks supaya sifar di hadapan tidak hilang.
// Murid Contoh Tujuh ada dua rekod untuk menguji nama yang sama.
export const students = [
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
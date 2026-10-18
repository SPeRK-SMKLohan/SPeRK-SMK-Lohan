// Pilihan medan e-Daftar.
// Senarai sekolah rendah asal (perlu disahkan oleh pihak sekolah).
// Simpan senarai ini sama dengan worker/src/features/e-daftar/schools.js.
export const schools = [
  "SK Bongkud", "SK Kirokot", "SK Langsat", "SK Lohan", "SK Nalapak",
  "SK Napong", "SK Narawang", "SK Perancangan", "SK Poring", "SK Sagiban",
];

export const tingkatanOptions = [1, 2, 3, 4, 5];

export const okuOptions = [
  { value: "true", label: "Ya" },
  { value: "false", label: "Tidak" },
];

export const registrationStatusOptions = [
  { value: "SUDAH", label: "Sudah daftar" },
  { value: "BELUM", label: "Belum daftar" },
];

// Sebab penempatan semula (senarai rasmi daripada pihak sekolah, 18 Okt 2026).
// "notes" diisi automatik ke medan Catatan dalam borang; pengguna masih boleh mengeditnya.
// Nilai "value" disimpan dalam medan transferReason murid.
export const transferReasons = [
  {
    value: "Sekolah lebih dekat",
    notes: "Memohon penempatan semula ke sekolah yang lebih hampir dengan kediaman bagi memudahkan urusan pengangkutan dan memastikan kehadiran murid secara konsisten.",
  },
  {
    value: "Berpindah rumah",
    notes: "Permohonan dibuat berikutan perpindahan tempat tinggal keluarga ke kawasan berhampiran sekolah yang dipohon.",
  },
  {
    value: "Masalah pengangkutan",
    notes: "Memohon penempatan semula kerana menghadapi kekangan pengangkutan ke sekolah yang ditetapkan.",
  },
  {
    value: "Adik-beradik di sekolah sama",
    notes: "Memohon penempatan semula bagi membolehkan murid bersekolah bersama adik-beradik serta memudahkan urusan penghantaran dan pengambilan oleh ibu bapa.",
  },
];

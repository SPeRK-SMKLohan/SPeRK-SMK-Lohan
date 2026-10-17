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

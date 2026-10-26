// Senarai awal, perlu disahkan oleh pihak sekolah.
// Simpan senarai ini sama dengan frontend/src/features/e-daftar/constants.js.
export const SCHOOLS = [
  "SK Bongkud", "SK Kirokot", "SK Langsat", "SK Lohan", "SK Nalapak",
  "SK Napong", "SK Narawang", "SK Perancangan", "SK Poring", "SK Sagiban",
];

// Carian pantas tanpa mengira huruf besar/kecil.
export const SCHOOL_LOOKUP = new Map(SCHOOLS.map((s) => [s.toLowerCase(), s]));

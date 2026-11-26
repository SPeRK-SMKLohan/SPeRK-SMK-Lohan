// Satu glyph untuk "tiada nilai" di dalam sel data atau angka ringkasan.
// Ayat penuh ("Tiada murid", "Belum dipilih") ialah mesej keadaan kosong,
// bukan placeholder, jadi ia kekal sebagai prosa.
export const EMPTY_VALUE = "—";

// Mengelakkan teks daripada dianggap HTML. Gunakan untuk semua data dinamik.
export function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// 000000-00-0001 -> ******-**-0001
export function maskIC(ic) {
  return String(ic).replace(/\d(?=.*\d{4}$)/g, "*");
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" });
}

// Full weekday form used by the top bar. Receipts use formatDateTime instead:
// the bar names today, while a document needs its own timestamp.
export function formatLongDate(value = new Date()) {
  return new Date(value).toLocaleDateString("ms-MY", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit" });
}

// 1234 -> 1,234. Figures on the dashboard are read at a glance, so the
// thousands separator matters more than the exact locale rules.
export function formatCount(value) {
  return Number(value || 0).toLocaleString("ms-MY");
}

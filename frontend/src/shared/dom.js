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

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit" });
}

export function formatClock(date = new Date()) {
  return date.toLocaleTimeString("ms-MY", { hour: "numeric", minute: "2-digit", second: "2-digit" });
}
import { paymentMethods } from "../data/constants.js";

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

export function normalizeIC(value) {
  return String(value).replace(/\D/g, "");
}

export function formatDateTime(iso) {
  return new Date(iso).toLocaleString("ms-MY", { dateStyle: "medium", timeStyle: "short" });
}

// Tarikh tempatan dalam bentuk YYYY-MM-DD
export function localDateKey(iso) {
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export function paymentLabel(value) {
  return paymentMethods.find((p) => p.value === value)?.label ?? value;
}
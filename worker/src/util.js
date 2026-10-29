export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const ID_RE = /^[A-Za-z0-9_-]{1,100}$/;
export const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const DAY_MS = 86400000;

// Membaca badan permintaan JSON (had 20 KB untuk borang).
export async function readJson(request) {
  const text = await request.text();
  if (text.length > 20_000) throw new HttpError(413, "Permintaan terlalu besar.");
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, "Permintaan tidak sah.");
  }
}

// 000000-00-0001 -> ******-**-0001
export function maskIC(ic) {
  return String(ic ?? "").replace(/\d(?=.*\d{4}$)/g, "*");
}

export function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

// Masa Malaysia (UTC+8) digunakan untuk tahun resit dan tarikh.
const MY_OFFSET_MS = 8 * 3600 * 1000;

export function myYear(date = new Date()) {
  return new Date(date.getTime() + MY_OFFSET_MS).getUTCFullYear();
}

export function myDateKey(date = new Date()) {
  return new Date(date.getTime() + MY_OFFSET_MS).toISOString().slice(0, 10);
}

export function myDayStart(key) {
  return new Date(`${key}T00:00:00+08:00`);
}

export function parseDateKey(value) {
  if (!value) return null;
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    Number.isNaN(myDayStart(value).getTime()) ||
    myDateKey(myDayStart(value)) !== value
  ) {
    throw new HttpError(400, "Tarikh tidak sah.");
  }
  return value;
}

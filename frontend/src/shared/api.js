import { getIdToken, signOutUser } from "./auth.js";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");
const READ_TIMEOUT_MS = 10000;
const READ_ATTEMPTS = 3;
const readRequests = new Map();

const retryableStatus = (status) => [408, 425, 429, 500, 502, 503, 504].includes(status);
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function apiFetch(path, options = {}) {
  const token = await getIdToken();
  const method = (options.method || "GET").toUpperCase();
  const isRead = method === "GET";
  const requestKey = isRead ? `${API_BASE}${path}:${token}` : null;
  if (requestKey && readRequests.has(requestKey)) return readRequests.get(requestKey);

  const request = (async () => {
    let lastError;
    for (let attempt = 1; attempt <= (isRead ? READ_ATTEMPTS : 1); attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), READ_TIMEOUT_MS);
      let res;
      try {
        res = await fetch(`${API_BASE}${path}`, {
          ...options,
          headers: { ...options.headers, Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
      } catch (err) {
        lastError = err?.name === "AbortError"
          ? new Error("Pelayan mengambil masa terlalu lama. Sila cuba Muat semula.")
          : new Error("Tidak dapat menyambung ke pelayan. Semak rangkaian dan cuba Muat semula.");
        clearTimeout(timer);
        if (attempt < (isRead ? READ_ATTEMPTS : 1)) {
          await wait(400 * attempt + Math.random() * 300);
          continue;
        }
        throw lastError;
      }
      clearTimeout(timer);

      if (isRead && retryableStatus(res.status) && attempt < READ_ATTEMPTS) {
        await wait(400 * attempt + Math.random() * 300);
        continue;
      }

      const data = await res.json().catch(() => ({}));

      // Sesi tidak sah, tamat, atau akaun tidak dibenarkan: log keluar dan kembali ke halaman log masuk.
      if (res.status === 401 || res.status === 403) {
        await signOutUser();
        location.hash = "/login";
      }

      if (!res.ok) {
        const err = new Error(data.error || `Ralat pelayan (${res.status})`);
        err.status = res.status;
        throw err;
      }
      return data;
    }
    throw lastError || new Error("Tidak dapat memuatkan data. Sila cuba lagi.");
  })();

  if (!requestKey) return request;
  readRequests.set(requestKey, request);
  try {
    return await request;
  } finally {
    if (readRequests.get(requestKey) === request) readRequests.delete(requestKey);
  }
}

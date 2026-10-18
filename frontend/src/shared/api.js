import { getIdToken, signOutUser } from "./auth.js";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8787").replace(/\/$/, "");

export async function apiFetch(path, options = {}) {
  const token = await getIdToken();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if (err?.name === "AbortError") {
      throw new Error("Permintaan tamat masa. Semak sambungan rangkaian.");
    }
    throw new Error("Tidak dapat menyambung ke pelayan.");
  }
  clearTimeout(timer);

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
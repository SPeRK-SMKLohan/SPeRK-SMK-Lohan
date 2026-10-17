import { initializeApp } from "firebase/app";
import { initializeAuth, getAuth, browserSessionPersistence } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const missing = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);
if (missing.length) {
  throw new Error(`Konfigurasi Firebase tidak lengkap: ${missing.join(", ")}. Semak frontend/.env.local`);
}

export const app = initializeApp(firebaseConfig);

// Sesi tamat apabila tab ditutup (sesuai untuk komputer bersama di sekolah).
// getAuth() sebagai sandaran jika initializeAuth sudah dipanggil sebelum ini
// (contoh: muat semula modul ketika `vite dev`/HMR), kerana ia hanya boleh dipanggil sekali.
function createAuth() {
  try {
    return initializeAuth(app, { persistence: browserSessionPersistence });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
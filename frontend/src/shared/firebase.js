import { initializeApp } from "firebase/app";
import { initializeAuth, getAuth, browserLocalPersistence } from "firebase/auth";

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

// Kekalkan sesi apabila tab ditutup; guru masih boleh log keluar secara manual.
// getAuth() sebagai sandaran jika initializeAuth sudah dipanggil sebelum ini
// (contoh: muat semula modul ketika `vite dev`/HMR), kerana ia hanya boleh dipanggil sekali.
function createAuth() {
  try {
    return initializeAuth(app, { persistence: browserLocalPersistence });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();

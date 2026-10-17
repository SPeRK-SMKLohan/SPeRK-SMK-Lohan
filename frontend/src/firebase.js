import { initializeApp } from "firebase/app";
import { initializeAuth, browserSessionPersistence } from "firebase/auth";

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
export const auth = initializeAuth(app, { persistence: browserSessionPersistence });
import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase.js";

// Tunggu Firebase memulihkan sesi sebelum memaparkan halaman. Pemulihan sesi
// menggunakan storan setempat dan boleh mengambil lebih 5 saat pada peranti
// sekolah yang perlahan. Jangan anggap pengguna telah log keluar hanya kerana
// callback awal Firebase lambat.
let ready;
export function initAuth() {
  ready ??= new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      ready = undefined;
      // Gagal secara jelas supaya aplikasi memaparkan pilihan cuba semula,
      // bukannya mengalihkan guru ke log masuk dengan sesi yang masih pulih.
      reject(new Error("Pemulihan sesi mengambil masa terlalu lama. Sila cuba semula."));
    }, 15000);
    const onError = (error) => {
      clearTimeout(timer);
      unsubscribe();
      ready = undefined;
      reject(error);
    };
    const unsubscribe = onAuthStateChanged(auth, () => {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    }, onError);
  });
  return ready;
}

export const isLoggedIn = () => !!auth.currentUser;
export const currentEmail = () => auth.currentUser?.email ?? "";

export async function signIn(email, password) {
  await signInWithEmailAndPassword(auth, email, password);
}

export function signOutUser() {
  return signOut(auth);
}

// Pengesahan semula dengan kata laluan akaun pengguna sendiri — diperlukan untuk
// tindakan sensitif (cth: memadam murid). Kata laluan hanya dihantar ke Firebase,
// tidak sekali-kali ke pelayan API.
export async function reauthenticate(password) {
  const user = auth.currentUser;
  if (!user?.email) throw new Error("Belum log masuk.");
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
}

// getIdToken memperbaharui token secara automatik apabila hampir tamat.
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) throw new Error("Belum log masuk.");
  let timer;
  try {
    return await Promise.race([
      user.getIdToken(),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("Pengesahan mengambil masa terlalu lama. Semak rangkaian dan cuba semula.")), 15000);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// Mesej sengaja tidak menyatakan sama ada e-mel atau kata laluan yang salah.
export function loginErrorMessage(err) {
  switch (err?.code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return "E-mel atau kata laluan tidak betul.";
    case "auth/too-many-requests":
      return "Terlalu banyak percubaan. Sila cuba lagi sebentar.";
    case "auth/network-request-failed":
      return "Tiada sambungan rangkaian.";
    default:
      return "Log masuk gagal. Sila cuba lagi.";
  }
}

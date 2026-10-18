import { EmailAuthProvider, onAuthStateChanged, reauthenticateWithCredential, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "./firebase.js";

// Tunggu Firebase memulihkan sesi sebelum memaparkan halaman.
// Had masa supaya aplikasi tidak tersekat pada "Memuatkan" jika rangkaian
// disekat (contoh: Brave Shields menyekat domain Google/Firebase).
let ready;
export function initAuth() {
  ready ??= new Promise((resolve) => {
    const timer = setTimeout(() => {
      unsubscribe();
      resolve();
    }, 8000);
    const unsubscribe = onAuthStateChanged(auth, () => {
      clearTimeout(timer);
      unsubscribe();
      resolve();
    });
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
  return user.getIdToken();
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
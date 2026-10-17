import { fieldFilter, runQuery, toValue } from "../firestore.js";
import { maskIC } from "../util.js";

/* ---------- Lapisan data murid yang dikongsi e-Daftar dan e-Resit ---------- */

// Semua medan murid daripada dokumen Firestore, dengan nilai lalai yang selamat.
export function studentFromDoc(d) {
  return {
    studentId: d.id,
    name: d.name ?? "",
    icNumber: d.icNumber ?? "",
    formerPrimarySchool: d.formerPrimarySchool ?? "",
    tingkatan: Number.isInteger(d.tingkatan) ? d.tingkatan : null,
    oku: typeof d.oku === "boolean" ? d.oku : null,
    registrationStatus: d.registrationStatus === "SUDAH" ? "SUDAH" : "BELUM",
    transferSchool: d.transferSchool ?? "",
    transferReason: d.transferReason ?? "",
    transferNotes: d.transferNotes ?? "",
  };
}

// Versi untuk senarai: No. IC penuh tidak dihantar ke pelayar.
export function publicStudent(s) {
  return {
    studentId: s.studentId,
    name: s.name,
    icMasked: maskIC(s.icNumber),
    formerPrimarySchool: s.formerPrimarySchool,
    tingkatan: s.tingkatan,
    oku: s.oku,
    registrationStatus: s.registrationStatus,
    transferSchool: s.transferSchool,
    transferReason: s.transferReason,
    transferNotes: s.transferNotes,
  };
}

/* ---------- Cache senarai murid (mengurangkan bacaan Firestore) ---------- */
let studentsCache = { at: 0, data: null };
const STUDENTS_TTL_MS = 60_000;

export function clearStudentsCache() {
  studentsCache = { at: 0, data: null };
}

export async function getActiveStudents(env) {
  if (studentsCache.data && Date.now() - studentsCache.at < STUDENTS_TTL_MS) return studentsCache.data;
  const docs = await runQuery(env, {
    from: [{ collectionId: "students" }],
    where: fieldFilter("active", "EQUAL", toValue(true)),
  });
  const data = docs.map((d) => studentFromDoc(d)).sort((a, b) => a.name.localeCompare(b.name));
  studentsCache = { at: Date.now(), data };
  return data;
}

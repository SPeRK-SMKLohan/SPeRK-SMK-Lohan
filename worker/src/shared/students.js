import { fieldFilter, runQuery, toValue } from "../firestore.js";
import { maskIC } from "../util.js";

/* ---------- Lapisan data murid yang dikongsi e-Daftar dan e-Resit ---------- */

// Semua medan murid daripada dokumen Firestore, dengan nilai lalai yang selamat.
// registeredAt/registeredBy dijejak apabila status bertukar kepada SUDAH
// (untuk kemajuan hari pendaftaran). Rekod lama tiada nilai ini.
export function studentFromDoc(d) {
  return {
    studentId: d.id,
    name: d.name ?? "",
    icNumber: d.icNumber ?? "",
    formerPrimarySchool: d.formerPrimarySchool ?? "",
    tingkatan: Number.isInteger(d.tingkatan) ? d.tingkatan : null,
    oku: typeof d.oku === "boolean" ? d.oku : null,
    registrationStatus: d.registrationStatus === "SUDAH" ? "SUDAH" : "BELUM",
    registeredAt: d.registeredAt ?? null,
    registeredBy: d.registeredBy ?? "",
    transferSchool: d.transferSchool ?? "",
    transferReason: d.transferReason ?? "",
    transferNotes: d.transferNotes ?? "",
  };
}

// Versi untuk senarai: No. IC penuh tidak dihantar ke pelayar.
export function publicStudent(s) {
  return {
    studentId: s.studentId,
    name: String(s.name ?? "").toUpperCase(), // Paparan HURUF BESAR (keperluan sekolah)
    icMasked: maskIC(s.icNumber),
    formerPrimarySchool: s.formerPrimarySchool,
    tingkatan: s.tingkatan,
    oku: s.oku,
    registrationStatus: s.registrationStatus,
    registeredAt: s.registeredAt ?? null,
    registeredBy: s.registeredBy ?? "",
    transferSchool: s.transferSchool,
    transferReason: s.transferReason,
    transferNotes: s.transferNotes,
  };
}

/* ---------- Cache senarai murid (mengurangkan bacaan Firestore) ---------- */
let studentsCache = { at: 0, data: null };
let studentsPending = null;
const STUDENTS_TTL_MS = 60_000;

// Kunci Cache API: dikongsi antara semua isolate dalam PoP yang sama, jadi
// 30-40 peranti di sekolah tidak mencetuskan pertanyaan Firestore berulang.
// URL rekaan ini tidak pernah diakses melalui rangkaian.
const STUDENTS_CACHE_KEY = "https://sperk-cache.internal/students-active";
const studentsCacheRequest = () => new Request(STUDENTS_CACHE_KEY);

export async function clearStudentsCache() {
  studentsCache = { at: 0, data: null };
  try {
    await caches.default.delete(studentsCacheRequest());
  } catch {
    /* Cache API tidak tersedia (contoh: ujian tempatan tertentu). */
  }
}

export async function getActiveStudents(env) {
  if (studentsCache.data && Date.now() - studentsCache.at < STUDENTS_TTL_MS) return studentsCache.data;
  if (studentsPending) return studentsPending;

  // Satu pertanyaan sahaja dikongsi oleh semua permintaan serentak.
  studentsPending = (async () => {
    try {
      try {
        const hit = await caches.default.match(studentsCacheRequest());
        if (hit) {
          const data = await hit.json();
          studentsCache = { at: Date.now(), data };
          return data;
        }
      } catch {
        /* Teruskan ke Firestore jika Cache API gagal. */
      }

      const docs = await runQuery(env, {
        from: [{ collectionId: "students" }],
        where: fieldFilter("active", "EQUAL", toValue(true)),
      });
      const data = docs.map((d) => studentFromDoc(d)).sort((a, b) => a.name.localeCompare(b.name));
      studentsCache = { at: Date.now(), data };
      try {
        await caches.default.put(
          studentsCacheRequest(),
          Response.json(data, { headers: { "Cache-Control": "max-age=60" } })
        );
      } catch {
        /* Simpanan cache gagal: data tetap dikembalikan. */
      }
      return data;
    } finally {
      studentsPending = null;
    }
  })();
  return studentsPending;
}

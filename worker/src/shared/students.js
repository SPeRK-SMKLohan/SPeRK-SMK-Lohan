import { fieldFilter, runQuery, toValue } from "../firestore.js";
import { maskIC } from "../util.js";

/* ---------- Lapisan data murid yang dikongsi e-Daftar dan e-Resit ---------- */

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
    koperasiMember: d.koperasiMember === true,
  };
}

export function publicStudent(s) {
  return {
    studentId: s.studentId,
    name: s.name,
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

/* ---------- Cache senarai murid: muatan penuh sekali, kemudian delta ---------- */
/*
 * Rekabentuk:
 * - Muatan penuh dibaca daripada Firestore hanya sekali (cache sejuk atau luput).
 * - Selepas itu, setiap penyegaran hanya menanyakan dokumen yang BERUBAH
 *   (updatedAt >= titik akhir muatan terakhir), jadi bacaan Firestore kekal kecil
 *   walaupun 30-40 peranti meninjau setiap 30 saat.
 * - Keadaan cache dikongsi antara isolate dalam satu PoP (Cache API), jadi
 *   isolate baharu boleh terus menyambung daripada keadaan terkini.
 * - Tulisan tunggal (cipta/kemas kini/tanda daftar) digabung terus ke cache
 *   supaya paparan guru segera terkini tanpa menunggu pusingan delta.
 */
const SYNC_INTERVAL_MS = 10_000;      // selagi ini, cache memori dianggap segar
const SHARED_MAX_AGE_S = 3 * 3600;    // hayat entri Cache API (3 jam)
const SLACK_MS = 10_000;              // toleransi susunan commit untuk delta
const SHARED_KEY = "https://sperk-cache.internal/students-active";
const sharedRequest = () => new Request(SHARED_KEY);

let mem = { data: null, checkedAt: 0 };
let pending = null;

function sortStudents(list) {
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

async function readShared() {
  try {
    const hit = await caches.default.match(sharedRequest());
    if (!hit) return null;
    const parsed = await hit.json();
    if (!Array.isArray(parsed?.data)) return null;
    return { data: parsed.data, checkedAt: typeof parsed.checkedAt === "number" ? parsed.checkedAt : 0 };
  } catch {
    return null;
  }
}

async function writeShared(state) {
  try {
    await caches.default.put(
      sharedRequest(),
      Response.json(
        { data: state.data, checkedAt: state.checkedAt },
        { headers: { "Cache-Control": `max-age=${SHARED_MAX_AGE_S}` } }
      )
    );
  } catch {
    /* Cache API tidak tersedia (contoh: ujian tempatan). */
  }
}

async function loadFull(env) {
  const docs = await runQuery(env, {
    from: [{ collectionId: "students" }],
    where: fieldFilter("active", "EQUAL", toValue(true)),
  });
  return sortStudents(docs.map((d) => studentFromDoc(d)));
}

async function loadDelta(env, sinceMs) {
  // Firestore updatedAt fields are timestamps; send a JS Date so toValue
  // encodes the query boundary as timestampValue instead of stringValue.
  const boundary = new Date(sinceMs - SLACK_MS);
  const docs = await runQuery(env, {
    from: [{ collectionId: "students" }],
    where: fieldFilter("updatedAt", "GREATER_THAN_OR_EQUAL", toValue(boundary)),
  });
  return docs;
}

function mergeList(base, changed) {
  const map = new Map(base.map((s) => [s.studentId, s]));
  for (const d of changed) {
    const s = studentFromDoc(d);
    if (s.studentId) map.set(s.studentId, s);
  }
  return sortStudents([...map.values()]);
}

async function syncOne(env) {
  const now = Date.now();
  let state = mem.data ? { data: mem.data, checkedAt: mem.checkedAt } : await readShared();

  if (state?.data && now - state.checkedAt < SYNC_INTERVAL_MS) {
    mem = { data: state.data, checkedAt: state.checkedAt };
    return mem.data;
  }

  if (!state?.data) {
    const data = await loadFull(env);
    const checkedAt = Date.now();
    state = { data, checkedAt };
  } else {
    const changed = await loadDelta(env, state.checkedAt);
    const merged = mergeList(state.data, changed);
    const checkedAt = Date.now();
    state = { data: merged, checkedAt };
  }

  mem = state;
  await writeShared(state);
  return state.data;
}

export async function getActiveStudents(env) {
  if (mem.data && Date.now() - mem.checkedAt < SYNC_INTERVAL_MS) return mem.data;
  if (pending) return pending;

  pending = (async () => {
    try {
      return await syncOne(env);
    } finally {
      pending = null;
    }
  })();
  return pending;
}

// Gabung satu murid ke cache (selepas tulisan tunggal) supaya paparan segera
// terkini tanpa menunggu pusingan delta.
export async function mergeStudentIntoCache(doc) {
  const s = studentFromDoc(doc);
  if (!s.studentId) return;

  if (mem.data) {
    const i = mem.data.findIndex((x) => x.studentId === s.studentId);
    if (i >= 0) mem.data[i] = s;
    else mem.data.push(s);
    sortStudents(mem.data);
  }

  const state = await readShared();
  if (state?.data) {
    const i = state.data.findIndex((x) => x.studentId === s.studentId);
    if (i >= 0) state.data[i] = s;
    else state.data.push(s);
    sortStudents(state.data);
    await writeShared(state);
  }
}

// Lupus cache (import/muatan pukal): bacaan penuh semula dilakukan pada
// permintaan seterusnya.
export async function invalidateStudentsCache() {
  mem = { data: null, checkedAt: 0 };
  try {
    await caches.default.delete(sharedRequest());
  } catch {
    /* Cache API tidak tersedia. */
  }
}

// Kompatibiliti dengan nama lama yang digunakan oleh pemanggil lain.
export async function clearStudentsCache() {
  await invalidateStudentsCache();
}

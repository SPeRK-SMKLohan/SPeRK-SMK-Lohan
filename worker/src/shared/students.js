import { fieldFilter, runQuery, toValue } from "../firestore.js";
import { maskIC } from "../util.js";

/* ---------- Lapisan data murid yang dikongsi e-Daftar dan e-Resit ---------- */

export function studentFromDoc(d) {
  return {
    studentId: d.id,
    name: String(d.name ?? "").toUpperCase(),
    icNumber: d.icNumber ?? "",
    motherPhone: d.motherPhone ?? "",
    fatherPhone: d.fatherPhone ?? "",
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
    name: String(s.name ?? "").toUpperCase(),
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
const SYNC_INTERVAL_MS = 30_000;      // sejajar penyegaran kaunter; kurangkan bacaan delta serentak
const SHARED_MAX_AGE_S = 3 * 3600;    // hayat entri Cache API (3 jam)
const SLACK_MS = 10_000;              // toleransi susunan commit untuk delta
// Bump the cache namespace after the bulk Firestore reset so every Cloudflare
// location discards its old per-PoP student snapshot and reloads Firestore.
const SHARED_KEY = "https://sperk-cache.internal/students-active-v3";
const SHARED_GEN_KEY = "https://sperk-cache.internal/students-active-gen-v3";
const sharedRequest = () => new Request(SHARED_KEY);
const sharedGenRequest = () => new Request(SHARED_GEN_KEY);

let mem = { data: null, checkedAt: 0, gen: 0 };
let pending = null;
const SCHOOL_CACHE_TTL_MS = 30_000;
const schoolMem = new Map();
const schoolPending = new Map();

function sortStudents(list) {
  return list.sort((a, b) => a.name.localeCompare(b.name));
}

async function readShared() {
  try {
    const hit = await caches.default.match(sharedRequest());
    if (!hit) return null;
    const parsed = await hit.json();
    const gen = typeof parsed?.gen === "number" ? parsed.gen : 0;
    const checkedAt = typeof parsed?.checkedAt === "number" ? parsed.checkedAt : 0;
    const data = Array.isArray(parsed?.data) ? parsed.data : null;
    return { data, checkedAt, gen };
  } catch {
    return null;
  }
}

// Isolate yang sudah panas hanya perlu membaca penanda kecil ini untuk
// mengesan import/padam. Jangan muat turun dan parse senarai penuh murid bagi
// setiap carian atau penukaran halaman.
async function readSharedGen() {
  try {
    const hit = await caches.default.match(sharedGenRequest());
    if (!hit) return null;
    const parsed = await hit.json();
    return typeof parsed?.gen === "number" ? parsed.gen : null;
  } catch {
    return null;
  }
}

async function writeShared(state) {
  try {
    await caches.default.put(
      sharedRequest(),
      Response.json(
        { data: state.data, checkedAt: state.checkedAt, gen: state.gen ?? 0 },
        { headers: { "Cache-Control": `max-age=${SHARED_MAX_AGE_S}` } }
      )
    );
    await caches.default.put(
      sharedGenRequest(),
      Response.json({ gen: state.gen ?? 0 }, { headers: { "Cache-Control": `max-age=${SHARED_MAX_AGE_S}` } })
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

// Pendaftaran sentiasa memaparkan satu sekolah pada satu masa. Pada cache sejuk,
// baca sekolah itu sahaja dan bukannya memuat turun seluruh kohort untuk kemudian
// membuang sembilan persepuluh daripadanya. Cache per sekolah dikongsi dalam PoP.
export async function getActiveStudentsForSchool(env, school) {
  const sharedGen = await readSharedGen();
  const gen = sharedGen ?? mem.gen ?? 0;
  const now = Date.now();
  const local = schoolMem.get(school);
  if (local && local.gen === gen && now - local.checkedAt < SCHOOL_CACHE_TTL_MS) {
    return local.data;
  }
  if (schoolPending.has(school)) return schoolPending.get(school);

  const request = (async () => {
    try {
      const cacheKey = new Request(`https://sperk-cache.internal/students-school-v1/${encodeURIComponent(school)}`);
      try {
        const hit = await caches.default.match(cacheKey);
        if (hit) {
          const cached = await hit.json();
          if (Array.isArray(cached?.data) && cached.gen === gen && Date.now() - cached.checkedAt < SCHOOL_CACHE_TTL_MS) {
            const state = { data: cached.data, checkedAt: cached.checkedAt, gen };
            schoolMem.set(school, state);
            return state.data;
          }
        }
      } catch {
        /* Cache miss: dapatkan senarai terkini daripada Firestore. */
      }

      const docs = await runQuery(env, {
        from: [{ collectionId: "students" }],
        where: fieldFilter("formerPrimarySchool", "EQUAL", toValue(school)),
        select: {
          fields: [
            "active", "name", "icNumber", "formerPrimarySchool", "tingkatan", "oku",
            "registrationStatus", "registeredAt", "registeredBy", "transferSchool",
            "transferReason", "transferNotes",
          ].map((fieldPath) => ({ fieldPath })),
        },
      });
      const data = sortStudents(docs
        .filter((doc) => doc.active === true)
        .map((doc) => studentFromDoc(doc)));
      const state = { data, checkedAt: Date.now(), gen };
      schoolMem.set(school, state);
      try {
        await caches.default.put(cacheKey, Response.json(state, {
          headers: { "Cache-Control": `max-age=${Math.ceil(SCHOOL_CACHE_TTL_MS / 1000)}` },
        }));
      } catch {
        /* Data tetap dipaparkan jika Cache API tidak tersedia. */
      }
      return data;
    } finally {
      schoolPending.delete(school);
    }
  })();
  schoolPending.set(school, request);
  return request;
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
    if (!s.studentId) continue;
    if (d.active === false) map.delete(s.studentId);
    else map.set(s.studentId, s);
  }
  return sortStudents([...map.values()]);
}

async function syncOne(env) {
  const now = Date.now();

  // Laluan biasa: cache isolate masih segar dan tiada perubahan global.
  // Penanda beberapa bait jauh lebih murah daripada membaca keseluruhan JSON.
  if (mem.data && now - mem.checkedAt < SYNC_INTERVAL_MS) {
    const sharedGen = await readSharedGen();
    if (sharedGen === null || sharedGen === (mem.gen ?? 0)) return mem.data;
  }

  const shared = await readShared();

  // Isolate lain telah melupuskan cache (import/padam). Jangan gabungkan delta ke senarai lapuk.
  if (shared && shared.gen !== (mem.gen ?? 0)) {
    mem = {
      data: Array.isArray(shared.data) ? shared.data : null,
      checkedAt: Array.isArray(shared.data) ? shared.checkedAt : 0,
      gen: shared.gen,
    };
  }

  if (mem.data && now - mem.checkedAt < SYNC_INTERVAL_MS) return mem.data;

  let state = mem.data
    ? { data: mem.data, checkedAt: mem.checkedAt, gen: mem.gen ?? 0 }
    : shared?.data
      ? shared
      : null;

  if (state?.data && now - state.checkedAt < SYNC_INTERVAL_MS) {
    mem = { data: state.data, checkedAt: state.checkedAt, gen: state.gen ?? 0 };
    return mem.data;
  }

  if (!state?.data) {
    const data = await loadFull(env);
    const checkedAt = Date.now();
    state = { data, checkedAt, gen: mem.gen ?? shared?.gen ?? 0 };
  } else {
    try {
      const changed = await loadDelta(env, state.checkedAt);
      const merged = mergeList(state.data, changed);
      const checkedAt = Date.now();
      state = { data: merged, checkedAt, gen: state.gen ?? mem.gen ?? 0 };
    } catch (error) {
      // A temporary Firestore/network problem must not blank the registration
      // list when a usable snapshot is already available. Serve that snapshot
      // and pause delta attempts for one normal sync interval; the next read
      // will retry and reconcile changes. Never use this path on a cold cache.
      console.warn("Student delta sync failed; serving cached snapshot", error?.message || error);
      state = { data: state.data, checkedAt: now, gen: state.gen ?? mem.gen ?? 0 };
      mem = state;
      return mem.data;
    }
  }

  mem = state;
  await writeShared(state);
  return state.data;
}

export async function getActiveStudents(env) {
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
  const now = Date.now();

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

  // Keep a warm school list in step with a write from this same PoP, so the
  // follow-up refresh after registering or editing a student stays immediate.
  for (const [school, cached] of schoolMem) {
    if (now - cached.checkedAt >= SCHOOL_CACHE_TTL_MS) continue;
    const data = cached.data.filter((student) => student.studentId !== s.studentId);
    if (doc.active !== false && s.tingkatan === 1 && s.formerPrimarySchool === school) data.push(s);
    sortStudents(data);
    const state = { data, checkedAt: now, gen: cached.gen };
    schoolMem.set(school, state);
    try {
      const cacheKey = new Request(`https://sperk-cache.internal/students-school-v1/${encodeURIComponent(school)}`);
      await caches.default.put(cacheKey, Response.json(state, {
        headers: { "Cache-Control": `max-age=${Math.ceil(SCHOOL_CACHE_TTL_MS / 1000)}` },
      }));
    } catch {
      /* Perubahan tetap disimpan pada cache memori. */
    }
  }
}

// Lupus cache (import/muatan pukal): bacaan penuh semula dilakukan pada
// permintaan seterusnya.
export async function invalidateStudentsCache() {
  const shared = await readShared();
  const gen = Math.max(shared?.gen ?? 0, mem.gen ?? 0) + 1;
  mem = { data: null, checkedAt: 0, gen };
  await writeShared({ data: null, checkedAt: 0, gen });
}

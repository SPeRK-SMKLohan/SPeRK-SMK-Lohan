import { SCHOOL_LOOKUP } from "./schools.js";
import { batchGet, commit, getDoc, runQuery } from "../../firestore.js";
import {
  getActiveStudents, invalidateStudentsCache, mergeStudentIntoCache, publicStudent, studentFromDoc,
} from "../../shared/students.js";
import { HttpError, ID_RE, DAY_MS, clampInt, myDateKey, myDayStart, readJson } from "../../util.js";

/* ---------- e-Daftar: medan murid, pengesahan dan simpan/kemas kini ---------- */
const TINGKATAN_ONLY = 1;

const YES_WORDS = ["ya", "y", "true", "1"];
const NO_WORDS = ["tidak", "tak", "t", "false", "0", "bukan", "tiada"];

// true = Ya, false = Tidak, null = kosong, undefined = tidak dikenali.
function parseYesNo(raw, extraYes = [], extraNo = []) {
  if (raw === true) return true;
  if (raw === false) return false;
  const s = typeof raw === "string" ? raw.toLowerCase().replace(/[^a-z0-9]/g, "") : String(raw ?? "");
  if (!s) return null;
  if ([...YES_WORDS, ...extraYes].includes(s)) return true;
  if ([...NO_WORDS, ...extraNo].includes(s)) return false;
  return undefined;
}

// Sistem pendaftaran sekolah ini menerima Tingkatan 1 sahaja.
function parseTingkatan(raw) {
  if (raw === null || raw === undefined || raw === "") return TINGKATAN_ONLY;
  const m = String(raw).match(/\d+/);
  if (!m) return undefined;
  const t = Number(m[0]);
  return t === TINGKATAN_ONLY ? t : undefined;
}

// Kosong bermakna guru belum menanda -> "BELUM".
function parseRegistrationStatus(raw) {
  const v = parseYesNo(raw, ["sudah", "sudahdaftar", "hadir", "daftar"], ["belum", "belumdaftar"]);
  if (v === undefined) return undefined;
  return v === true ? "SUDAH" : "BELUM";
}

// Bersihkan teks: ruang berlebihan dibuang, panjang dihadkan (dikesan pemanggil).
const cleanText = (v, max) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max + 1) : "";

// Mengesahkan satu set medan e-Daftar (borang guru atau baris import).
// Mengembalikan { reason } jika tidak sah, atau { digits, student }.
export function readStudentFields(src) {
  const name = cleanText(src.name, 100);
  if (name.length < 2) return { reason: "Nama kosong atau terlalu pendek." };
  if (name.length > 100) return { reason: "Nama terlalu panjang (maksimum 100 aksara)." };

  const icRaw = cleanText(src.icNumber, 30);
  if (!icRaw) return { reason: "No. IC kosong." };
  if (!/^[\d\s-]+$/.test(icRaw)) return { reason: "No. IC hanya boleh mengandungi digit dan tanda sempang." };
  const digits = icRaw.replace(/\D/g, "");
  if (digits.length !== 12) return { reason: "No. IC mesti 12 digit." };
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));
  // Bilangan hari maksimum setiap bulan (Februari dibenarkan 29 kerana tahun IC tidak lengkap).
  const maxDay = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  if (month < 1 || day < 1 || day > maxDay) {
    return { reason: "No. IC tidak sah (tarikh lahir tidak betul)." };
  }

  const schoolRaw = cleanText(src.school, 100);
  if (!schoolRaw) return { reason: "Sekolah rendah asal kosong." };
  const school = SCHOOL_LOOKUP.get(schoolRaw.toLowerCase());
  if (!school) return { reason: "Sekolah rendah asal tiada dalam senarai." };

  const tingkatan = parseTingkatan(src.tingkatan);
  if (tingkatan === undefined) return { reason: "Sistem ini hanya menerima murid Tingkatan 1." };

  const oku = parseYesNo(src.oku);
  if (oku === undefined) return { reason: "Status OKU tidak dikenali (guna Ya atau Tidak)." };

  const registrationStatus = parseRegistrationStatus(src.registrationStatus);
  if (registrationStatus === undefined) {
    return { reason: "Status daftar tidak dikenali (guna Sudah daftar atau Belum daftar)." };
  }

  const transferSchool = cleanText(src.transferSchool, 100);
  if (transferSchool.length > 100) return { reason: "Nama sekolah dipohon terlalu panjang (maksimum 100 aksara)." };
  const transferReason = cleanText(src.transferReason, 200);
  if (transferReason.length > 200) return { reason: "Sebab penempatan semula terlalu panjang (maksimum 200 aksara)." };
  const transferNotes = cleanText(src.transferNotes, 300);
  if (transferNotes.length > 300) return { reason: "Catatan terlalu panjang (maksimum 300 aksara)." };

  return {
    digits,
    student: {
      name,
      icNumber: `${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`,
      formerPrimarySchool: school,
      tingkatan,
      oku,
      registrationStatus,
      transferSchool: transferSchool || null,
      transferReason: transferReason || null,
      transferNotes: transferNotes || null,
    },
  };
}

// Badan permintaan daripada borang guru (nama medan sama seperti dokumen Firestore).
function studentSource(body) {
  return {
    name: body?.name,
    icNumber: body?.icNumber,
    school: body?.formerPrimarySchool,
    tingkatan: body?.tingkatan,
    oku: body?.oku,
    registrationStatus: body?.registrationStatus,
    transferSchool: body?.transferSchool,
    transferReason: body?.transferReason,
    transferNotes: body?.transferNotes,
  };
}

/* ---------- Senarai murid: paginasi atas cache penuh ---------- */

// Baris setiap halaman: hadkan payload kepada ~50 baris (300-400 murid → 6-8
// halaman), bukan semua data setiap permintaan. Saringan nama/IC berjalan ke
// atas senarai penuh yang sudah dicache supaya carian tepat — tiada indeks
// Firestore tambahan diperlukan (hanya active == true, indeks medan tunggal).
const PAGE_DEFAULT = 50;
const PAGE_MAX = 200;
const OFFSET_MAX = 100_000;

export async function listStudents(env, url) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100).toLowerCase();
  const school = url.searchParams.get("school") || "";
  const tingkatan = url.searchParams.get("tingkatan") || "";
  const status = url.searchParams.get("status") || "";
  const limit = clampInt(url.searchParams.get("limit"), 1, PAGE_MAX, PAGE_DEFAULT);
  const offset = clampInt(url.searchParams.get("offset"), 0, OFFSET_MAX, 0);

  // Carian berbilang perkataan: setiap perkataan mesti ada dalam nama, manakala
  // kumpulan digit dipadankan dengan No. IC (contoh: "ahmad 140512").
  const tokens = q.split(/\s+/).filter(Boolean);
  const words = tokens.filter((t) => !/^\d+$/.test(t));
  const digits = tokens.filter((t) => /^\d+$/.test(t)).join("");

  const all = (await getActiveStudents(env)).filter((s) => s.tingkatan === TINGKATAN_ONLY);
  const matched = all.filter((s) => {
    if (school && s.formerPrimarySchool !== school) return false;
    if (tingkatan && String(s.tingkatan ?? "") !== tingkatan) return false;
    if (status && s.registrationStatus !== status) return false;
    if (!words.every((w) => s.name.toLowerCase().includes(w))) return false;
    if (digits.length >= 2 && !String(s.icNumber).replace(/\D/g, "").includes(digits)) return false;
    return true;
  });
  // Hari pendaftaran disusun mengikut sekolah rendah supaya guru boleh
  // mengurus satu kumpulan sekolah pada satu masa.
  matched.sort((a, b) =>
    a.formerPrimarySchool.localeCompare(b.formerPrimarySchool, "ms") || a.name.localeCompare(b.name, "ms")
  );

  // Ringkasan status daftar bagi keseluruhan senarai aktif (bukan hanya yang
  // ditapis) — digunakan oleh penunjuk angka pada halaman e-Daftar.
  const registered = all.filter((s) => s.registrationStatus === "SUDAH").length;

  // Kemajuan hari pendaftaran: murid yang ditandakan hari ini (masa Malaysia).
  const startMs = myDayStart(myDateKey()).getTime();
  const endMs = startMs + DAY_MS;
  const registeredToday = all.filter((s) => {
    if (s.registrationStatus !== "SUDAH" || !s.registeredAt) return false;
    const t = new Date(s.registeredAt).getTime();
    return t >= startMs && t < endMs;
  }).length;

  const schoolStudents = school ? all.filter((s) => s.formerPrimarySchool === school) : [];
  const schoolRegistered = schoolStudents.filter((s) => s.registrationStatus === "SUDAH").length;

  return {
    total: matched.length,
    registeredTotal: registered,
    notRegisteredTotal: all.length - registered,
    registeredTodayCount: registeredToday,
    schoolTotal: schoolStudents.length,
    schoolRegisteredTotal: schoolRegistered,
    schoolNotRegisteredTotal: schoolStudents.length - schoolRegistered,
    students: matched.slice(offset, offset + limit).map(publicStudent),
    offset,
    hasMore: offset + limit < matched.length,
  };
}

// Jejak kehadiran untuk kemajuan hari pendaftaran: diisi apabila status
// bertukar kepada SUDAH, dikosongkan apabila dikembalikan kepada BELUM.
// Jika status kekal SUDAH, masa pendaftaran asal dikekalkan.
function registrationTrace(oldStatus, newStatus, user, now) {
  if (newStatus !== "SUDAH") return { registeredAt: null, registeredBy: null };
  if (oldStatus === "SUDAH") return {};
  return { registeredAt: now, registeredBy: user?.email ?? "" };
}

// Mencari murid lain yang mempunyai digit IC sama (untuk mengelak pendua).
async function findStudentByIC(env, digits, exceptId = null) {
  // Pertanyaan tepat pada No. IC yang dinormalkan (1 bacaan sahaja, bukan
  // imbasan penuh koleksi).
  try {
    const docs = await runQuery(env, {
      from: [{ collectionId: "students" }],
      where: fieldFilter("icNumber", "EQUAL", toValue(`${digits.slice(0, 6)}-${digits.slice(6, 8)}-${digits.slice(8)}`)),
      select: { fields: [{ fieldPath: "icNumber" }] },
    });
    const hit = docs.find((d) => d.id !== exceptId);
    if (hit) return hit.studentId ?? hit.id;
  } catch {
    /* Teruskan ke imbasan senarai cache jika pertanyaan gagal. */
  }

  // Sandaran: imbas senarai cache (tanpa bacaan tambahan) untuk kes format lama.
  try {
    const all = await getActiveStudents(env);
    const hit = all.find((s) => s.studentId !== exceptId && String(s.icNumber).replace(/\D/g, "") === digits);
    if (hit) return hit.studentId;
  } catch {
    /* Abaikan; pendua tidak dapat disahkan. */
  }
  return null;
}

export async function getStudent(env, id) {
  if (!ID_RE.test(id)) throw new HttpError(404, "Murid tidak dijumpai.");
  const doc = await getDoc(env, "students", id);
  if (!doc || doc.tingkatan !== TINGKATAN_ONLY) throw new HttpError(404, "Murid Tingkatan 1 tidak dijumpai.");
  return { student: studentFromDoc(doc) };
}

export async function createStudent(env, user, request) {
  const parsed = readStudentFields(studentSource(await readJson(request)));
  if (parsed.reason) throw new HttpError(400, parsed.reason);
  if (await findStudentByIC(env, parsed.digits)) {
    throw new HttpError(409, "Murid dengan No. IC ini sudah wujud.");
  }

  const now = new Date();
  const id = crypto.randomUUID(); // ID rawak: nombor IC tidak muncul dalam ID atau URL
  const data = {
    ...parsed.student,
    active: true,
    createdAt: now,
    updatedAt: now,
    ...registrationTrace(null, parsed.student.registrationStatus, user, now),
  };
  await commit(env, [{ collection: "students", id, data }]);
  await mergeStudentIntoCache({ id, ...data });
  return { student: publicStudent(studentFromDoc({ id, ...data })) };
}

export async function updateStudent(env, user, id, request) {
  if (!ID_RE.test(id)) throw new HttpError(404, "Murid tidak dijumpai.");
  const existing = await getDoc(env, "students", id);
  if (!existing || existing.tingkatan !== TINGKATAN_ONLY) throw new HttpError(404, "Murid Tingkatan 1 tidak dijumpai.");

  const parsed = readStudentFields(studentSource(await readJson(request)));
  if (parsed.reason) throw new HttpError(400, parsed.reason);
  if (await findStudentByIC(env, parsed.digits, id)) {
    throw new HttpError(409, "Murid dengan No. IC ini sudah wujud.");
  }

  // Hanya medan yang dihantar yang ditulis (updateMask), jadi createdAt dan
  // active tidak terjejas.
  const now = new Date();
  const data = {
    ...parsed.student,
    updatedAt: now,
    ...registrationTrace(existing.registrationStatus, parsed.student.registrationStatus, user, now),
  };
  await commit(env, [{ collection: "students", id, data, mask: true }]);
  await mergeStudentIntoCache({ id, ...existing, ...data });
  return { student: publicStudent(studentFromDoc({ id, ...existing, ...data })) };
}

// Tanda kehadiran pantas (satu ketukan) semasa hari pendaftaran. Hanya medan
// status daftar dan jejaknya diubah; medan lain tidak disentuh.
export async function setRegistrationStatus(env, user, id, request) {
  if (!ID_RE.test(id)) throw new HttpError(404, "Murid tidak dijumpai.");
  const body = await readJson(request);

  const status = parseRegistrationStatus(body?.registrationStatus);
  if (status === undefined) {
    throw new HttpError(400, "Status daftar tidak dikenali (guna SUDAH atau BELUM).");
  }

  const existing = await getDoc(env, "students", id);
  if (!existing || existing.tingkatan !== TINGKATAN_ONLY) throw new HttpError(404, "Murid Tingkatan 1 tidak dijumpai.");

  const now = new Date();
  const data = {
    registrationStatus: status,
    updatedAt: now,
    ...registrationTrace(existing.registrationStatus, status, user, now),
  };
  await commit(env, [{ collection: "students", id, data, mask: true }]);
  await mergeStudentIntoCache({ id, ...existing, ...data });
  return { student: publicStudent(studentFromDoc({ ...existing, ...data })) };
}

// Padam kekal: dokumen murid dibuang daripada Firestore. Resit lama masih
// memaparkan nama murid (snapshot), tetapi pautan "murid sama" tidak berfungsi
// lagi. No. IC yang sama boleh diimport semula kemudian (pendua tidak dikesan).
export async function deleteStudent(env, user, id) {
  if (!ID_RE.test(id)) throw new HttpError(404, "Murid tidak dijumpai.");
  const existing = await getDoc(env, "students", id);
  if (!existing || existing.tingkatan !== TINGKATAN_ONLY) throw new HttpError(404, "Murid Tingkatan 1 tidak dijumpai.");
  await commit(env, [{ collection: "students", id, delete: true }]);
  await invalidateStudentsCache();
  return { deleted: true, studentId: id };
}

// Padam banyak murid sekaligus. Semua ID disahkan sebelum pemadaman.
// Resit lama masih memaparkan nama murid (snapshot); No. IC yang sama boleh
// diimport semula kemudian.
export async function deleteStudents(env, user, ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new HttpError(400, "Sila pilih sekurang-kurangnya satu murid.");
  }
  if (ids.length > 200) {
    throw new HttpError(400, "Maksimum 200 murid boleh dipadam sekaligus.");
  }
  for (const id of ids) {
    if (!ID_RE.test(id)) throw new HttpError(400, "ID murid tidak sah.");
  }

  // Pastikan semua murid wujud sebelum dipadam (satu panggilan batchGet).
  const found = await batchGet(env, ids.map((id) => ({ collection: "students", id })));
  const missing = ids.filter((id) => {
    const student = found.get(`students/${id}`);
    return !student || student.tingkatan !== TINGKATAN_ONLY;
  });
  if (missing.length) {
    throw new HttpError(404, `Beberapa murid tidak dijumpai (${missing.length} rekod).`);
  }

  const now = new Date();
  const writes = ids.map((id) => ({ collection: "students", id, delete: true }));

  // Semua pemadaman dalam satu commit atomik (Firestore hadkan 500 tulisan; 200 di bawah had).
  await commit(env, writes);
  await invalidateStudentsCache();

  return { deleted: ids.length, studentIds: ids };
}

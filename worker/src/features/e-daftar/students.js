import { SCHOOL_LOOKUP } from "./schools.js";
import { commit, getDoc, runQuery } from "../../firestore.js";
import {
  clearStudentsCache, getActiveStudents, publicStudent, studentFromDoc,
} from "../../shared/students.js";
import { HttpError, ID_RE, clampInt, readJson } from "../../util.js";

/* ---------- e-Daftar: medan murid, pengesahan dan simpan/kemas kini ---------- */
const TINGKATAN_MAX = 5;

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

// "1", "Tingkatan 2", "T2" -> 1..5. Kosong -> null, tidak dikenali -> undefined.
function parseTingkatan(raw) {
  if (raw === null || raw === undefined || raw === "") return null;
  const m = String(raw).match(/\d+/);
  if (!m) return undefined;
  const t = Number(m[0]);
  return t >= 1 && t <= TINGKATAN_MAX ? t : undefined;
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
  if (tingkatan === undefined) return { reason: `Tingkatan mesti antara 1 dan ${TINGKATAN_MAX}.` };

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

export async function listStudents(env, url) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100).toLowerCase();
  const school = url.searchParams.get("school") || "";
  const tingkatan = url.searchParams.get("tingkatan") || "";
  const status = url.searchParams.get("status") || "";
  const limit = clampInt(url.searchParams.get("limit"), 1, 200, 50);
  const digits = q.replace(/\D/g, "");

  const all = await getActiveStudents(env);
  const matched = all.filter(
    (s) =>
      (!school || s.formerPrimarySchool === school) &&
      (!tingkatan || String(s.tingkatan ?? "") === tingkatan) &&
      (!status || s.registrationStatus === status) &&
      (!q ||
        s.name.toLowerCase().includes(q) ||
        (digits.length >= 2 && String(s.icNumber).replace(/\D/g, "").includes(digits)))
  );

  // Ringkasan status daftar bagi keseluruhan senarai aktif (bukan hanya yang
  // ditapis) — digunakan oleh penunjuk angka pada halaman e-Daftar.
  const registered = all.filter((s) => s.registrationStatus === "SUDAH").length;

  return {
    total: matched.length,
    registeredTotal: registered,
    notRegisteredTotal: all.length - registered,
    students: matched.slice(0, limit).map(publicStudent),
  };
}

// Mencari murid lain yang mempunyai digit IC sama (untuk mengelak pendua).
async function findStudentByIC(env, digits, exceptId = null) {
  const docs = await runQuery(env, {
    from: [{ collectionId: "students" }],
    select: { fields: [{ fieldPath: "icNumber" }] },
  });
  const hit = docs.find(
    (d) => d.id !== exceptId && String(d.icNumber ?? "").replace(/\D/g, "") === digits
  );
  return hit ? hit.studentId ?? hit.id : null;
}

export async function getStudent(env, id) {
  if (!ID_RE.test(id)) throw new HttpError(404, "Murid tidak dijumpai.");
  const doc = await getDoc(env, "students", id);
  if (!doc) throw new HttpError(404, "Murid tidak dijumpai.");
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
  await commit(env, [
    {
      collection: "students",
      id,
      data: { ...parsed.student, active: true, createdAt: now, updatedAt: now },
    },
  ]);
  clearStudentsCache();
  return { student: publicStudent(studentFromDoc({ id, ...parsed.student })) };
}

export async function updateStudent(env, user, id, request) {
  if (!ID_RE.test(id)) throw new HttpError(404, "Murid tidak dijumpai.");
  const existing = await getDoc(env, "students", id);
  if (!existing) throw new HttpError(404, "Murid tidak dijumpai.");

  const parsed = readStudentFields(studentSource(await readJson(request)));
  if (parsed.reason) throw new HttpError(400, parsed.reason);
  if (await findStudentByIC(env, parsed.digits, id)) {
    throw new HttpError(409, "Murid dengan No. IC ini sudah wujud.");
  }

  // Hanya medan yang dihantar yang ditulis (updateMask), jadi createdAt dan
  // active tidak terjejas.
  await commit(env, [
    { collection: "students", id, data: { ...parsed.student, updatedAt: new Date() }, mask: true },
  ]);
  clearStudentsCache();
  return { student: publicStudent(studentFromDoc({ id, ...parsed.student })) };
}

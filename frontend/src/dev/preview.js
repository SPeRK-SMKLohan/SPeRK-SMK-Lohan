/* DEVELOPMENT ONLY — fixture harness.

   The staff screens sit behind Firebase Auth, and this audit environment has no
   authorised test account. To render, measure and screenshot them without
   touching production data, this module fakes the signed-in user and serves
   synthetic records from memory.

   It is loaded through a dynamic import guarded by `import.meta.env.DEV`, so it
   is removed entirely from a production build. It never runs unless the URL
   carries `?preview=...`. No real student data is used anywhere. */

import { auth } from "../shared/firebase.js";

const SCHOOLS = [
  "SK Bongkud", "SK Kirokot", "SK Langsat", "SK Lohan", "SK Nalapak",
  "SK Napong", "SK Narawang", "SK Perancangan", "SK Poring", "SK Sagiban",
];

const NAMES = [
  "AARON JOSEPH LINSING", "ADELINE JASMIN JULIUS", "AHMAD SYAFIQ BIN ROSLI",
  "AINA SOFEA BINTI HAKIM", "ALVIN CHONG WEI MING", "AMIRA BALQIS BINTI ZAINAL",
  "ANDREW LIM KAH SENG", "ANGELINE GRACE PETER", "ARIF DANIAL BIN MUSA",
  "BEATRICE ANNE JOSEPH", "BRYAN LEE JUN HAO", "CAROLINE MAJINDA",
  "CHRISTINA DEWI ANAK JAMES", "DANIEL ISKANDAR BIN AZIZ", "DAYANG NUR AISYAH",
  "DELVIN RAYMOND GIMPA", "DIANA SUZANNA BINTI OMAR", "ELIJAH MARK SINTANG",
  "EMILY TAN XIN YI", "ERIN NATASHA BINTI YUSOF", "FARAH NABILA BINTI ADNAN",
  "FELIX GABRIEL JOSEPH", "FIONA CHIN MEI LING", "HAFIZ IKHWAN BIN SULAIMAN",
  "HANNAH GRACE MICHAEL", "HARITH AIMAN BIN KAMAL", "IRENE JOSEPHINE LOUIS",
  "ISAAC NATHANIEL JAMES", "JACINTHA MAUREEN ANTHONY", "JASON TEO KAI WEN",
  "JENNYFER ANAK RAYMOND", "JONATHAN ALBERT SIEW", "JULIANA BINTI MUSTAFA",
  "KAVITHA A/P RAMESH", "KEVIN LAU ZHEN YANG", "LARISSA ANAK MARTIN",
  "LEONARD CHIN WEI JIE", "LIYANA SOFEA BINTI HASSAN", "MARCUS DANIEL GIMPA",
  "MEGAN TAN LI WEN",
];

const ITEMS = [
  { itemId: "item-buku", name: "Buku Latihan Koperasi (set)", priceSen: 1200, active: true, fixedQuantity: 1, sortOrder: 1, koperasiMembership: false },
  { itemId: "item-lencana", name: "Lencana Sekolah", priceSen: 500, active: true, fixedQuantity: 1, sortOrder: 2, koperasiMembership: false },
  { itemId: "item-tali", name: "Tali Leher", priceSen: 800, active: true, fixedQuantity: 1, sortOrder: 3, koperasiMembership: false },
  { itemId: "item-keahlian", name: "Keahlian Koperasi", priceSen: 2000, active: true, fixedQuantity: 1, sortOrder: 4, koperasiMembership: true },
  { itemId: "item-baju", name: "Baju Sukan Sekolah", priceSen: 3500, active: true, fixedQuantity: null, sortOrder: 5, koperasiMembership: false },
  { itemId: "item-alat", name: "Alat Tulis (pakej)", priceSen: 650, active: true, fixedQuantity: null, sortOrder: 6, koperasiMembership: false },
  { itemId: "item-topi", name: "Topi Sekolah", priceSen: 1500, active: false, fixedQuantity: null, sortOrder: 7, koperasiMembership: false },
];

const maskIC = (ic) => String(ic).replace(/\d(?=.*\d{4}$)/g, "*");
const pad = (n) => String(n).padStart(2, "0");

function makeStudents() {
  const now = new Date();
  return NAMES.map((name, i) => {
    const school = SCHOOLS[i % 5];
    const registered = i % 3 !== 0;
    const day = pad((i % 28) + 1);
    return {
      studentId: `stu-${String(i + 1).padStart(3, "0")}`,
      name,
      icNumber: `1205${day}-12-${String(1000 + i)}`,
      formerPrimarySchool: school,
      motherPhone: "",
      fatherPhone: "",
      tingkatan: 1,
      oku: i % 11 === 0,
      registrationStatus: registered ? "SUDAH" : "BELUM",
      registeredAt: registered
        ? new Date(now.getTime() - (i % 5) * 36e5).toISOString()
        : null,
      registeredBy: registered ? "GURU@SEKOLAH.EDU.MY" : "",
      transferSchool: i % 13 === 0 ? "SMK Ranau" : "",
      transferReason: i % 13 === 0 ? "Sekolah lebih dekat" : "",
      transferNotes: i % 13 === 0 ? "Keluarga berpindah ke kawasan berhampiran." : "",
      koperasiMember: i % 4 === 0,
    };
  });
}

function makeReceipts(students) {
  const methods = ["CASH", "BANK_TRANSFER"];
  return students.slice(0, 8).map((s, i) => {
    const day = pad((i % 7) + 1);
    const items = [
      { itemId: "item-buku", itemNameSnapshot: "Buku Latihan Koperasi (set)", quantity: 1, unitPriceSen: 1200, subtotalSen: 1200 },
      { itemId: "item-lencana", itemNameSnapshot: "Lencana Sekolah", quantity: 1, unitPriceSen: 500, subtotalSen: 500 },
    ];
    return {
      receiptId: `rcp-${String(i + 1).padStart(3, "0")}`,
      receiptNo: `2026-${String(i + 1).padStart(6, "0")}`,
      createdAt: `2026-10-${day}T02:${pad(10 + i)}:00.000Z`,
      studentId: s.studentId,
      studentNameSnapshot: s.name,
      formerPrimarySchoolSnapshot: s.formerPrimarySchool,
      items,
      totalSen: 1700,
      paymentMethod: methods[i % 2],
      staffName: "CIKGU AHMAD",
      bankRef: i % 2 ? "MBB2026100100123" : null,
      status: "ISSUED",
      year: 2026,
    };
  });
}

const publicStudent = (s) => ({
  studentId: s.studentId,
  name: s.name,
  icMasked: maskIC(s.icNumber),
  formerPrimarySchool: s.formerPrimarySchool,
  tingkatan: s.tingkatan,
  oku: s.oku,
  registrationStatus: s.registrationStatus,
  motherPhone: s.motherPhone || "",
  fatherPhone: s.fatherPhone || "",
  registeredAt: s.registeredAt,
  registeredBy: s.registeredBy,
  transferSchool: s.transferSchool,
  transferReason: s.transferReason,
  transferNotes: s.transferNotes,
});

const receiptSummary = (r) => ({
  receiptId: r.receiptId,
  receiptNo: r.receiptNo,
  createdAt: r.createdAt,
  studentNameSnapshot: r.studentNameSnapshot,
  totalSen: r.totalSen,
  paymentMethod: r.paymentMethod,
  staffName: r.staffName,
  status: r.status,
});

export function installPreview() {
  const mode = new URLSearchParams(location.search).get("preview") || "data";

  const fakeUser = {
    uid: "preview-user",
    email: "guru@sekolah.edu.my",
    getIdToken: async () => "preview-token",
  };
  try {
    Object.defineProperty(auth, "currentUser", { get: () => fakeUser, configurable: true });
  } catch (err) {
    console.warn("preview: cannot override currentUser", err);
  }

  const empty = mode === "empty";
  let students = empty ? [] : makeStudents();
  let receipts = empty ? [] : makeReceipts(students);
  let counter = 0;

  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    });

  const fail = () =>
    json({ error: "Sambungan ujian gagal. Ini keadaan ralat yang disengajakan." }, 503);

  function listStudents(url) {
    const q = (url.searchParams.get("q") || "").trim().toLowerCase();
    const school = url.searchParams.get("school") || "";
    const status = url.searchParams.get("status") || "";
    const limit = Number(url.searchParams.get("limit") || 50);
    const offset = Number(url.searchParams.get("offset") || 0);

    const tokens = q.split(/\s+/).filter(Boolean);
    const words = tokens.filter((t) => !/^\d+$/.test(t));
    const digits = tokens.filter((t) => /^\d+$/.test(t)).join("");

    const matched = students.filter((s) => {
      if (school && s.formerPrimarySchool !== school) return false;
      if (status && s.registrationStatus !== status) return false;
      if (!words.every((w) => s.name.toLowerCase().includes(w))) return false;
      if (digits.length >= 2 && !s.icNumber.replace(/\D/g, "").includes(digits)) return false;
      return true;
    });

    matched.sort((a, b) =>
      a.formerPrimarySchool.localeCompare(b.formerPrimarySchool, "ms") ||
      a.name.localeCompare(b.name, "ms"));

    const schoolStudents = school ? students.filter((s) => s.formerPrimarySchool === school) : [];
    const schoolRegistered = schoolStudents.filter((s) => s.registrationStatus === "SUDAH").length;
    const registered = students.filter((s) => s.registrationStatus === "SUDAH").length;

    return {
      total: matched.length,
      registeredTotal: registered,
      notRegisteredTotal: students.length - registered,
      registeredTodayCount: students.filter((s) => s.registrationStatus === "SUDAH").length,
      schoolTotal: schoolStudents.length,
      schoolRegisteredTotal: schoolRegistered,
      schoolNotRegisteredTotal: schoolStudents.length - schoolRegistered,
      students: matched.slice(offset, offset + limit).map(publicStudent),
      offset,
      hasMore: offset + limit < matched.length,
    };
  }

  function dashboard() {
    const registered = students.filter((s) => s.registrationStatus === "SUDAH").length;
    const registrationBySchool = SCHOOLS.slice().sort((a, b) => a.localeCompare(b, "ms")).map((school) => {
      const group = students.filter((s) => s.formerPrimarySchool === school);
      const done = group.filter((s) => s.registrationStatus === "SUDAH").length;
      return { school, registered: done, notRegistered: group.length - done, total: group.length };
    });
    const today = new Date().toISOString().slice(0, 10);
    return {
      activeStudents: students.length,
      registeredStudents: registered,
      notRegisteredStudents: students.length - registered,
      registrationBySchool,
      registeredTodayCount: students.filter(
        (s) => s.registrationStatus === "SUDAH" && String(s.registeredAt || "").startsWith(today)
      ).length,
      koperasiStudents: students.filter((s) => s.koperasiMember).length,
      todayCount: receipts.length,
      todayTotalSen: receipts.reduce((t, r) => t + r.totalSen, 0),
      recent: receipts.slice(0, 5).map(receiptSummary),
    };
  }

  const realFetch = window.fetch.bind(window);

  window.fetch = async (input, init = {}) => {
    const raw = typeof input === "string" ? input : input.url;
    const url = new URL(raw, location.origin);
    if (!url.pathname.startsWith("/api/")) return realFetch(input, init);

    await new Promise((r) => setTimeout(r, 180)); // exercise loading states

    if (mode === "error") return fail();

    const method = (init.method || "GET").toUpperCase();
    const path = url.pathname;

    if (path === "/api/me") return json({ uid: fakeUser.uid, email: fakeUser.email });
    if (path === "/api/dashboard") return json(dashboard());
    if (path === "/api/items") return json({ items: ITEMS });

    if (path === "/api/students" && method === "GET") return json(listStudents(url));

    if (path === "/api/students" && method === "POST") {
      const body = JSON.parse(init.body || "{}");
      const id = `stu-new-${++counter}`;
      const created = {
        studentId: id,
        name: String(body.name || "").toUpperCase(),
        icNumber: String(body.icNumber || ""),
        formerPrimarySchool: body.formerPrimarySchool || SCHOOLS[0],
        motherPhone: body.motherPhone || "",
        fatherPhone: body.fatherPhone || "",
        tingkatan: 1,
        oku: Boolean(body.oku),
        registrationStatus: body.registrationStatus || "BELUM",
        registeredAt: null,
        registeredBy: "",
        transferSchool: body.transferSchool || "",
        transferReason: body.transferReason || "",
        transferNotes: body.transferNotes || "",
        koperasiMember: false,
      };
      students.push(created);
      return json({ student: publicStudent(created) }, 201);
    }

    const statusMatch = path.match(/^\/api\/students\/([^/]+)\/status$/);
    if (statusMatch && method === "POST") {
      const s = students.find((x) => x.studentId === decodeURIComponent(statusMatch[1]));
      if (!s) return json({ error: "Murid tidak dijumpai." }, 404);
      const body = JSON.parse(init.body || "{}");
      s.registrationStatus = body.registrationStatus;
      s.motherPhone = body.motherPhone || "";
      s.fatherPhone = body.fatherPhone || "";
      s.registeredAt = body.registrationStatus === "SUDAH" ? new Date().toISOString() : null;
      s.registeredBy = body.registrationStatus === "SUDAH" ? fakeUser.email : "";
      return json({ student: publicStudent(s) });
    }

    if (path === "/api/students/bulk" && method === "DELETE") {
      const body = JSON.parse(init.body || "{}");
      const ids = new Set(body.ids || []);
      students = students.filter((s) => !ids.has(s.studentId));
      return json({ deleted: ids.size, studentIds: [...ids] });
    }

    if (path === "/api/students/import" && method === "POST") {
      const body = JSON.parse(init.body || "{}");
      const rows = body.rows || [];
      return json({
        dryRun: Boolean(body.dryRun),
        summary: {
          total: rows.length,
          valid: Math.max(0, rows.length - 2),
          invalid: Math.min(2, rows.length),
          duplicateInFile: 0,
          duplicateExisting: 0,
        },
        problems: rows.slice(0, 2).map((r, i) => ({
          row: r.row || i + 2,
          status: "invalid",
          reason: "No. IC mesti 12 digit.",
        })),
        imported: body.dryRun ? 0 : Math.max(0, rows.length - 2),
      });
    }

    const oneStudent = path.match(/^\/api\/students\/([^/]+)$/);
    if (oneStudent) {
      const id = decodeURIComponent(oneStudent[1]);
      const s = students.find((x) => x.studentId === id);
      if (!s) return json({ error: "Murid tidak dijumpai." }, 404);
      if (method === "GET") return json({ student: s });
      if (method === "PUT") {
        Object.assign(s, JSON.parse(init.body || "{}"), { name: String(JSON.parse(init.body || "{}").name || s.name).toUpperCase() });
        return json({ student: publicStudent(s) });
      }
      if (method === "DELETE") {
        students = students.filter((x) => x.studentId !== id);
        return json({ deleted: true, studentId: id });
      }
    }

    if (path === "/api/receipts" && method === "GET") {
      const q = (url.searchParams.get("q") || "").toLowerCase();
      const list = q
        ? receipts.filter((r) =>
            r.receiptNo.toLowerCase().includes(q) || r.studentNameSnapshot.toLowerCase().includes(q))
        : receipts;
      return json({ receipts: list.map(receiptSummary), truncated: false });
    }

    if (path === "/api/receipts" && method === "POST") {
      const body = JSON.parse(init.body || "{}");
      const student = students.find((s) => s.studentId === body.studentId);
      const items = (body.lines || []).map((l) => {
        const item = ITEMS.find((i) => i.itemId === l.itemId);
        return {
          itemId: l.itemId,
          itemNameSnapshot: item.name,
          quantity: l.quantity,
          unitPriceSen: item.priceSen,
          subtotalSen: item.quantity * item.priceSen,
        };
      });
      const receipt = {
        receiptId: `rcp-new-${++counter}`,
        receiptNo: `2026-${String(900 + counter).padStart(6, "0")}`,
        createdAt: new Date().toISOString(),
        studentId: body.studentId,
        studentNameSnapshot: student?.name || "MURID UJIAN",
        formerPrimarySchoolSnapshot: student?.formerPrimarySchool || "",
        items,
        totalSen: items.reduce((t, i) => t + i.subtotalSen, 0),
        paymentMethod: body.paymentMethod,
        staffName: body.staffName,
        bankRef: body.bankRef || null,
        status: "ISSUED",
        year: 2026,
      };
      receipts = [receipt, ...receipts];
      return json({ receipt, duplicate: false }, 201);
    }

    const oneReceipt = path.match(/^\/api\/receipts\/([^/]+)$/);
    if (oneReceipt && method === "GET") {
      const r = receipts.find((x) => x.receiptId === decodeURIComponent(oneReceipt[1]));
      if (!r) return json({ error: "Resit tidak dijumpai." }, 404);
      return json({ receipt: r });
    }

    return json({ error: "Not found" }, 404);
  };

  console.info(`[preview] fixture mode: ${mode}. No production data is used.`);
}

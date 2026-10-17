import { batchGet, beginTransaction, commit, getDoc, runQuery, toValue } from "./firestore.js";
import { SEED_ITEMS, SEED_STUDENTS } from "./seed-data.js";
import {
  HttpError, ID_RE, UUID_RE, clampInt, maskIC,
  myDateKey, myDayStart, myYear, parseDateKey,
} from "./util.js";

const PAYMENT_METHODS = ["QR", "BANK_TRANSFER", "CASH"];
const DAY_MS = 86400000;

const fieldFilter = (field, op, value) => ({
  fieldFilter: { field: { fieldPath: field }, op, value },
});

/* ---------- Cache senarai murid (mengurangkan bacaan Firestore) ---------- */
let studentsCache = { at: 0, data: null };
const STUDENTS_TTL_MS = 60_000;

export function clearStudentsCache() {
  studentsCache = { at: 0, data: null };
}

async function getActiveStudents(env) {
  if (studentsCache.data && Date.now() - studentsCache.at < STUDENTS_TTL_MS) return studentsCache.data;
  const docs = await runQuery(env, {
    from: [{ collectionId: "students" }],
    where: fieldFilter("active", "EQUAL", toValue(true)),
  });
  const data = docs
    .map((d) => ({
      studentId: d.id,
      name: d.name,
      icNumber: d.icNumber,
      formerPrimarySchool: d.formerPrimarySchool,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
  studentsCache = { at: Date.now(), data };
  return data;
}

/* ---------- Murid ---------- */
export async function listStudents(env, url) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100).toLowerCase();
  const school = url.searchParams.get("school") || "";
  const limit = clampInt(url.searchParams.get("limit"), 1, 200, 50);
  const digits = q.replace(/\D/g, "");

  const all = await getActiveStudents(env);
  const matched = all.filter(
    (s) =>
      (!school || s.formerPrimarySchool === school) &&
      (!q ||
        s.name.toLowerCase().includes(q) ||
        (digits.length >= 2 && String(s.icNumber).replace(/\D/g, "").includes(digits)))
  );

  return {
    total: matched.length,
    // No. IC penuh tidak dihantar ke pelayar; hanya versi separa.
    students: matched.slice(0, limit).map((s) => ({
      studentId: s.studentId,
      name: s.name,
      icMasked: maskIC(s.icNumber),
      formerPrimarySchool: s.formerPrimarySchool,
    })),
  };
}

/* ---------- Barangan ---------- */
export async function listItems(env) {
  const docs = await runQuery(env, { from: [{ collectionId: "items" }] });
  const items = docs
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((d) => ({
      itemId: d.id,
      name: d.name,
      priceSen: d.priceSen,
      active: d.active === true,
      sizes: d.sizes ?? null,
    }));
  return { items };
}

/* ---------- Resit ---------- */
function summary(d) {
  return {
    receiptId: d.id,
    receiptNo: d.receiptNo,
    createdAt: d.createdAt,
    studentNameSnapshot: d.studentNameSnapshot,
    totalSen: d.totalSen,
    paymentMethod: d.paymentMethod,
    status: d.status,
  };
}

function publicReceipt(d) {
  return {
    ...summary(d),
    year: d.year,
    studentId: d.studentId,
    formerPrimarySchoolSnapshot: d.formerPrimarySchoolSnapshot,
    items: d.items,
  };
}

function validateBody(body) {
  if (!body || typeof body !== "object") throw new HttpError(400, "Permintaan tidak sah.");
  const { requestId, studentId, paymentMethod, lines } = body;

  if (typeof requestId !== "string" || !UUID_RE.test(requestId)) throw new HttpError(400, "ID permintaan tidak sah.");
  if (typeof studentId !== "string" || !ID_RE.test(studentId)) throw new HttpError(400, "Murid tidak sah.");
  if (!PAYMENT_METHODS.includes(paymentMethod)) throw new HttpError(400, "Kaedah pembayaran tidak sah.");
  if (!Array.isArray(lines) || lines.length < 1 || lines.length > 30) {
    throw new HttpError(400, "Sila pilih sekurang-kurangnya satu item.");
  }

  const seen = new Set();
  const cleanLines = lines.map((l) => {
    if (!l || typeof l.itemId !== "string" || !ID_RE.test(l.itemId)) throw new HttpError(400, "Item tidak sah.");
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 99) {
      throw new HttpError(400, "Kuantiti mesti antara 1 dan 99.");
    }
    if (l.size !== undefined && (typeof l.size !== "string" || l.size.length > 10)) {
      throw new HttpError(400, "Saiz tidak sah.");
    }
    const key = `${l.itemId}|${l.size ?? ""}`;
    if (seen.has(key)) throw new HttpError(400, "Item pendua dalam resit.");
    seen.add(key);
    return { itemId: l.itemId, quantity: l.quantity, size: l.size };
  });

  return { requestId, studentId, paymentMethod, lines: cleaned(cleanLines) };
}
const cleaned = (x) => x;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createReceipt(env, user, request) {
  const text = await request.text();
  if (text.length > 20_000) throw new HttpError(413, "Permintaan terlalu besar.");
  let body;
  try { body = JSON.parse(text); } catch { throw new HttpError(400, "Permintaan tidak sah."); }
  const { requestId, studentId, paymentMethod, lines } = validateBody(body);

  // Permintaan ulangan: pulangkan resit yang sama, jangan cipta yang baharu.
  const already = await getDoc(env, "receipts", requestId);
  if (already) return { receipt: publicReceipt(already), duplicate: true };

  // Ambil murid dan item sebenar daripada pangkalan data (satu panggilan).
  const itemIds = [...new Set(lines.map((l) => l.itemId))];
  const found = await batchGet(env, [
    { collection: "students", id: studentId },
    ...itemIds.map((id) => ({ collection: "items", id })),
  ]);

  const student = found.get(`students/${studentId}`);
  if (!student || student.active !== true) throw new HttpError(400, "Murid tidak sah.");

  // Harga diambil daripada pangkalan data. Harga daripada pelayar tidak digunakan.
  const receiptItems = lines.map((l) => {
    const item = found.get(`items/${l.itemId}`);
    if (!item || item.active !== true) throw new HttpError(400, "Item tidak sah.");

    if (Array.isArray(item.sizes) && item.sizes.length) {
      if (!item.sizes.includes(l.size)) throw new HttpError(400, `Sila pilih saiz untuk ${item.name}.`);
    } else if (l.size) {
      throw new HttpError(400, `${item.name} tidak mempunyai pilihan saiz.`);
    }

    return {
      itemId: l.itemId,
      itemNameSnapshot: item.name,
      quantity: l.quantity,
      unitPriceSen: item.priceSen,
      subtotalSen: l.quantity * item.priceSen,
      size: l.size || undefined,
    };
  });
  const totalSen = receiptItems.reduce((sum, i) => sum + i.subtotalSen, 0);

  const now = new Date();
  const year = myYear(now);
  const counterId = `receipts-${year}`;

  // Nombor resit dan penyimpanan dalam satu transaksi atomik.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const tx = await beginTransaction(env);

      const again = await getDoc(env, "receipts", requestId, tx);
      if (again) return { receipt: publicReceipt(again), duplicate: true };

      const counter = await getDoc(env, "counters", counterId, tx);
      const next = (counter?.value ?? 0) + 1;

      const receipt = {
        receiptNo: `${year}-${String(next).padStart(6, "0")}`,
        year,
        studentId,
        studentNameSnapshot: student.name,
        formerPrimarySchoolSnapshot: student.formerPrimarySchool,
        items: receiptItems,
        totalSen,
        paymentMethod,
        status: "ISSUED",
        createdAt: now,
        createdByAccountId: user.sub,
        requestId,
      };

      await commit(
        env,
        [
          { collection: "counters", id: counterId, data: { value: next, year, updatedAt: now } },
          { collection: "receipts", id: requestId, data: receipt, mustNotExist: true },
        ],
        tx
      );

      return {
        receipt: publicReceipt({ id: requestId, ...receipt, createdAt: now.toISOString() }),
        duplicate: false,
      };
    } catch (err) {
      const retryable = err.code === "ABORTED" || err.code === "ALREADY_EXISTS";
      if (!retryable || attempt === 4) throw err;
      await sleep(100 * (attempt + 1) + Math.random() * 100);
    }
  }
  throw new HttpError(503, "Pelayan sibuk. Sila cuba lagi.");
}

export async function getReceipt(env, id) {
  if (!UUID_RE.test(id)) throw new HttpError(404, "Resit tidak dijumpai.");
  const doc = await getDoc(env, "receipts", id);
  if (!doc) throw new HttpError(404, "Resit tidak dijumpai.");
  return { receipt: publicReceipt(doc) };
}

export async function listReceipts(env, url) {
  const q = (url.searchParams.get("q") || "").trim().slice(0, 100).toLowerCase();
  const from = parseDateKey(url.searchParams.get("from"));
  const to = parseDateKey(url.searchParams.get("to"));
  const limit = clampInt(url.searchParams.get("limit"), 1, 200, 100);

  const filters = [];
  if (from) filters.push(fieldFilter("createdAt", "GREATER_THAN_OR_EQUAL", toValue(myDayStart(from))));
  if (to) filters.push(fieldFilter("createdAt", "LESS_THAN", toValue(new Date(myDayStart(to).getTime() + DAY_MS))));

  const cap = q ? 500 : limit + 1;
  const query = {
    from: [{ collectionId: "receipts" }],
    orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
    limit: cap,
  };
  if (filters.length === 1) query.where = filters[0];
  else if (filters.length > 1) query.where = { compositeFilter: { op: "AND", filters } };

  const docs = await runQuery(env, query);
  const list = q
    ? docs.filter(
        (d) => d.receiptNo.toLowerCase().includes(q) || d.studentNameSnapshot.toLowerCase().includes(q)
      )
    : docs;

  return {
    receipts: list.slice(0, limit).map(summary),
    truncated: list.length > limit || (!!q && docs.length === cap),
  };
}

/* ---------- Dashboard ---------- */
export async function getDashboard(env) {
  const start = myDayStart(myDateKey());
  const end = new Date(start.getTime() + DAY_MS);

  const [students, activeItems, todayDocs, recentDocs] = await Promise.all([
    getActiveStudents(env),
    runQuery(env, {
      from: [{ collectionId: "items" }],
      where: fieldFilter("active", "EQUAL", toValue(true)),
      select: { fields: [{ fieldPath: "name" }] },
    }),
    runQuery(env, {
      from: [{ collectionId: "receipts" }],
      where: {
        compositeFilter: {
          op: "AND",
          filters: [
            fieldFilter("createdAt", "GREATER_THAN_OR_EQUAL", toValue(start)),
            fieldFilter("createdAt", "LESS_THAN", toValue(end)),
          ],
        },
      },
      select: { fields: [{ fieldPath: "totalSen" }, { fieldPath: "status" }] },
    }),
    runQuery(env, {
      from: [{ collectionId: "receipts" }],
      orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      limit: 5,
    }),
  ]);

  const issuedToday = todayDocs.filter((d) => d.status === "ISSUED");
  return {
    activeStudents: students.length,
    activeItems: activeItems.length,
    todayCount: issuedToday.length,
    todayTotalSen: issuedToday.reduce((sum, d) => sum + (d.totalSen || 0), 0),
    recent: recentDocs.map(summary),
  };
}

/* ---------- Seed data rekaan (hanya jika ENABLE_SEED=true) ---------- */
export async function seedDevData(env) {
  const now = new Date();
  const writes = [
    ...SEED_STUDENTS.map(({ studentId, ...rest }) => ({
      collection: "students",
      id: studentId,
      data: { ...rest, createdAt: now, updatedAt: now },
    })),
    ...SEED_ITEMS.map(({ itemId, ...rest }) => ({
      collection: "items",
      id: itemId,
      data: { ...rest, createdAt: now, updatedAt: now },
    })),
  ];
  await commit(env, writes);
  clearStudentsCache();
  return { students: SEED_STUDENTS.length, items: SEED_ITEMS.length };
}
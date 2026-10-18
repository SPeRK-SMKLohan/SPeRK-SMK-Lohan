import {
  batchGet, beginTransaction, commit, fieldFilter, getDoc, runQuery, toValue,
} from "../../firestore.js";
import {
  DAY_MS, HttpError, ID_RE, UUID_RE, clampInt, myDayStart, myYear, parseDateKey, readJson,
} from "../../util.js";

/* ---------- e-Resit Koperasi: jana, senarai dan butiran resit ---------- */
const PAYMENT_METHODS = ["BANK_TRANSFER", "CASH"];

export function receiptSummary(d) {
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
    ...receiptSummary(d),
    year: d.year,
    studentId: d.studentId,
    formerPrimarySchoolSnapshot: d.formerPrimarySchoolSnapshot,
    bankRef: d.bankRef ?? null,
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

  // Pindahan bank WAJIB ada no. rujukan. Tunai tidak menyimpan rujukan.
  let bankRef;
  if (paymentMethod === "BANK_TRANSFER") {
    if (typeof body.bankRef !== "string") throw new HttpError(400, "No. rujukan diperlukan untuk pindahan bank.");
    bankRef = body.bankRef.replace(/\s+/g, " ").trim();
    if (bankRef.length < 2 || bankRef.length > 60) throw new HttpError(400, "No. rujukan tidak sah.");
  }

  const seen = new Set();
  const cleanLines = lines.map((l) => {
    if (!l || typeof l.itemId !== "string" || !ID_RE.test(l.itemId)) throw new HttpError(400, "Item tidak sah.");
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 99) {
      throw new HttpError(400, "Kuantiti mesti antara 1 dan 99.");
    }
    if (seen.has(l.itemId)) throw new HttpError(400, "Item pendua dalam resit.");
    seen.add(l.itemId);
    return { itemId: l.itemId, quantity: l.quantity };
  });

  return { requestId, studentId, paymentMethod, bankRef, lines: cleanLines };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createReceipt(env, user, request) {
  const body = await readJson(request);
  const { requestId, studentId, paymentMethod, bankRef, lines } = validateBody(body);

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
  const receiptItems = lines
    .map((l) => {
      const item = found.get(`items/${l.itemId}`);
      if (!item || item.active !== true) throw new HttpError(400, "Item tidak sah.");

      // Kuantiti item tertentu dikunci (contoh: Lencana/Tanda Nama, Keahlian Koperasi).
      if (item.fixedQuantity != null && l.quantity !== item.fixedQuantity) {
        throw new HttpError(400, `Kuantiti ${item.name} mesti ${item.fixedQuantity}.`);
      }

      const unitPriceSen = item.priceSen;

      return {
        sortOrder: item.sortOrder ?? 999,
        line: {
          itemId: l.itemId,
          itemNameSnapshot: item.name,
          quantity: l.quantity,
          unitPriceSen,
          subtotalSen: l.quantity * unitPriceSen,
        },
      };
    })
    // Susunan item pada resit mengikut senarai harga rasmi sekolah, walaupun
    // pengguna menambah item tidak mengikut turutan.
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((entry) => entry.line);
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
        bankRef: bankRef || undefined,
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
    receipts: list.slice(0, limit).map(receiptSummary),
    truncated: list.length > limit || (!!q && docs.length === cap),
  };
}

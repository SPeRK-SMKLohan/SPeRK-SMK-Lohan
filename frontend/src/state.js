import { students, items, paymentMethods } from "./data/mock-data.js";
import { normalizeIC } from "./utils/dom.js";

/* ---------- Pangkalan data PALSU (diganti dengan Firestore) ---------- */
const RECEIPTS_KEY = "mock_receipts";

function loadReceipts() {
  try { return JSON.parse(localStorage.getItem(RECEIPTS_KEY)) ?? []; } catch { return []; }
}
function saveReceipts() {
  try { localStorage.setItem(RECEIPTS_KEY, JSON.stringify(db.receipts)); } catch { /* abaikan */ }
}

export const db = {
  students: structuredClone(students),
  items: structuredClone(items),
  receipts: loadReceipts(),
};

export function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function searchStudents(query, { school = "", limit = Infinity } = {}) {
  const q = query.trim().toLowerCase();
  const digits = normalizeIC(query);
  return db.students
    .filter((s) => s.active)
    .filter((s) => !school || s.formerPrimarySchool === school)
    .filter((s) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      (digits.length >= 2 && normalizeIC(s.icNumber).includes(digits))
    )
    .slice(0, limit);
}

export function getReceipt(id) {
  return db.receipts.find((r) => r.receiptId === id);
}

/*
 * Ini meniru logik backend (akan dipindahkan ke Cloudflare Worker pada Fasa 4):
 * - hanya menerima ID dan kuantiti, BUKAN harga
 * - mengambil harga sah dan mengira semula jumlah
 * - menyimpan snapshot nama dan harga item
 * - requestId yang sama tidak mencipta resit kedua
 */
export function createReceiptMock({ requestId, studentId, lines, paymentMethod }) {
  const existing = db.receipts.find((r) => r.requestId === requestId);
  if (existing) return existing;

  const student = db.students.find((s) => s.studentId === studentId && s.active);
  if (!student) throw new Error("Murid tidak sah.");
  if (!paymentMethods.some((p) => p.value === paymentMethod)) throw new Error("Kaedah pembayaran tidak sah.");
  if (!Array.isArray(lines) || lines.length === 0) throw new Error("Sila pilih sekurang-kurangnya satu item.");

  const receiptItems = lines.map((l) => {
    const item = db.items.find((i) => i.itemId === l.itemId && i.active);
    if (!item) throw new Error("Item tidak sah.");
    if (!Number.isInteger(l.quantity) || l.quantity < 1 || l.quantity > 99) {
      throw new Error(`Kuantiti tidak sah untuk ${item.name}.`);
    }
    if (item.sizes && !item.sizes.includes(l.size)) {
      throw new Error(`Sila pilih saiz untuk ${item.name}.`);
    }
    return {
      itemId: item.itemId,
      itemNameSnapshot: item.name,
      quantity: l.quantity,
      unitPriceSen: item.priceSen,
      subtotalSen: l.quantity * item.priceSen,
      size: item.sizes ? l.size : undefined,
    };
  });

  const totalSen = receiptItems.reduce((sum, i) => sum + i.subtotalSen, 0);
  const year = new Date().getFullYear();
  const seq = db.receipts.filter((r) => r.year === year).length + 1;

  const receipt = {
    receiptId: makeId(),
    receiptNo: `${year}-${String(seq).padStart(6, "0")}`,
    year,
    studentId: student.studentId,
    studentNameSnapshot: student.name,
    items: receiptItems,
    totalSen,
    paymentMethod,
    status: "ISSUED",
    createdAt: new Date().toISOString(),
    createdByAccountId: "akaun-koperasi",
    requestId,
  };

  db.receipts.push(receipt);
  saveReceipts();
  return receipt;
}
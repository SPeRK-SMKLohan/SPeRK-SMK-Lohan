import { commit } from "./firestore.js";
import { SEED_ITEMS, SEED_STUDENTS } from "./seed-data.js";
import { clearStudentsCache } from "./shared/students.js";

/* ---------- Data rekaan (hanya jika ENABLE_SEED=true) ---------- */
// Item daripada senarai lama yang dibuang apabila seed dijalankan semula.
const LEGACY_ITEM_IDS = ["i9"];

export async function seedDevData(env, { itemsOnly = false } = {}) {
  const now = new Date();
  const seedIds = new Set(SEED_ITEMS.map((i) => i.itemId));
  const writes = [
    ...(itemsOnly
      ? []
      : SEED_STUDENTS.map(({ studentId, ...rest }) => ({
          collection: "students",
          id: studentId,
          data: {
            ...rest,
            // Jejak kehadiran untuk data demo: yang sudah daftar ditandakan hari ini.
            registeredAt: rest.registrationStatus === "SUDAH" ? now : null,
            registeredBy: rest.registrationStatus === "SUDAH" ? "demo@sperk" : null,
            createdAt: now,
            updatedAt: now,
          },
        }))),
    ...SEED_ITEMS.map(({ itemId, ...rest }) => ({
      collection: "items",
      id: itemId,
      data: { ...rest, createdAt: now, updatedAt: now },
    })),
    ...LEGACY_ITEM_IDS.filter((id) => !seedIds.has(id)).map((id) => ({
      collection: "items",
      id,
      delete: true,
    })),
  ];
  await commit(env, writes);
  if (!itemsOnly) clearStudentsCache();
  return { students: itemsOnly ? 0 : SEED_STUDENTS.length, items: SEED_ITEMS.length };
}

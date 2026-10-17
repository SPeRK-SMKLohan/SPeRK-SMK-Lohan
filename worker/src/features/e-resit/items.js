import { runQuery } from "../../firestore.js";

/* ---------- e-Resit Koperasi: senarai barangan ---------- */

export async function listItems(env) {
  const docs = await runQuery(env, { from: [{ collectionId: "items" }] });
  const items = docs
    .sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999))
    .map((d) => ({
      itemId: d.id,
      name: d.name,
      priceSen: d.priceSen,
      active: d.active === true,
      // Jika ditetapkan, kuantiti item ini dikunci (contoh: 1).
      fixedQuantity: d.fixedQuantity ?? null,
    }));
  return { items };
}

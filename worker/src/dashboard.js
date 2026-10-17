import { fieldFilter, runQuery, toValue } from "./firestore.js";
import { receiptSummary } from "./features/e-resit/receipts.js";
import { getActiveStudents } from "./shared/students.js";
import { DAY_MS, myDateKey, myDayStart } from "./util.js";

/* ---------- Papan Pemuka: statistik kedua-dua ciri ---------- */

export async function getDashboard(env) {
  const start = myDayStart(myDateKey());
  const end = new Date(start.getTime() + DAY_MS);

  const [students, activeItems, todayDocs, recentDocs, allReceipts] = await Promise.all([
    getActiveStudents(env),
    runQuery(env, {
      from: [{ collectionId: "items" }],
      where: fieldFilter("active", "EQUAL", toValue(true)),
      select: { fields: [{ fieldPath: "name" }, { fieldPath: "koperasiMembership" }] },
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
    runQuery(env, {
      from: [{ collectionId: "receipts" }],
      where: fieldFilter("status", "EQUAL", toValue("ISSUED")),
      select: { fields: [{ fieldPath: "studentId" }, { fieldPath: "items" }] },
    }),
  ]);

  const issuedToday = todayDocs.filter((d) => d.status === "ISSUED");

  // Keahlian koperasi: murid yang mempunyai resit berstatus ISSUED yang
  // mengandungi item bertanda koperasiMembership (Keahlian Koperasi).
  const koperasiItemIds = new Set(activeItems.filter((d) => d.koperasiMembership === true).map((d) => d.id));
  const members = new Set();
  for (const r of allReceipts) {
    if (!r.studentId || members.has(r.studentId)) continue;
    if ((r.items || []).some((it) => koperasiItemIds.has(it.itemId))) members.add(r.studentId);
  }

  const registered = students.filter((s) => s.registrationStatus === "SUDAH").length;

  return {
    activeStudents: students.length,
    registeredStudents: registered,
    notRegisteredStudents: students.length - registered,
    koperasiStudents: members.size,
    activeItems: activeItems.length,
    todayCount: issuedToday.length,
    todayTotalSen: issuedToday.reduce((sum, d) => sum + (d.totalSen || 0), 0),
    recent: recentDocs.map(receiptSummary),
  };
}

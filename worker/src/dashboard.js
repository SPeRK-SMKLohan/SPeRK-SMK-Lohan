import { fieldFilter, runQuery, toValue } from "./firestore.js";
import { receiptSummary } from "./features/e-resit/receipts.js";
import { getActiveStudents } from "./shared/students.js";
import { DAY_MS, myDateKey, myDayStart } from "./util.js";

/* ---------- Papan Pemuka: statistik kedua-dua ciri ---------- */

// Cache 30 saat (dikenal dari 15 saat) untuk mengurangkan beban Firestore
// apabila ramai peranti membuka papan pemuka secara serentak. Cache API
// dikongsi antara isolate dalam PoP yang sama.
const DASHBOARD_TTL_MS = 30_000;
const DASHBOARD_CACHE_KEY = "https://sperk-cache.internal/dashboard";
const dashboardCacheRequest = () => new Request(DASHBOARD_CACHE_KEY);
let dashboardCache = { at: 0, data: null };
let dashboardPending = null;

export async function getDashboard(env) {
  if (dashboardCache.data && Date.now() - dashboardCache.at < DASHBOARD_TTL_MS) {
    return dashboardCache.data;
  }
  if (dashboardPending) return dashboardPending;

  dashboardPending = (async () => {
    try {
      try {
        const hit = await caches.default.match(dashboardCacheRequest());
        if (hit) {
          const data = await hit.json();
          dashboardCache = { at: Date.now(), data };
          return data;
        }
      } catch {
        /* Teruskan kiraan jika Cache API gagal. */
      }

      const data = await computeDashboard(env);
      dashboardCache = { at: Date.now(), data };
      try {
        await caches.default.put(
          dashboardCacheRequest(),
          Response.json(data, { headers: { "Cache-Control": "max-age=30" } })
        );
      } catch {
        /* Simpanan cache gagal: data tetap dikembalikan. */
      }
      return data;
    } finally {
      dashboardPending = null;
    }
  })();
  return dashboardPending;
}

async function computeDashboard(env) {
  const start = myDayStart(myDateKey());
  const end = new Date(start.getTime() + DAY_MS);

  // Parallel: profil murid (cache), item aktif, resit hari ini, resit terkini,
  // resit ISSUED (untuk kiraan ahli koperasi — dikongsi oleh cache 30 saat).
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
      limit: 500, // >500 resit sehari tidak dijangka; hadkan bacaan
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

  // Keahlian koperasi: murid dengan resit ISSUED yang mengandungi item
  // bertanda koperasiMembership (hanya medan terpilih dihantar — payload kecil).
  const koperasiItemIds = new Set(activeItems.filter((d) => d.koperasiMembership === true).map((d) => d.id));
  const members = new Set();
  for (const r of allReceipts) {
    if (!r.studentId || members.has(r.studentId)) continue;
    if ((r.items || []).some((it) => koperasiItemIds.has(it.itemId))) members.add(r.studentId);
  }

  const registered = students.filter((s) => s.registrationStatus === "SUDAH").length;

  // Kemajuan hari pendaftaran: murid yang ditandakan hadir hari ini (masa Malaysia).
  const startMs = start.getTime();
  const endMs = startMs + DAY_MS;
  const registeredTodayCount = students.filter((s) => {
    if (s.registrationStatus !== "SUDAH" || !s.registeredAt) return false;
    const t = new Date(s.registeredAt).getTime();
    return t >= startMs && t < endMs;
  }).length;

  return {
    activeStudents: students.length,
    registeredStudents: registered,
    notRegisteredStudents: students.length - registered,
    registeredTodayCount,
    koperasiStudents: members.size,
    activeItems: activeItems.length,
    todayCount: issuedToday.length,
    todayTotalSen: issuedToday.reduce((sum, d) => sum + (d.totalSen || 0), 0),
    recent: recentDocs.map(receiptSummary),
  };
}

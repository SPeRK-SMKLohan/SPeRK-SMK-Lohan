import { fieldFilter, getDoc, runQuery, toValue } from "./firestore.js";
import { receiptSummary } from "./features/e-resit/receipts.js";
import { getActiveStudents } from "./shared/students.js";
import { DAY_MS, myDateKey, myDayStart } from "./util.js";

/* ---------- Papan Pemuka: statistik kedua-dua ciri ---------- */

// Cache pendek (30 saat) supaya ramai peranti yang membuka papan pemuka pada
// masa yang sama tidak mencetuskan bacaan Firestore berulang. Cache API
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
  const dateKey = myDateKey();
  const start = myDayStart(dateKey);
  const end = new Date(start.getTime() + DAY_MS);

  // Profil murid (cache delta) + item aktif + kaunter resit hari ini (1 bacaan)
  // + resit terkini. Ahli koperasi disimpan sebagai medan murid (koperasiMember),
  // jadi tiada lagi imbasan penuh koleksi resit.
  const [students, activeItems, dailyCounter, recentDocs] = await Promise.all([
    getActiveStudents(env),
    runQuery(env, {
      from: [{ collectionId: "items" }],
      where: fieldFilter("active", "EQUAL", toValue(true)),
      select: { fields: [{ fieldPath: "name" }] },
    }),
    getDoc(env, "counters", `daily-${dateKey}`),
    runQuery(env, {
      from: [{ collectionId: "receipts" }],
      orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      limit: 5,
    }),
  ]);

  const registered = students.filter((s) => s.registrationStatus === "SUDAH").length;
  const koperasiStudents = students.filter((s) => s.koperasiMember === true).length;

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
    koperasiStudents,
    activeItems: activeItems.length,
    todayCount: dailyCounter?.count ?? 0,
    todayTotalSen: dailyCounter?.totalSen ?? 0,
    recent: recentDocs.map(receiptSummary),
  };
}

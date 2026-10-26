import { getDoc, runQuery } from "./firestore.js";
import { receiptSummary } from "./features/e-resit/receipts.js";
import { getActiveStudents } from "./shared/students.js";
import { SCHOOLS } from "./features/e-daftar/schools.js";
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

  // Profil murid (cache delta) + kaunter resit hari ini + resit terkini.
  // Ahli koperasi disimpan sebagai medan murid (koperasiMember),
  // jadi tiada lagi imbasan penuh koleksi resit. Bilangan item tidak dipaparkan
  // pada papan pemuka, jadi jangan tambah satu lagi bacaan Firestore untuknya.
  const [students, dailyCounter, recentDocs] = await Promise.all([
    getActiveStudents(env),
    getDoc(env, "counters", `daily-${dateKey}`),
    runQuery(env, {
      from: [{ collectionId: "receipts" }],
      orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }],
      limit: 5,
    }),
  ]);

  const tingkatanOne = students.filter((s) => s.tingkatan === 1);
  const registered = tingkatanOne.filter((s) => s.registrationStatus === "SUDAH").length;
  const registrationBySchool = SCHOOLS
    .slice()
    .sort((a, b) => a.localeCompare(b, "ms"))
    .map((school) => {
      const schoolStudents = tingkatanOne.filter((s) => s.formerPrimarySchool === school);
      const schoolRegistered = schoolStudents.filter((s) => s.registrationStatus === "SUDAH").length;
      return {
        school,
        registered: schoolRegistered,
        notRegistered: schoolStudents.length - schoolRegistered,
        total: schoolStudents.length,
      };
    });
  const koperasiStudents = tingkatanOne.filter((s) => s.koperasiMember === true).length;

  // Kemajuan hari pendaftaran: murid yang ditandakan hadir hari ini (masa Malaysia).
  const startMs = start.getTime();
  const endMs = startMs + DAY_MS;
  const registeredTodayCount = tingkatanOne.filter((s) => {
    if (s.registrationStatus !== "SUDAH" || !s.registeredAt) return false;
    const t = new Date(s.registeredAt).getTime();
    return t >= startMs && t < endMs;
  }).length;

  return {
    activeStudents: tingkatanOne.length,
    registeredStudents: registered,
    notRegisteredStudents: tingkatanOne.length - registered,
    registrationBySchool,
    registeredTodayCount,
    koperasiStudents,
    todayCount: dailyCounter?.count ?? 0,
    todayTotalSen: dailyCounter?.totalSen ?? 0,
    recent: recentDocs.map(receiptSummary),
  };
}

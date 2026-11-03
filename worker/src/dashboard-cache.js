// Dashboard snapshots are shared within a Worker isolate and, where available,
// through the Cache API. Receipt writes invalidate both copies so the next
// dashboard read reflects the committed counters immediately.
export const DASHBOARD_CACHE_KEY = "https://sperk-cache.internal/dashboard-v3";
export const dashboardCacheRequest = () => new Request(DASHBOARD_CACHE_KEY);

export let dashboardCache = { at: 0, data: null };
export let dashboardPending = null;
let dashboardRevision = 0;

export function getDashboardRevision() {
  return dashboardRevision;
}

export function setDashboardCache(data, revision = dashboardRevision) {
  if (revision !== dashboardRevision) return;
  dashboardCache = { at: Date.now(), data };
}

export function setDashboardPending(pending) {
  dashboardPending = pending;
}

export function clearDashboardPending(pending) {
  if (dashboardPending === pending) dashboardPending = null;
}

export async function invalidateDashboardCache() {
  dashboardRevision++;
  dashboardCache = { at: 0, data: null };
  dashboardPending = null;
  try {
    await caches.default.delete(dashboardCacheRequest());
  } catch {
    // The in-isolate snapshot is still cleared if Cache API is unavailable.
  }
}

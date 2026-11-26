import { getDashboard } from "../shared/api.js";
import { schools } from "../features/e-daftar/constants.js";
import { esc, formatTime, formatCount } from "../shared/dom.js";
import { formatRM } from "../shared/money.js";
import { staffName } from "../shared/staff.js";
import { loadingState, readErrorState, wireReadRetry } from "../shared/feedback.js";

/* Home summary uses the existing dashboard response and local cache. */

const DASHBOARD_STORAGE_KEY = "sperk-dashboard-summary-v1";
function readDashboardCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY) || "null");
    return cached && Array.isArray(cached.registrationBySchool) ? cached : null;
  } catch {
    return null;
  }
}

const percent = (part, whole) => (whole > 0 ? Math.round((part / whole) * 100) : 0);

/* The greeting uses the name typed at sign-in. Without it the screen would
   start with a placeholder ("Guru"), which reads like a broken field. */
function greeting() {
  const name = staffName();
  return name ? `Selamat datang, ${esc(name)}` : "Selamat datang ke SPeRK";
}

function schoolRows(d) {
  const all = schools.slice()
    .sort((a, b) => a.localeCompare(b, "ms"))
    .map((school) => {
      const row = d.registrationBySchool.find((item) => item.school === school);
      return {
        school,
        total: row?.total ?? 0,
        registered: row?.registered ?? 0,
        notRegistered: row?.notRegistered ?? 0,
        receipts: row?.receipts ?? 0,
      };
    });

  // Schools that sent nobody are counted, not listed. Eight empty rows push the
  // five that matter off the screen without telling a teacher anything.
  const listed = all.filter((row) => row.total > 0)
    .sort((a, b) => b.notRegistered - a.notRegistered || a.school.localeCompare(b.school, "ms"));
  const rows = listed.map((row) => {
    const pct = percent(row.registered, row.total);
    return `<li class="school-progress-row">
      <span class="school-progress-main">
        <span class="school-progress-heading">
          <span class="school-name">${esc(row.school)}</span>
          <span class="school-progress-count num">${formatCount(row.registered)} / ${formatCount(row.total)}</span>
        </span>
        <span class="school-progress-track" role="progressbar" aria-label="Kemajuan ${esc(row.school)}" aria-valuemin="0" aria-valuemax="${row.total}" aria-valuenow="${row.registered}"><span style="width:${pct}%"></span></span>
        <span class="school-progress-meta">
          <span class="school-remaining${row.notRegistered === 0 ? " is-complete" : ""}">${formatCount(row.notRegistered)} belum daftar</span>
        </span>
      </span>
    </li>`;
  });

  return { rows: rows.join(""), empty: all.length - listed.length, counted: listed.length };
}

/* Today's counter sales, as tiles. A vertical list only works inside a narrow
   column; across the full width the time and the amount drift a screen apart,
   so each receipt becomes its own small tile and the row fills instead of
   stretching. */
function recentFeed(recent = []) {
  if (!recent.length) {
    return `<p class="feed-empty">Belum ada resit hari ini.</p>`;
  }
  return `<ul class="feed">
    ${recent.map((r) => `
      <li><a href="#/resit/${encodeURIComponent(r.receiptId)}"
             title="${esc([r.studentNameSnapshot, r.receiptNo].filter(Boolean).join(" · "))}">
        <span class="feed-body">
          <span class="feed-name">${esc(r.studentNameSnapshot)}</span>
          <span class="feed-meta">
            ${esc(formatTime(r.createdAt))}
            <span class="feed-amount num">${formatRM(r.totalSen)}</span>
          </span>
        </span>
      </a></li>`).join("")}
  </ul>`;
}

function renderDashboard(main, d) {
  const total = d.activeStudents ?? 0;
  const registered = d.registeredStudents ?? 0;
  const notRegistered = d.notRegisteredStudents ?? 0;
  const todayCount = d.todayCount ?? 0;
  const todayTotalSen = d.todayTotalSen ?? 0;
  const done = percent(registered, total);
  const receiptTotal = d.registrationBySchool.reduce((sum, row) => sum + (row.receipts || 0), 0);
  const table = schoolRows(d);
  const schoolSummary = receiptTotal > 0
    ? `${formatCount(table.counted)} sekolah · ${formatCount(receiptTotal)} resit setakat ini`
    : `${formatCount(table.counted)} sekolah`;
  const todaySummary = todayCount > 0
    ? `${formatCount(todayCount)} resit hari ini · ${formatRM(todayTotalSen)}`
    : `Jualan hari ini · ${formatRM(todayTotalSen)}`;

  // A note about the schools that sent nobody only makes sense once at least
  // one school has sent somebody; the empty table already says the rest.
  const emptyNote = table.empty > 0 && table.counted > 0
    ? `<p class="table-note">${formatCount(table.empty)} sekolah rendah belum menghantar senarai murid.</p>`
    : "";

  // Keep the all-time receipt count beside the list instead of repeating a
  // totals row beneath every school.
  main.innerHTML = `
    <section class="home-metrics" aria-label="Ringkasan hari ini">
      <a class="metric-card" href="#/pendaftaran">
        <span class="metric-label">Murid sudah daftar</span>
        <strong class="metric-value num">${formatCount(registered)}<span> / ${formatCount(total)}</span></strong>
        <span class="metric-foot">${done}% daripada jumlah murid</span>
      </a>
      <a class="metric-card" href="#/pendaftaran">
        <span class="metric-label">Belum daftar</span>
        <strong class="metric-value num">${formatCount(notRegistered)}</strong>
        <span class="metric-foot">Murid Tingkatan 1</span>
      </a>
    </section>
    <div class="home-panels">
    <section class="card">
      <div class="card-head">
        <div>
          <h2>Kemajuan pendaftaran</h2>
          <p class="card-sub">${schoolSummary}</p>
        </div>
        <a class="link-more" href="#/pendaftaran">Buka pendaftaran</a>
      </div>
      <ul class="school-progress-list" aria-label="Kemajuan mengikut sekolah">
        ${table.rows || `<li class="feed-empty">Belum ada murid Tingkatan 1 dalam sistem.</li>`}
      </ul>
      ${emptyNote}
    </section>

    <section class="card">
      <div class="card-head">
        <div>
          <h2>Resit terkini</h2>
          <p class="card-sub">${todaySummary}</p>
        </div>
        <a class="link-more" href="#/laporan-koperasi">Semua resit</a>
      </div>
      ${recentFeed(d.recent)}
    </section>
    </div>`;
}

export async function renderHome(root) {
  root.innerHTML = `
    <section class="hero home-welcome">
      <div class="hero-copy">
        <h1>${greeting()}</h1>
        <div class="hero-actions">
          <a class="btn primary" href="#/pendaftaran">Daftar murid</a>
          <a class="btn secondary" href="#/jana-resit">Jana resit</a>
        </div>
      </div>
    </section>

    <div id="home-data" class="home-data">${loadingState("Memuatkan ringkasan…")}</div>`;

  const main = root.querySelector("#home-data");
  let cached = readDashboardCache();
  if (cached) renderDashboard(main, cached);

  let d;
  try {
    d = await getDashboard();
    if (!Array.isArray(d.registrationBySchool)) {
      throw new Error("Ringkasan dashboard tidak lengkap.");
    }
    try { localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(d)); } catch { /* Cache peranti pilihan sahaja. */ }
  } catch (err) {
    if (cached) {
      main.insertAdjacentHTML("afterbegin", '<p class="muted tiny" role="status">Menunjukkan ringkasan terakhir; data terkini belum dapat disegerakkan.</p>');
      return;
    }
    main.innerHTML = readErrorState(err, "Ringkasan utama");
    wireReadRetry(main, () => renderHome(root));
    return;
  }
  renderDashboard(main, d);
}

import { apiFetch } from "../shared/api.js";
import { schools } from "../features/e-daftar/constants.js";
import { esc } from "../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../shared/feedback.js";

/* Home.
   Opens with the two things staff actually come here to do, then shows the
   state of registration day. Numbers support the tasks; they do not lead. */

const getDashboard = () => apiFetch("/api/dashboard");
const DASHBOARD_STORAGE_KEY = "sperk-dashboard-summary-v1";

function readDashboardCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(DASHBOARD_STORAGE_KEY) || "null");
    return cached && Array.isArray(cached.registrationBySchool) ? cached : null;
  } catch {
    return null;
  }
}

function renderDashboard(box, d) {
  const receiptTotal = d.registrationBySchool.reduce((total, row) => total + (row.receipts || 0), 0);
  box.innerHTML = `
    <section class="card">
      <div class="card-head"><h2>Ringkasan pendaftaran</h2></div>
      <div class="table-wrap">
        <table class="table home-summary-table">
          <caption class="sr-only">Bilangan murid dan resit mengikut sekolah rendah serta jumlah keseluruhan</caption>
          <thead><tr><th scope="col">Sekolah</th><th scope="col" class="num">Sudah daftar</th><th scope="col" class="num">Belum daftar</th><th scope="col" class="num">Jumlah murid</th><th scope="col" class="num">Bil resit</th></tr></thead>
          <tbody>${schools.slice().sort((a, b) => a.localeCompare(b, "ms")).map((school) => {
            const row = d.registrationBySchool.find((item) => item.school === school);
            return `<tr><th scope="row">${esc(school)}</th><td class="num">${row?.registered ?? "—"}</td><td class="num">${row?.notRegistered ?? "—"}</td><td class="num">${row?.total ?? "—"}</td><td class="num">${row?.receipts ?? 0}</td></tr>`;
          }).join("")}</tbody>
          <tfoot><tr><th scope="row">Jumlah keseluruhan</th><td class="num">${d.registeredStudents ?? "—"}</td><td class="num">${d.notRegisteredStudents ?? "—"}</td><td class="num">${d.activeStudents ?? "—"}</td><td class="num">${receiptTotal}</td></tr></tfoot>
        </table>
      </div>
    </section>`;
}

export async function renderHome(root) {
  root.innerHTML = `
    <div class="page-head home-hero">
      <h1>Utama</h1>
    </div>

    <div class="task-grid">
      <a class="task-card" href="#/pendaftaran">
        <span class="task-title">Pendaftaran Tingkatan 1</span>
        <span class="task-desc">Cari murid dan tandakan kehadiran.</span>
        <span class="task-go">Buka →</span>
      </a>
      <a class="task-card" href="#/jana-resit">
        <span class="task-title">Resit koperasi</span>
        <span class="task-desc">Pilih murid, barangan dan bayaran.</span>
        <span class="task-go">Buka →</span>
      </a>
    </div>

    <div id="home-data">${loadingState("Memuatkan ringkasan…")}</div>`;

  const box = root.querySelector("#home-data");
  let cached = readDashboardCache();
  if (cached) renderDashboard(box, cached);

  let d;
  try {
    d = await getDashboard();
    if (!Array.isArray(d.registrationBySchool)) {
      throw new Error("Ringkasan dashboard tidak lengkap.");
    }
    try { localStorage.setItem(DASHBOARD_STORAGE_KEY, JSON.stringify(d)); } catch { /* Cache peranti pilihan sahaja. */ }
  } catch (err) {
    if (cached) {
      box.insertAdjacentHTML("afterbegin", '<p class="muted tiny" role="status">Menunjukkan ringkasan terakhir; data terkini belum dapat disegerakkan.</p>');
      return;
    }
    box.innerHTML = readErrorState(err, "Ringkasan utama");
    wireReadRetry(box, () => renderHome(root));
    return;
  }
  renderDashboard(box, d);
}

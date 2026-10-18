import { apiFetch } from "../shared/api.js";
import { formatRM } from "../shared/money.js";
import { esc, formatDateTime } from "../shared/dom.js";
import { APP_LONG_NAME } from "../shared/config.js";
import { paymentLabel } from "../features/e-resit/constants.js";

// Papan pemuka menggabungkan statistik e-Daftar dan e-Resit Koperasi.
const getDashboard = () => apiFetch("/api/dashboard");

export async function renderDashboard(root) {
  root.innerHTML = `
    <h1>Papan Pemuka</h1>
    <p class="muted">${esc(APP_LONG_NAME)}</p>
    <div id="dash"><p class="muted">Memuatkan...</p></div>`;
  const box = root.querySelector("#dash");

  let d;
  try {
    d = await getDashboard();
  } catch (err) {
    box.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    return;
  }

  const pct = d.activeStudents ? Math.round((d.registeredStudents / d.activeStudents) * 100) : 0;

  box.innerHTML = `
    <div class="cards">
      <div class="card stat"><span>Belum daftar</span><strong>${d.notRegisteredStudents}</strong></div>
      <div class="card stat"><span>Sudah daftar</span><strong>${d.registeredStudents}</strong></div>
      <div class="card stat"><span>Didaftarkan hari ini</span><strong>${d.registeredTodayCount ?? 0}</strong></div>
      <div class="card stat"><span>Keahlian koperasi</span><strong>${d.koperasiStudents}</strong></div>
    </div>

    <section class="card">
      <h2>Kemajuan Hari Pendaftaran</h2>
      <div class="progress-row">
        <div class="progress" role="img" aria-label="Kemajuan pendaftaran">
          <div class="progress-bar" style="width:${pct}%"></div>
        </div>
        <span class="muted">${pct}% sudah daftar · ${d.registeredStudents} daripada ${d.activeStudents} murid aktif</span>
      </div>
      ${d.activeStudents === 0 ? `
        <p class="notice">Belum ada data murid. <a href="#/import">Import senarai murid</a> dahulu
          sebelum hari pendaftaran.</p>` : ""}
      <div class="toolbar" style="margin:.6rem 0 0">
        <a class="btn primary" href="#/pendaftaran">Tandakan kehadiran murid</a>
        <a class="btn" href="#/jana-resit">Jana resit koperasi</a>
      </div>
    </section>

    <div class="nav-cards">
      <a class="nav-card" href="#/pendaftaran">
        <strong>e-Daftar</strong>
        <span>Sekolah terdahulu, status OKU, status daftar dan permohonan penempatan semula murid.</span>
      </a>
      <a class="nav-card" href="#/jana-resit">
        <strong>e-Resit Koperasi</strong>
        <span>Menjana resit bayaran barangan koperasi untuk murid.</span>
      </a>
    </div>

    <section class="card">
      <h2>Resit Koperasi</h2>
      <p class="muted">Resit diterbitkan hari ini: <strong>${d.todayCount}</strong>
        · Jumlah: <strong>${formatRM(d.todayTotalSen)}</strong></p>
      ${d.recent.length ? `
        <div class="table-wrap"><table class="table">
          <thead><tr><th>No. Resit</th><th>Tarikh</th><th>Murid</th><th class="num">Jumlah</th><th>Bayaran</th></tr></thead>
          <tbody>${d.recent.map((r) => `
            <tr>
              <td><a href="#/resit/${esc(r.receiptId)}">${esc(r.receiptNo)}</a></td>
              <td>${esc(formatDateTime(r.createdAt))}</td>
              <td>${esc(r.studentNameSnapshot)}</td>
              <td class="num">${formatRM(r.totalSen)}</td>
              <td>${esc(paymentLabel(r.paymentMethod))}</td>
            </tr>`).join("")}
          </tbody>
        </table></div>` : `<p class="muted">Belum ada resit.</p>`}
    </section>`;
}

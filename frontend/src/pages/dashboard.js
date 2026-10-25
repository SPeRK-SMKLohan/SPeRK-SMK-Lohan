import { apiFetch } from "../shared/api.js";
import { formatRM } from "../shared/money.js";
import { esc, formatDate, formatTime } from "../shared/dom.js";
import { APP_LONG_NAME } from "../shared/config.js";
import { paymentLabel } from "../features/e-resit/constants.js";

// Papan pemuka menggabungkan statistik e-Daftar dan e-Resit Koperasi.
const getDashboard = () => apiFetch("/api/dashboard");

export async function renderDashboard(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Utama</h1>
      <p>${esc(APP_LONG_NAME)}</p>
    </div>
    <div id="dash"><p class="muted">Memuatkan...</p></div>`;
  const box = root.querySelector("#dash");

  let d;
  try {
    d = await getDashboard();
  } catch (err) {
    const isConnectionError = !err.status || /rangkaian|internet|terlalu lama/i.test(err.message);
    box.innerHTML = `<div class="load-error" role="alert"><strong>${isConnectionError ? "Sambungan terganggu" : "Papan pemuka belum tersedia"}</strong>
      <span>${isConnectionError ? "Semak sambungan internet dan cuba semula." : "Pelayan belum dapat memuatkan ringkasan. Cuba semula sebentar lagi."}</span>
      <button id="retry-dashboard" class="btn primary" type="button">Cuba semula</button></div>`;
    box.querySelector("#retry-dashboard").addEventListener("click", () => renderDashboard(root));
    return;
  }

  box.innerHTML = `
    <div class="cards">
      <div class="card stat"><span>Belum daftar</span><strong>${d.notRegisteredStudents}</strong></div>
      <div class="card stat"><span>Sudah daftar</span><strong>${d.registeredStudents}</strong></div>
      <div class="card stat"><span>Didaftarkan hari ini</span><strong>${d.registeredTodayCount ?? 0}</strong></div>
      <div class="card stat"><span>Keahlian koperasi</span><strong>${d.koperasiStudents}</strong></div>
    </div>

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
              <td class="nowrap"><strong>${esc(formatDate(r.createdAt))}</strong><br><span class="muted">${esc(formatTime(r.createdAt))}</span></td>
              <td>${esc(r.studentNameSnapshot)}</td>
              <td class="num">${formatRM(r.totalSen)}</td>
              <td><span class="badge${r.paymentMethod === "CASH" ? "" : " indigo"}">${esc(paymentLabel(r.paymentMethod))}</span></td>
            </tr>`).join("")}
          </tbody>
        </table></div>` : `<p class="muted">Belum ada resit.</p>`}
    </section>`;
}

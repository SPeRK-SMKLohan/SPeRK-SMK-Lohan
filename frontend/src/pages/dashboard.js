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

  // Alat pembangunan: hanya muncul semasa `npm run dev`.
  const devTools = import.meta.env.DEV ? `
    <section class="card">
      <h2>Alat pembangunan</h2>
      <p class="muted">Memasukkan murid dan barangan rekaan ke Firestore. Tidak tersedia di versi produksi.</p>
      <button id="seed" class="btn" type="button">Masukkan data rekaan</button>
      <p id="seed-msg" class="muted"></p>
    </section>` : "";

  box.innerHTML = `
    <div class="cards">
      <div class="card stat"><span>Belum daftar</span><strong>${d.notRegisteredStudents}</strong></div>
      <div class="card stat"><span>Sudah daftar</span><strong>${d.registeredStudents}</strong></div>
      <div class="card stat"><span>Keahlian koperasi</span><strong>${d.koperasiStudents}</strong></div>
    </div>
    <p class="muted">Jumlah murid aktif: <strong>${d.activeStudents}</strong> orang.</p>

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
    </section>
    ${devTools}`;

  const seedBtn = box.querySelector("#seed");
  seedBtn?.addEventListener("click", async () => {
    const msg = box.querySelector("#seed-msg");
    seedBtn.disabled = true;
    msg.textContent = "Memasukkan data rekaan...";
    try {
      await apiFetch("/api/dev/seed", { method: "POST" });
      await renderDashboard(root);
    } catch (err) {
      msg.textContent = err.message;
      seedBtn.disabled = false;
    }
  });
}

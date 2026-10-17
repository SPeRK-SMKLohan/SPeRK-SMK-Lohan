import { getDashboard } from "../services.js";
import { apiFetch } from "../api.js";
import { formatRM } from "../utils/money.js";
import { esc, formatDateTime, paymentLabel } from "../utils/dom.js";

export async function renderDashboard(root) {
  root.innerHTML = `
    <h1>Dashboard</h1>
    <p><a class="btn primary" href="#/jana-resit">+ Jana Resit Baharu</a></p>
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
      <div class="card stat"><span>Murid aktif</span><strong>${d.activeStudents}</strong></div>
      <div class="card stat"><span>Barangan aktif</span><strong>${d.activeItems}</strong></div>
      <div class="card stat"><span>Resit hari ini</span><strong>${d.todayCount}</strong></div>
      <div class="card stat"><span>Jumlah hari ini</span><strong>${formatRM(d.todayTotalSen)}</strong></div>
    </div>
    <section class="card">
      <h2>Resit terkini</h2>
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
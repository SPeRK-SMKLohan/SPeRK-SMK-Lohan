import { db } from "../state.js";
import { formatRM } from "../utils/money.js";
import { esc, formatDateTime, localDateKey, paymentLabel } from "../utils/dom.js";

export function renderDashboard(root) {
  const today = localDateKey(new Date().toISOString());
  const issued = db.receipts.filter((r) => r.status === "ISSUED");
  const todayTotal = issued
    .filter((r) => localDateKey(r.createdAt) === today)
    .reduce((sum, r) => sum + r.totalSen, 0);
  const recent = [...db.receipts]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  root.innerHTML = `
    <h1>Dashboard</h1>
    <p><a class="btn primary" href="#/jana-resit">+ Jana Resit Baharu</a></p>
    <div class="cards">
      <div class="card stat"><span>Murid aktif</span><strong>${db.students.filter((s) => s.active).length}</strong></div>
      <div class="card stat"><span>Barangan aktif</span><strong>${db.items.filter((i) => i.active).length}</strong></div>
      <div class="card stat"><span>Jumlah resit</span><strong>${issued.length}</strong></div>
      <div class="card stat"><span>Jumlah hari ini</span><strong>${formatRM(todayTotal)}</strong></div>
    </div>
    <section class="card">
      <h2>Resit terkini</h2>
      ${recent.length ? `
        <div class="table-wrap"><table class="table">
          <thead><tr><th>No. Resit</th><th>Tarikh</th><th>Murid</th><th class="num">Jumlah</th><th>Bayaran</th></tr></thead>
          <tbody>${recent.map((r) => `
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
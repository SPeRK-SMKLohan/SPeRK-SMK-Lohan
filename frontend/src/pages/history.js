import { db } from "../state.js";
import { formatRM } from "../utils/money.js";
import { esc, formatDateTime, localDateKey, paymentLabel } from "../utils/dom.js";

export function renderHistory(root) {
  root.innerHTML = `
    <h1>Sejarah Resit</h1>
    <div class="toolbar">
      <input id="q" class="input" type="search" placeholder="Cari no. resit atau nama murid">
      <label class="inline">Dari <input id="from" class="input" type="date"></label>
      <label class="inline">Hingga <input id="to" class="input" type="date"></label>
    </div>
    <p id="count" class="muted"></p>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>No. Resit</th><th>Tarikh</th><th>Murid</th><th class="num">Jumlah</th><th>Bayaran</th><th></th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>`;

  const $ = (sel) => root.querySelector(sel);

  function update() {
    const q = $("#q").value.trim().toLowerCase();
    const from = $("#from").value;
    const to = $("#to").value;

    const list = db.receipts
      .filter((r) => {
        const day = localDateKey(r.createdAt);
        return (
          (!q || r.receiptNo.toLowerCase().includes(q) || r.studentNameSnapshot.toLowerCase().includes(q)) &&
          (!from || day >= from) &&
          (!to || day <= to)
        );
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    $("#count").textContent = `${list.length} resit`;
    $("#rows").innerHTML = list.map((r) => `
      <tr>
        <td>${esc(r.receiptNo)}</td>
        <td>${esc(formatDateTime(r.createdAt))}</td>
        <td>${esc(r.studentNameSnapshot)}</td>
        <td class="num">${formatRM(r.totalSen)}</td>
        <td>${esc(paymentLabel(r.paymentMethod))}</td>
        <td><a href="#/resit/${esc(r.receiptId)}">Lihat</a></td>
      </tr>`).join("") || `<tr><td colspan="6" class="muted">Tiada resit.</td></tr>`;
  }

  root.querySelectorAll("input").forEach((el) => el.addEventListener("input", update));
  update();
}
import { listReceipts } from "./api.js";
import { paymentLabel } from "./constants.js";
import { formatRM } from "../../shared/money.js";
import { esc, formatDateTime } from "../../shared/dom.js";

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
  let seq = 0;
  let timer;

  async function update() {
    const mine = ++seq;
    $("#count").textContent = "Memuatkan...";
    try {
      const { receipts, truncated } = await listReceipts({
        q: $("#q").value.trim(),
        from: $("#from").value,
        to: $("#to").value,
        limit: 100,
      });
      if (mine !== seq) return;
      $("#count").textContent = truncated
        ? `Menunjukkan ${receipts.length} resit terkini. Gunakan carian atau tarikh untuk mengecilkan senarai.`
        : `${receipts.length} resit`;
      $("#rows").innerHTML = receipts.map((r) => `
        <tr>
          <td>${esc(r.receiptNo)}</td>
          <td>${esc(formatDateTime(r.createdAt))}</td>
          <td>${esc(r.studentNameSnapshot)}</td>
          <td class="num">${formatRM(r.totalSen)}</td>
          <td>${esc(paymentLabel(r.paymentMethod))}</td>
          <td><a href="#/resit/${esc(r.receiptId)}">Lihat</a></td>
        </tr>`).join("") || `<tr><td colspan="6" class="muted">Tiada resit.</td></tr>`;
    } catch (err) {
      if (mine !== seq) return;
      $("#count").textContent = "";
      $("#rows").innerHTML = `<tr><td colspan="6" class="error">${esc(err.message)}</td></tr>`;
    }
  }

  $("#q").addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(update, 300);
  });
  $("#from").addEventListener("change", update);
  $("#to").addEventListener("change", update);
  update();
}
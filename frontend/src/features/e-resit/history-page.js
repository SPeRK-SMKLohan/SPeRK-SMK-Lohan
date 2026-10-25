import { listReceipts } from "./api.js";
import { paymentLabel } from "./constants.js";
import { formatRM } from "../../shared/money.js";
import { esc, formatDate, formatTime } from "../../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../../shared/feedback.js";

export function renderHistory(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Sejarah Resit</h1>
    </div>
    <section class="card">
      <div class="toolbar">
        <label class="history-filter" for="q">Cari resit atau nama murid
          <input id="q" class="input" type="search" placeholder="Contoh: 2026-000001 atau nama murid">
        </label>
        <label class="history-filter" for="from">Dari tarikh <input id="from" class="input" type="date"></label>
        <label class="history-filter" for="to">Hingga tarikh <input id="to" class="input" type="date"></label>
      </div>
    </section>
    <p id="count" class="muted" role="status" aria-live="polite"></p>
    <div class="table-wrap"><table class="table">
      <caption class="sr-only">Senarai resit koperasi</caption>
      <thead><tr><th scope="col">No. Resit</th><th scope="col">Tarikh</th><th scope="col">Murid</th><th scope="col" class="num">Jumlah</th><th scope="col">Bayaran</th><th scope="col"><span class="sr-only">Tindakan</span></th></tr></thead>
      <tbody id="rows"><tr><td colspan="6">${loadingState("Sedang mendapatkan sejarah resit…")}</td></tr></tbody>
    </table></div>`;

  const $ = (sel) => root.querySelector(sel);
  let seq = 0;
  let timer;

  async function update() {
    const mine = ++seq;
    $("#count").textContent = "Sedang mendapatkan sejarah resit…";
    $("#rows").innerHTML = `<tr><td colspan="6">${loadingState("Sedang mendapatkan sejarah resit…")}</td></tr>`;
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
          <td><a href="#/resit/${esc(r.receiptId)}">${esc(r.receiptNo)}</a></td>
          <td class="nowrap"><strong>${esc(formatDate(r.createdAt))}</strong><br><span class="muted">${esc(formatTime(r.createdAt))}</span></td>
          <td>${esc(r.studentNameSnapshot)}</td>
          <td class="num">${formatRM(r.totalSen)}</td>
          <td><span class="badge${r.paymentMethod === "CASH" ? "" : " indigo"}">${esc(paymentLabel(r.paymentMethod))}</span></td>
          <td><a class="btn small" href="#/resit/${esc(r.receiptId)}">Lihat</a></td>
        </tr>`).join("") || `<tr><td colspan="6" class="muted">Tiada resit.</td></tr>`;
    } catch (err) {
      if (mine !== seq) return;
      $("#count").textContent = "";
      $("#rows").innerHTML = `<tr><td colspan="6">${readErrorState(err, "Sejarah resit")}</td></tr>`;
      wireReadRetry(root, update);
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

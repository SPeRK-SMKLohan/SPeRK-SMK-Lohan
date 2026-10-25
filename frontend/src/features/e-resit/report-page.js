import { listReceipts } from "./api.js";
import { paymentLabel } from "./constants.js";
import { formatRM } from "../../shared/money.js";
import { esc, formatDate, formatTime } from "../../shared/dom.js";

function todayKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function csvCell(value) {
  const safe = String(value ?? "").replace(/^[=+@\-]/, "'$&");
  return `"${safe.replaceAll('"', '""')}"`;
}

export function renderCoopReport(root) {
  root.innerHTML = `
    <div class="page-head">
      <div><h1>Laporan Koperasi</h1><p>Ringkasan jualan berdasarkan resit yang telah dikeluarkan.</p></div>
    </div>
    <section class="card report-filters no-print" aria-label="Penapis laporan">
      <label>Dari tarikh<input id="report-from" class="input" type="date"></label>
      <label>Hingga tarikh<input id="report-to" class="input" type="date"></label>
      <label>Kaedah bayaran<select id="report-payment" class="input"><option value="ALL">Semua bayaran</option><option value="CASH">Tunai</option><option value="BANK_TRANSFER">Pindahan bank</option></select></label>
      <div class="report-actions"><button id="report-refresh" class="btn" type="button">Muat semula</button><button id="report-print" class="btn primary" type="button">Cetak laporan</button></div>
    </section>
    <p id="report-message" class="muted" role="status" aria-live="polite">Pilih tempoh tarikh atau muatkan laporan.</p>
    <section class="report-totals" aria-label="Ringkasan jualan">
      <article class="card report-total"><span>Jumlah jualan</span><strong id="report-total">RM0.00</strong></article>
      <article class="card report-total"><span>Bayaran tunai</span><strong id="report-cash">RM0.00</strong></article>
      <article class="card report-total"><span>Pindahan bank</span><strong id="report-bank">RM0.00</strong></article>
      <article class="card report-total"><span>Bilangan resit</span><strong id="report-count">0</strong></article>
    </section>
    <section class="card report-lines-card">
      <div class="report-lines-head"><h2>Butiran jualan</h2><button id="report-csv" class="btn small" type="button" disabled>Muat turun CSV</button></div>
      <p id="report-truncated" class="notice" hidden></p>
      <div class="table-wrap report-table-wrap"><table class="table report-table">
        <thead><tr><th>Tarikh</th><th>No. resit</th><th>Murid</th><th>Barang</th><th class="num">Kuantiti</th><th class="num">Harga seunit</th><th class="num">Jumlah</th><th>Bayaran</th></tr></thead>
        <tbody id="report-rows"><tr><td colspan="8" class="muted">Tekan Muat semula untuk memuatkan laporan.</td></tr></tbody>
      </table></div>
    </section>`;

  const $ = (selector) => root.querySelector(selector);
  const fromInput = $("#report-from");
  const toInput = $("#report-to");
  const paymentInput = $("#report-payment");
  fromInput.value = `${todayKey().slice(0, 4)}-01-01`;
  toInput.value = todayKey();
  let seq = 0;
  let reportRows = [];

  function renderRows(receipts) {
    const entries = [];
    for (const receipt of receipts) {
      for (const item of receipt.items || []) {
        entries.push({
          date: formatDate(receipt.createdAt), time: formatTime(receipt.createdAt),
          receiptNo: receipt.receiptNo, receiptId: receipt.receiptId,
          student: receipt.studentNameSnapshot, item: item.itemNameSnapshot,
          quantity: item.quantity, unitPriceSen: item.unitPriceSen,
          subtotalSen: item.subtotalSen, paymentMethod: receipt.paymentMethod,
        });
      }
    }
    reportRows = entries;
    $("#report-rows").innerHTML = entries.map((entry) => `
      <tr>
        <td data-label="Tarikh"><strong>${esc(entry.date)}</strong><br><span class="muted">${esc(entry.time)}</span></td>
        <td data-label="No. resit"><a href="#/resit/${esc(entry.receiptId)}">${esc(entry.receiptNo)}</a></td>
        <td data-label="Murid">${esc(entry.student)}</td>
        <td data-label="Barang">${esc(entry.item)}</td>
        <td data-label="Kuantiti" class="num">${entry.quantity}</td>
        <td data-label="Harga seunit" class="num">${formatRM(entry.unitPriceSen)}</td>
        <td data-label="Jumlah" class="num"><strong>${formatRM(entry.subtotalSen)}</strong></td>
        <td data-label="Bayaran">${esc(paymentLabel(entry.paymentMethod))}</td>
      </tr>`).join("") || `<tr><td colspan="8" class="muted">Tiada jualan untuk penapis ini.</td></tr>`;
    $("#report-csv").disabled = entries.length === 0;
  }

  async function load() {
    const mine = ++seq;
    $("#report-message").textContent = "Memuatkan laporan...";
    $("#report-rows").innerHTML = `<tr><td colspan="8" class="muted">Sedang memuatkan...</td></tr>`;
    $("#report-truncated").hidden = true;
    try {
      const result = await listReceipts({
        from: fromInput.value, to: toInput.value, limit: 500, includeItems: "true",
      });
      if (mine !== seq) return;
      const allReceipts = result.receipts || [];
      const receipts = paymentInput.value === "ALL"
        ? allReceipts
        : allReceipts.filter((receipt) => receipt.paymentMethod === paymentInput.value);
      const sum = (method) => receipts.filter((receipt) => receipt.paymentMethod === method)
        .reduce((total, receipt) => total + (receipt.totalSen || 0), 0);
      const total = receipts.reduce((acc, receipt) => acc + (receipt.totalSen || 0), 0);
      $("#report-total").textContent = formatRM(total);
      $("#report-cash").textContent = formatRM(sum("CASH"));
      $("#report-bank").textContent = formatRM(sum("BANK_TRANSFER"));
      $("#report-count").textContent = String(receipts.length);
      renderRows(receipts);
      $("#report-message").textContent = `${receipts.length} resit · ${reportRows.length} baris jualan`;
      if (result.truncated) {
        $("#report-truncated").textContent = "Laporan ini mencapai had 500 resit. Pilih tempoh tarikh yang lebih pendek untuk melihat semua rekod.";
        $("#report-truncated").hidden = false;
      }
    } catch (error) {
      if (mine !== seq) return;
      reportRows = [];
      $("#report-message").textContent = "Laporan tidak dapat dimuatkan. Semak sambungan internet dan cuba lagi.";
      $("#report-rows").innerHTML = `<tr><td colspan="8" class="error">${esc(error.message)} <button id="report-retry" class="btn small" type="button">Cuba lagi</button></td></tr>`;
      $("#report-retry").addEventListener("click", load);
    }
  }

  $("#report-refresh").addEventListener("click", load);
  $("#report-print").addEventListener("click", () => window.print());
  fromInput.addEventListener("change", load);
  toInput.addEventListener("change", load);
  paymentInput.addEventListener("change", load);
  $("#report-csv").addEventListener("click", () => {
    const header = ["Tarikh", "No. resit", "Murid", "Barang", "Kuantiti", "Harga seunit (RM)", "Jumlah (RM)", "Bayaran"];
    const lines = reportRows.map((row) => [row.date, row.receiptNo, row.student, row.item, row.quantity,
      (row.unitPriceSen / 100).toFixed(2), (row.subtotalSen / 100).toFixed(2), paymentLabel(row.paymentMethod)]);
    const csv = [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `laporan-koperasi-${fromInput.value}-${toInput.value}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  load();
}

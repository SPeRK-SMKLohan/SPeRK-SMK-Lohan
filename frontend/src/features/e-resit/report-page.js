import { listReceipts } from "./api.js";
import { paymentLabel } from "./constants.js";
import { formatRM } from "../../shared/money.js";
import { esc } from "../../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../../shared/feedback.js";

/* Cooperative report.
   Totals first, then the receipts that make them up, then export. The payment
   filter is applied after the fetch, so the page says so when the 500-receipt
   ceiling is reached instead of quietly under-reporting. */

const LIMIT = 500;

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
      <h1>Laporan koperasi</h1>
      <p class="lede">Ringkasan jualan berdasarkan resit yang telah dikeluarkan.</p>
    </div>

    <section class="card no-print" style="margin-bottom:var(--s4)" aria-label="Penapis laporan">
      <div class="filter-bar">
        <div class="field" style="grid-column:1/-1">
          <label class="label" for="report-q">Cari resit atau nama murid <span class="optional">(pilihan)</span></label>
          <input id="report-q" class="input" type="search" autocomplete="off"
                 placeholder="Contoh: 2026-000001 atau Ahmad">
        </div>
        <div class="field">
          <label class="label" for="report-from">Dari tarikh</label>
          <input id="report-from" class="input" type="date">
        </div>
        <div class="field">
          <label class="label" for="report-to">Hingga tarikh</label>
          <input id="report-to" class="input" type="date">
        </div>
        <div class="field">
          <label class="label" for="report-payment">Kaedah bayaran</label>
          <select id="report-payment" class="select">
            <option value="ALL">Semua bayaran</option>
            <option value="CASH">Tunai</option>
            <option value="BANK_TRANSFER">Pindahan bank</option>
          </select>
        </div>
        <div class="field">
          <div class="filter-actions">
            <button id="report-refresh" class="btn secondary" type="button">Muat semula</button>
          </div>
        </div>
      </div>
    </section>

    <p id="report-message" class="list-count" role="status" aria-live="polite"></p>

    <div class="totals">
      <div class="total-card"><span>Jumlah jualan</span><strong id="report-total">—</strong></div>
      <div class="total-card"><span>Tunai</span><strong id="report-cash">—</strong></div>
      <div class="total-card"><span>Pindahan bank</span><strong id="report-bank">—</strong></div>
      <div class="total-card"><span>Bilangan resit</span><strong id="report-count">—</strong></div>
    </div>

    <div id="report-warning"></div>

    <section class="card" style="margin-top:var(--s4)">
      <div class="card-head">
        <h2>Butiran resit</h2>
        <button id="report-csv" class="btn secondary sm" type="button" disabled>Muat turun CSV</button>
      </div>
      <div id="report-rows">${loadingState("Sedang mendapatkan laporan…")}</div>
    </section>`;

  const $ = (sel) => root.querySelector(sel);
  const fromInput = $("#report-from");
  const toInput = $("#report-to");
  const paymentInput = $("#report-payment");
  const qInput = $("#report-q");

  fromInput.value = `${todayKey().slice(0, 4)}-01-01`;
  toInput.value = todayKey();

  let seq = 0;
  let reportRows = [];
  let truncated = false;

  function renderRows(rows) {
    reportRows = rows;
    if (!rows.length) {
      $("#report-rows").innerHTML = `<div class="record-empty">
        <p>Tiada resit sepadan dengan carian dan penapis ini.</p>
        <p class="muted tiny">Cuba julat tarikh yang lebih luas, atau kosongkan carian.</p>
      </div>`;
      $("#report-csv").disabled = true;
      return;
    }

    $("#report-rows").innerHTML = `
      <div class="table-wrap">
        <table class="table">
          <caption class="sr-only">Butiran resit koperasi dalam tempoh dipilih</caption>
          <thead>
            <tr>
              <th scope="col">No. resit</th>
              <th scope="col">Murid</th>
              <th scope="col">Guru</th>
              <th scope="col">Bayaran</th>
              <th scope="col" class="num">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td><a href="#/resit/${esc(r.receiptId)}">${esc(r.receiptNo)}</a></td>
                <td>${esc(r.student)}</td>
                <td>${esc(r.staffName || "—")}</td>
                <td>${esc(paymentLabel(r.paymentMethod))}</td>
                <td class="num"><strong>${formatRM(r.totalSen)}</strong></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>`;
    $("#report-csv").disabled = false;
  }

  async function load() {
    const mine = ++seq;
    $("#report-message").textContent = "Memuatkan laporan…";
    $("#report-rows").innerHTML = loadingState("Sedang mendapatkan laporan koperasi…");
    $("#report-warning").innerHTML = "";

    try {
      const result = await listReceipts({
        q: qInput.value.trim(),
        from: fromInput.value,
        to: toInput.value,
        limit: LIMIT,
      });
      if (mine !== seq) return;

      truncated = Boolean(result.truncated);
      const all = result.receipts || [];
      const filtered = paymentInput.value === "ALL"
        ? all
        : all.filter((r) => r.paymentMethod === paymentInput.value);

      const sum = (method) => filtered
        .filter((r) => r.paymentMethod === method)
        .reduce((t, r) => t + (r.totalSen || 0), 0);
      const total = filtered.reduce((t, r) => t + (r.totalSen || 0), 0);

      $("#report-total").textContent = formatRM(total);
      $("#report-cash").textContent = formatRM(sum("CASH"));
      $("#report-bank").textContent = formatRM(sum("BANK_TRANSFER"));
      $("#report-count").textContent = String(filtered.length);
      $("#report-message").textContent = filtered.length === all.length
        ? `${filtered.length} resit dalam tempoh ini`
        : `${filtered.length} daripada ${all.length} resit dipaparkan`;

      renderRows(filtered.map((r) => ({
        staffName: r.staffName,
        receiptNo: r.receiptNo,
        receiptId: r.receiptId,
        student: r.studentNameSnapshot,
        totalSen: r.totalSen,
        paymentMethod: r.paymentMethod,
      })));

      if (truncated) {
        const filteredView = paymentInput.value !== "ALL";
        $("#report-warning").innerHTML = `<div class="status warn" role="status">
          <div class="status-body">
            <strong class="status-title">Laporan mencapai had ${LIMIT} resit</strong>
            <span class="status-text">${filteredView
              ? "Penapis bayaran hanya digunakan pada 500 resit terkini, jadi jumlah di atas mungkin kurang daripada sebenar. Pilih tempoh tarikh yang lebih pendek."
              : "Pilih tempoh tarikh yang lebih pendek untuk melihat semua rekod."}</span>
          </div>
        </div>`;
      }
    } catch (error) {
      if (mine !== seq) return;
      reportRows = [];
      for (const id of ["report-total", "report-cash", "report-bank", "report-count"]) {
        $(`#${id}`).textContent = "—";
      }
      $("#report-csv").disabled = true;
      $("#report-message").textContent = "Laporan tidak dapat dimuatkan. Tarikh dan penapis anda masih tersimpan.";
      $("#report-rows").innerHTML = readErrorState(error, "Laporan");
      wireReadRetry(root, load);
    }
  }

  $("#report-refresh").addEventListener("click", load);
  fromInput.addEventListener("change", load);
  toInput.addEventListener("change", load);
  paymentInput.addEventListener("change", load);

  let searchTimer;
  qInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 300);
  });

  $("#report-csv").addEventListener("click", () => {
    const header = ["Nama Guru", "Nama Murid", "No. Resit", "Jumlah (RM)", "Kaedah Pembayaran"];
    const lines = reportRows.map((row) => [
      row.staffName || "",
      row.student,
      row.receiptNo,
      (row.totalSen / 100).toFixed(2),
      paymentLabel(row.paymentMethod),
    ]);
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

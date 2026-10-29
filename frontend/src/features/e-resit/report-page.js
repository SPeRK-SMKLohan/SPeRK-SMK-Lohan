import { getItems, listReceipts } from "./api.js";
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

export function renderCoopReport(root, params = new URLSearchParams()) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Laporan koperasi</h1>
    </div>

    <section class="card report-filter-card no-print" aria-label="Penapis laporan">
      <div class="filter-bar report-filter-bar">
        <div class="field">
          <label class="label" for="report-q">Cari resit atau murid</label>
          <input id="report-q" class="input" type="search" autocomplete="off"
                 placeholder="No. resit atau nama">
        </div>
        <div class="field">
          <label class="label" for="report-from">Dari</label>
          <input id="report-from" class="input" type="date">
        </div>
        <div class="field">
          <label class="label" for="report-to">Hingga</label>
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
      </div>
    </section>

    <p id="report-message" class="list-count" role="status" aria-live="polite"></p>

    <section class="report-summary" aria-label="Ringkasan jualan">
      <div class="report-total-main"><span>Jumlah jualan</span><strong id="report-total">—</strong></div>
      <div class="report-stat"><span>Tunai</span><strong id="report-cash">—</strong></div>
      <div class="report-stat"><span>Pindahan bank</span><strong id="report-bank">—</strong></div>
      <div class="report-stat"><span>Bilangan resit</span><strong id="report-count">—</strong></div>
    </section>

    <div id="report-warning"></div>

    <section class="card" style="margin-top:var(--s4)">
      <div class="card-head">
        <h2>Butiran resit</h2>
        <button id="report-csv" class="btn secondary sm" type="button" disabled>Muat turun CSV</button>
      </div>
      <div id="report-rows">${loadingState("Memuatkan laporan…")}</div>
    </section>

    <details class="card report-items" id="report-items">
      <summary>Senarai harga barangan</summary>
      <div id="report-items-box">${loadingState("Memuatkan senarai barangan…")}</div>
    </details>`;

  const $ = (sel) => root.querySelector(sel);
  const fromInput = $("#report-from");
  const toInput = $("#report-to");
  const paymentInput = $("#report-payment");
  const qInput = $("#report-q");
  const itemsSection = $("#report-items");
  let itemsLoaded = false;

  async function loadItems() {
    const box = $("#report-items-box");
    try {
      const { items } = await getItems();
      itemsLoaded = true;
      box.innerHTML = items.length ? `
        <ul class="record-list">
          ${items.map((item) => `
            <li class="record${item.active ? "" : " is-inactive"}">
              <div class="record-main">
                <p class="record-name">${esc(item.name)}</p>
                <div class="record-meta">
                  <span>${item.fixedQuantity ? `Kuantiti tetap: ${item.fixedQuantity}` : "Kuantiti boleh dipilih"}</span>
                  ${item.active ? "" : '<span class="pill warn">Tidak aktif</span>'}
                </div>
              </div>
              <strong class="num">${formatRM(item.priceSen)}</strong>
            </li>`).join("")}
        </ul>` : `<div class="record-empty"><p>Tiada barangan dalam senarai.</p></div>`;
    } catch (error) {
      box.innerHTML = readErrorState(error, "Senarai barangan");
      wireReadRetry(box, loadItems);
    }
  }

  fromInput.value = `${todayKey().slice(0, 4)}-01-01`;
  toInput.value = todayKey();

  let seq = 0;
  let reportRows = [];
  let truncated = false;

  function renderRows(rows) {
    reportRows = rows;
    if (!rows.length) {
      $("#report-rows").innerHTML = `<div class="record-empty">
        <p>Tiada resit. Luaskan tarikh atau ubah carian.</p>
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
              <th scope="col">Bayaran</th>
              <th scope="col" class="num">Jumlah</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((r) => `
              <tr>
                <td><a href="#/resit/${esc(r.receiptId)}">${esc(r.receiptNo)}</a></td>
                <td>${esc(r.student)}</td>
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
    $("#report-rows").innerHTML = loadingState("Memuatkan laporan…");
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
              ? "Penapis hanya meliputi 500 resit terkini. Pilih tarikh lebih pendek untuk jumlah tepat."
              : "Pilih tarikh lebih pendek untuk melihat semua rekod."}</span>
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
      $("#report-message").textContent = "Laporan gagal dimuatkan. Penapis dikekalkan.";
      $("#report-rows").innerHTML = readErrorState(error, "Laporan");
      wireReadRetry(root, load);
    }
  }

  fromInput.addEventListener("change", load);
  toInput.addEventListener("change", load);
  paymentInput.addEventListener("change", load);

  let searchTimer;
  qInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(load, 300);
  });

  $("#report-csv").addEventListener("click", () => {
    const header = ["Nama Murid", "No. Resit", "Jumlah (RM)", "Kaedah Pembayaran"];
    const lines = reportRows.map((row) => [
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

  itemsSection.addEventListener("toggle", () => {
    if (itemsSection.open && !itemsLoaded) loadItems();
  });
  load();
  if (params.get("items") === "1") {
    itemsSection.open = true;
    requestAnimationFrame(() => $("#report-items").scrollIntoView({ behavior: "smooth", block: "start" }));
  }
}

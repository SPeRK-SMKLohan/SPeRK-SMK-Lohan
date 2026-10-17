import { SCHOOL_NAME, RECEIPT_TITLE, SHOW_IC_ON_RECEIPT } from "../config.js";
import { formatRM } from "../utils/money.js";
import { esc, formatDateTime, paymentLabel } from "../utils/dom.js";
import { db } from "../state.js";

export function receiptHtml(r) {
  const student = db.students.find((s) => s.studentId === r.studentId);
  const icRow = SHOW_IC_ON_RECEIPT && student
    ? `<div><span>No. IC</span><strong>${esc(student.icNumber)}</strong></div>`
    : "";

  const rows = r.items.map((i) => `
    <tr>
      <td>${esc(i.itemNameSnapshot)}${i.size ? ` (${esc(i.size)})` : ""}</td>
      <td class="num">${i.quantity}</td>
      <td class="num">${formatRM(i.unitPriceSen)}</td>
      <td class="num">${formatRM(i.subtotalSen)}</td>
    </tr>`).join("");

  return `
    <article class="receipt" id="receipt">
      <header class="receipt-head">
        <h2>${esc(RECEIPT_TITLE)}</h2>
        <p>${esc(SCHOOL_NAME)}</p>
      </header>
      <div class="receipt-meta">
        <div><span>No. Resit</span><strong>${esc(r.receiptNo)}</strong></div>
        <div><span>Tarikh</span><strong>${esc(formatDateTime(r.createdAt))}</strong></div>
        <div><span>Nama Murid</span><strong>${esc(r.studentNameSnapshot)}</strong></div>
        ${icRow}
      </div>
      <table class="table">
        <thead>
          <tr><th>Item</th><th class="num">Kuantiti</th><th class="num">Harga</th><th class="num">Jumlah</th></tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><th colspan="3">Jumlah Keseluruhan</th><th class="num">${formatRM(r.totalSen)}</th></tr>
        </tfoot>
      </table>
      <div class="receipt-meta">
        <div><span>Kaedah Pembayaran</span><strong>${esc(paymentLabel(r.paymentMethod))}</strong></div>
      </div>
      <p class="receipt-thanks">Terima kasih.</p>
    </article>`;
}

// Tiada nombor IC dalam mesej WhatsApp.
export function whatsappText(r) {
  return [
    `${RECEIPT_TITLE} ${SCHOOL_NAME}`,
    `Nombor Resit: ${r.receiptNo}`,
    `Nama Murid: ${r.studentNameSnapshot}`,
    `Jumlah Bayaran: ${formatRM(r.totalSen)}`,
    `Kaedah Pembayaran: ${paymentLabel(r.paymentMethod)}`,
    "Terima kasih.",
  ].join("\n");
}
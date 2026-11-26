import { RECEIPT_TITLE } from "./config.js";
import { KOPERASI_NAME, KOPERASI_ADDRESS, KOPERASI_TEL, LOGO_URL } from "../../shared/koperasi.js";
import { formatAmount } from "../../shared/money.js";
import { esc, formatDateTime } from "../../shared/dom.js";
import { paymentLabel } from "./constants.js";

export function receiptHtml(r) {
  const rows = r.items.map((i) => {
    const variant = i.variant ?? i.size; // sokong resit lama yang menggunakan "size"
    return `
    <tr>
      <td data-label="Barangan">${esc(i.itemNameSnapshot)}${variant ? ` (${esc(variant)})` : ""}</td>
      <td class="num" data-label="Kuantiti">${i.quantity}</td>
      <td class="num" data-label="Harga">${formatAmount(i.unitPriceSen)}</td>
      <td class="num" data-label="Jumlah">${formatAmount(i.subtotalSen)}</td>
    </tr>`;
  }).join("");

  return `
    <article class="receipt" id="receipt">
      <header class="receipt-head">
        <img class="receipt-logo" src="${esc(LOGO_URL)}" alt="Logo SMK Lohan" />
        <div class="receipt-org">
          <h2>${esc(KOPERASI_NAME)}</h2>
          <p>${esc(KOPERASI_ADDRESS)}</p>
          <p>No. Tel: ${esc(KOPERASI_TEL)}</p>
        </div>
      </header>
      <div class="receipt-title">${esc(RECEIPT_TITLE)}</div>
      <div class="receipt-meta">
        <div><span>No. Resit</span><strong>${esc(r.receiptNo)}</strong></div>
        <div><span>Tarikh</span><strong>${esc(formatDateTime(r.createdAt))}</strong></div>
        <div><span>Nama Murid</span><strong>${esc(r.studentNameSnapshot)}</strong></div>
      </div>
      <table class="table receipt-print-items">
        <caption class="sr-only">Butiran barangan dan jumlah bagi resit ${esc(r.receiptNo)}</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col" class="num"><span class="receipt-heading-full">Kuantiti</span><span class="receipt-heading-short">Bil.</span></th>
            <th scope="col" class="num"><span class="receipt-heading-full">Harga (RM)</span><span class="receipt-heading-short">Harga</span></th>
            <th scope="col" class="num"><span class="receipt-heading-full">Jumlah (RM)</span><span class="receipt-heading-short">Jumlah</span></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr><th scope="row" colspan="3">Jumlah Keseluruhan</th><td class="num">${formatAmount(r.totalSen)}</td></tr>
        </tfoot>
      </table>
      <div class="receipt-meta receipt-pay">
        <div><span>Kaedah Pembayaran</span><strong>${esc(paymentLabel(r.paymentMethod))}</strong></div>
        ${r.bankRef ? `<div><span>No. Rujukan</span><strong>${esc(r.bankRef)}</strong></div>` : ""}
      </div>
      <p class="receipt-thanks">Terima kasih.</p>
    </article>`;
}

import { getReceipt } from "../state.js";
import { receiptHtml, whatsappText } from "../components/receipt-view.js";

export function renderReceiptDetail(root, id) {
  const r = getReceipt(id);
  if (!r) {
    root.innerHTML = `<h1>Resit tidak dijumpai</h1><p><a href="#/sejarah">Kembali ke Sejarah Resit</a></p>`;
    return;
  }

  const waLink = `https://wa.me/?text=${encodeURIComponent(whatsappText(r))}`;

  root.innerHTML = `
    <div class="toolbar no-print">
      <a class="btn" href="#/sejarah">← Sejarah</a>
      <a class="btn" href="#/jana-resit">Resit Baharu</a>
      <button class="btn" id="print" type="button">Cetak</button>
      <button class="btn" type="button" disabled title="Ditambah pada Fasa 5">Muat turun PDF</button>
      <a class="btn" href="${waLink}" target="_blank" rel="noopener">Kongsi WhatsApp</a>
    </div>
    ${receiptHtml(r)}`;

  root.querySelector("#print").addEventListener("click", () => window.print());
}
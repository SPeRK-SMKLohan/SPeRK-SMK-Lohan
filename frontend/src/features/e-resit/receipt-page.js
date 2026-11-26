import { getReceipt } from "./api.js";
import { receiptHtml } from "./receipt-view.js";
import { downloadReceiptPdf, receiptPdfName } from "./pdf.js";
import { esc } from "../../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../../shared/feedback.js";
import { showStatus } from "../../shared/status.js";

/* Saved receipt. The document is the page; printing and PDF download are the
   two available output actions. */
export async function renderReceiptDetail(root, id) {
  root.innerHTML = loadingState("Memuatkan resit…");

  let r;
  try {
    ({ receipt: r } = await getReceipt(id));
  } catch (err) {
    root.innerHTML = `
      <div class="page-head"><h1>Resit tidak dapat dibuka</h1></div>
      ${readErrorState(err, "Resit", "Cuba buka semula")}
      <p class="mt-s4"><a class="btn secondary" href="#/laporan-koperasi">Kembali ke laporan</a></p>`;
    wireReadRetry(root, () => renderReceiptDetail(root, id));
    return;
  }

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head-row">
        <div>
          <a class="back-link no-print" href="#/laporan-koperasi">Laporan koperasi</a>
          <h1>Resit ${esc(r.receiptNo)}</h1>
          <p class="lede">${esc(r.studentNameSnapshot)}</p>
        </div>
      </div>
    </div>

    <div class="receipt-toolbar no-print">
      <a class="btn secondary" href="#/jana-resit${r.studentId ? `?student=${encodeURIComponent(r.studentId)}` : ""}">Resit baharu</a>
      <button class="btn secondary" id="pdf" type="button">Muat turun PDF</button>
      <button class="btn primary" id="print" type="button">Cetak</button>
    </div>
    <p id="pdf-msg" class="err no-print" role="alert" aria-live="assertive"></p>

    ${receiptHtml(r)}`;

  root.querySelector("#print").addEventListener("click", () => window.print());

  const pdfBtn = root.querySelector("#pdf");
  const pdfMsg = root.querySelector("#pdf-msg");
  pdfBtn.addEventListener("click", async () => {
    pdfBtn.disabled = true;
    pdfBtn.textContent = "Menjana PDF…";
    pdfMsg.textContent = "";
    try {
      await downloadReceiptPdf(r);
      showStatus({ type: "ok", title: "PDF dimuat turun", message: receiptPdfName(r) });
    } catch (err) {
      console.error(err);
      pdfMsg.textContent = "PDF gagal dijana. Sila cuba lagi.";
    } finally {
      pdfBtn.disabled = false;
      pdfBtn.textContent = "Muat turun PDF";
    }
  });
}

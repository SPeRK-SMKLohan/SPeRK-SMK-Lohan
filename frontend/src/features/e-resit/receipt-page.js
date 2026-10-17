import { getReceipt } from "./api.js";
import { receiptHtml, whatsappText } from "./receipt-view.js";
import { downloadReceiptPdf } from "./pdf.js";
import { esc } from "../../shared/dom.js";

// Mengembalikan "" (tiada nombor), nombor antarabangsa tanpa +, atau null jika tidak sah.
function whatsappNumber(input) {
  let d = input.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = `60${d.slice(1)}`;
  else if (!d.startsWith("60")) return null;
  return d.length >= 11 && d.length <= 12 ? d : null;
}

export async function renderReceiptDetail(root, id) {
  root.innerHTML = `<p class="muted">Memuatkan...</p>`;

  let r;
  try {
    ({ receipt: r } = await getReceipt(id));
  } catch (err) {
    root.innerHTML = `
      <h1>Resit tidak dapat dibuka</h1>
      <p class="error">${esc(err.message)}</p>
      <p><a href="#/sejarah">Kembali ke Sejarah Resit</a></p>`;
    return;
  }

  root.innerHTML = `
    <div class="toolbar no-print">
      <a class="btn" href="#/sejarah">← Sejarah</a>
      <a class="btn" href="#/jana-resit">Resit Baharu</a>
      <button class="btn" id="print" type="button">Cetak</button>
      <button class="btn" id="pdf" type="button">Muat turun PDF</button>
    </div>
    <p id="pdf-msg" class="error no-print"></p>
    <section class="card no-print">
      <h2>Kongsi melalui WhatsApp</h2>
      <p class="muted">Nombor telefon penerima adalah pilihan. Jika dikosongkan, WhatsApp akan
        membenarkan anda memilih penerima. Nombor tidak disimpan. No. IC tidak dimasukkan dalam mesej.</p>
      <div class="toolbar">
        <input id="wa-phone" class="input" type="tel" placeholder="Contoh: 012-3456789" autocomplete="off">
        <button id="wa" class="btn" type="button">Buka WhatsApp</button>
      </div>
      <p id="wa-msg" class="error"></p>
    </section>
    ${receiptHtml(r)}`;

  root.querySelector("#print").addEventListener("click", () => window.print());

  const pdfBtn = root.querySelector("#pdf");
  const pdfMsg = root.querySelector("#pdf-msg");
  pdfBtn.addEventListener("click", async () => {
    pdfBtn.disabled = true;
    pdfBtn.textContent = "Menjana PDF...";
    pdfMsg.textContent = "";
    try {
      await downloadReceiptPdf(r); // dijana daripada rekod yang disimpan
    } catch (err) {
      console.error(err);
      pdfMsg.textContent = "PDF gagal dijana. Sila cuba lagi.";
    } finally {
      pdfBtn.disabled = false;
      pdfBtn.textContent = "Muat turun PDF";
    }
  });

  root.querySelector("#wa").addEventListener("click", () => {
    const msg = root.querySelector("#wa-msg");
    const number = whatsappNumber(root.querySelector("#wa-phone").value);
    if (number === null) {
      msg.textContent = "Nombor telefon tidak sah. Gunakan format seperti 012-3456789.";
      return;
    }
    msg.textContent = "";
    const url = `https://wa.me/${number}?text=${encodeURIComponent(whatsappText(r))}`;
    window.open(url, "_blank", "noopener");
  });
}
import { getReceipt } from "./api.js";
import { receiptHtml, whatsappText } from "./receipt-view.js";
import { buildReceiptPdfBlob, downloadReceiptPdf, receiptPdfName } from "./pdf.js";
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
    <div class="toolbar no-print receipt-toolbar">
      <a class="btn" href="#/sejarah">← Sejarah</a>
      <a class="btn" href="#/jana-resit">Resit Baharu</a>
      <button class="btn primary" id="print" type="button">Cetak</button>
      <button class="btn" id="pdf" type="button">Muat turun PDF</button>
    </div>
    <p id="pdf-msg" class="error no-print"></p>
    <div class="receipt-layout">
      <div class="receipt-main">${receiptHtml(r)}</div>
      <aside class="no-print">
        <section class="card">
          <h2>Kongsi melalui WhatsApp</h2>
          <p class="muted">Mesej ringkasan disediakan automatik (tanpa No. IC; nombor telefon tidak
            disimpan). WhatsApp tidak membenarkan PDF dilampirkan secara automatik — tandakan kotak
            di bawah untuk muat turun PDF resit, kemudian lampirkan fail itu dalam WhatsApp.</p>
          <div class="toolbar">
            <input id="wa-phone" class="input" type="tel" placeholder="Contoh: 012-3456789" autocomplete="off">
            <button id="wa" class="btn wa" type="button">Buka WhatsApp</button>
            <button id="wa-share" class="btn" type="button" hidden>Kongsi PDF (peranti)</button>
          </div>
          <label class="inline"><input id="wa-pdf" type="checkbox" checked>
            Muat turun PDF resit supaya boleh dilampirkan</label>
          <p id="wa-msg" class="muted" role="status"></p>
        </section>
      </aside>
    </div>`;

  const waMsg = root.querySelector("#wa-msg");
  const waPhone = root.querySelector("#wa-phone");
  const waPdf = root.querySelector("#wa-pdf");
  const setWaMsg = (kind, text) => {
    waMsg.className = kind;
    waMsg.textContent = text;
  };

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
    const number = whatsappNumber(waPhone.value);
    if (number === null) {
      setWaMsg("error", "Nombor telefon tidak sah. Gunakan format seperti 012-3456789.");
      return;
    }

    // Buka WhatsApp dahulu, dalam pengendali klik yang sama (elak sekatan pop-up).
    const url = `https://wa.me/${number}?text=${encodeURIComponent(whatsappText(r))}`;
    window.open(url, "_blank", "noopener");

    if (!waPdf.checked) {
      setWaMsg("muted", "");
      return;
    }

    setWaMsg("muted", "Menyediakan PDF resit...");
    downloadReceiptPdf(r)
      .then(() =>
        setWaMsg(
          "notice ok",
          `PDF ${receiptPdfName(r)} telah dimuat turun. Dalam WhatsApp, tekan 📎 (Lampiran) →
           Dokumen → pilih fail tersebut untuk dilampirkan pada mesej.`
        )
      )
      .catch((err) => {
        console.error(err);
        setWaMsg("error", 'PDF gagal dijana. Gunakan butang "Muat turun PDF" di atas, kemudian cuba lagi.');
      });
  });

  // Perkongsian fail terus (Android/iOS atau peranti yang menyokong Web Share API):
  // mesej + PDF dihantar sekali gus ke WhatsApp melalui lembaran kongsi sistem.
  const shareBtn = root.querySelector("#wa-share");
  let shareSupported = false;
  try {
    shareSupported = Boolean(
      navigator.canShare &&
        navigator.canShare({
          files: [new File([new Blob(["x"], { type: "application/pdf" })], "resit.pdf", { type: "application/pdf" })],
        })
    );
  } catch {
    shareSupported = false;
  }

  if (shareSupported) {
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", async () => {
      shareBtn.disabled = true;
      setWaMsg("muted", "Menyediakan PDF resit...");
      try {
        const blob = await buildReceiptPdfBlob(r);
        const file = new File([blob], receiptPdfName(r), { type: "application/pdf" });
        await navigator.share({ files: [file], text: whatsappText(r), title: receiptPdfName(r) });
        setWaMsg("muted", "");
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error(err);
          setWaMsg("error", 'Perkongsian gagal. Gunakan butang "Muat turun PDF" sebagai ganti.');
        } else {
          setWaMsg("muted", "");
        }
      } finally {
        shareBtn.disabled = false;
      }
    });
  }
}

import { getReceipt } from "./api.js";
import { receiptHtml, whatsappText } from "./receipt-view.js";
import { buildReceiptPdfBlob, downloadReceiptPdf, receiptPdfName } from "./pdf.js";
import { esc } from "../../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../../shared/feedback.js";
import { showStatus } from "../../shared/status.js";

/* Saved receipt.
   The document is the page. Printing and PDF come first because that is what
   the counter actually needs; sharing is secondary. */

// Returns "" (empty), an international number without "+", or null if invalid.
function whatsappNumber(input) {
  let d = input.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("0")) d = `60${d.slice(1)}`;
  else if (!d.startsWith("60")) return null;
  return d.length >= 11 && d.length <= 12 ? d : null;
}

export async function renderReceiptDetail(root, id) {
  root.innerHTML = loadingState("Sedang mendapatkan resit yang disimpan…");

  let r;
  try {
    ({ receipt: r } = await getReceipt(id));
  } catch (err) {
    root.innerHTML = `
      <div class="page-head"><h1>Resit tidak dapat dibuka</h1></div>
      ${readErrorState(err, "Resit", "Cuba buka semula")}
      <p style="margin-top:var(--s4)"><a class="btn secondary" href="#/laporan-koperasi">Kembali ke laporan</a></p>`;
    wireReadRetry(root, () => renderReceiptDetail(root, id));
    return;
  }

  root.innerHTML = `
    <div class="page-head">
      <div class="page-head-row">
        <div>
          <h1>Resit ${esc(r.receiptNo)}</h1>
          <p class="lede">${esc(r.studentNameSnapshot)} · ${esc(r.formerPrimarySchoolSnapshot ?? "")}</p>
        </div>
      </div>
    </div>

    <div class="receipt-toolbar no-print">
      <a class="btn secondary" href="#/laporan-koperasi">← Laporan koperasi</a>
      <a class="btn secondary" href="#/jana-resit${r.studentId ? `?student=${encodeURIComponent(r.studentId)}` : ""}">Resit baharu</a>
      <button class="btn primary" id="print" type="button">Cetak</button>
      <button class="btn secondary" id="pdf" type="button">Muat turun PDF</button>
    </div>
    <p id="pdf-msg" class="err no-print" role="alert" aria-live="assertive"></p>

    <div class="detail-grid">
      <div>${receiptHtml(r)}</div>

      <aside class="no-print">
        <section class="card">
          <h2 style="font-size:1.125rem">Hantar kepada ibu bapa</h2>
          <p class="muted tiny">Mesej ringkasan disediakan automatik. No. IC tidak
            disertakan dan nombor telefon tidak disimpan.</p>

          <div class="field" style="margin-top:var(--s4)">
            <label class="label" for="wa-phone">Nombor WhatsApp <span class="optional">(pilihan)</span></label>
            <input id="wa-phone" class="input" type="tel" placeholder="012-3456789"
                   autocomplete="tel" inputmode="tel">
          </div>

          <label class="choice" style="margin-bottom:var(--s3)">
            <input id="wa-pdf" type="checkbox" checked>
            <span class="choice-body">
              <span class="choice-title">Muat turun PDF juga</span>
              <span class="choice-note">Lampirkan fail itu dalam WhatsApp.</span>
            </span>
          </label>

          <button id="wa" class="btn primary block" type="button">Buka WhatsApp</button>
          <button id="wa-share" class="btn secondary block" type="button" hidden
                  style="margin-top:var(--s2)">Kongsi PDF (peranti ini)</button>

          <p id="wa-msg" class="hint" role="status" aria-live="polite"></p>
        </section>
      </aside>
    </div>`;

  const waMsg = root.querySelector("#wa-msg");
  const waPhone = root.querySelector("#wa-phone");
  const waPdf = root.querySelector("#wa-pdf");
  const setWaMsg = (text, kind = "muted") => {
    waMsg.className = kind === "error" ? "err" : "hint";
    waMsg.textContent = text;
  };

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

  root.querySelector("#wa").addEventListener("click", () => {
    const number = whatsappNumber(waPhone.value);
    if (number === null) {
      setWaMsg("Nombor telefon tidak sah. Gunakan format seperti 012-3456789.", "error");
      waPhone.focus();
      return;
    }

    // Open WhatsApp inside the click handler so pop-up blocking does not apply.
    const url = `https://wa.me/${number}?text=${encodeURIComponent(whatsappText(r))}`;
    window.open(url, "_blank", "noopener");

    if (!waPdf.checked) {
      setWaMsg("");
      return;
    }

    setWaMsg("Menyediakan PDF resit…");
    downloadReceiptPdf(r)
      .then(() => setWaMsg(
        `PDF ${receiptPdfName(r)} telah dimuat turun. Dalam WhatsApp, tekan 📎 → Dokumen untuk melampirkannya.`
      ))
      .catch((err) => {
        console.error(err);
        setWaMsg('PDF gagal dijana. Gunakan butang "Muat turun PDF" di atas.', "error");
      });
  });

  // Direct file sharing on phones that support the Web Share API.
  const shareBtn = root.querySelector("#wa-share");
  let shareSupported = false;
  try {
    shareSupported = Boolean(
      navigator.canShare &&
        navigator.canShare({ files: [new File([new Blob(["x"], { type: "application/pdf" })], "resit.pdf", { type: "application/pdf" })] })
    );
  } catch {
    shareSupported = false;
  }

  if (shareSupported) {
    shareBtn.hidden = false;
    shareBtn.addEventListener("click", async () => {
      shareBtn.disabled = true;
      setWaMsg("Menyediakan PDF resit…");
      try {
        const blob = await buildReceiptPdfBlob(r);
        const file = new File([blob], receiptPdfName(r), { type: "application/pdf" });
        await navigator.share({ files: [file], text: whatsappText(r), title: receiptPdfName(r) });
        setWaMsg("");
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error(err);
          setWaMsg('Perkongsian gagal. Gunakan "Muat turun PDF" sebagai ganti.', "error");
        } else {
          setWaMsg("");
        }
      } finally {
        shareBtn.disabled = false;
      }
    });
  }
}

import { RECEIPT_TITLE } from "./config.js";
import { KOPERASI_NAME, KOPERASI_ADDRESS, KOPERASI_TEL, LOGO_URL } from "../../shared/koperasi.js";
import { formatAmount } from "../../shared/money.js";
import { formatDateTime } from "../../shared/dom.js";
import { paymentLabel } from "./constants.js";

// Fon asas PDF hanya menyokong aksara Latin. Aksara lain digantikan dengan "?".
const safe = (v) =>
  String(v ?? "")
    .replace(/[\u00a0\u202f\u2009]/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

// jsPDF tidak menyokong SVG terus. Tukar logo kepada PNG melalui canvas.
async function logoDataUrl(url, size = 512) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = () => reject(new Error("logo gagal dimuat"));
    img.src = url;
  });
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  canvas.getContext("2d").drawImage(img, 0, 0, size, size);
  return canvas.toDataURL("image/png");
}

export async function downloadReceiptPdf(r) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;
  const right = W - M;

  // Fon: Times New Roman untuk nama koperasi & kepala resit; Helvetica untuk
  // semua teks dan nombor yang lain.
  const TIMES = "times";
  const SANS = "helvetica";
  const text = (value, x, yy, opts) => doc.text(safe(value), x, yy, opts);

  /* ----- Kepala: logo + maklumat koperasi ----- */
  const logoSize = 18;
  let textX = M;
  try {
    const png = await logoDataUrl(LOGO_URL);
    doc.addImage(png, "PNG", M, 11, logoSize, logoSize);
    textX = M + logoSize + 4;
  } catch {
    /* logo tidak wajib */
  }

  doc.setFont(TIMES, "bold");
  doc.setFontSize(12);
  doc.setTextColor(0);
  text(KOPERASI_NAME, textX, 17.5);
  doc.setFont(SANS, "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(90);
  text(KOPERASI_ADDRESS, textX, 23);
  text(`No. Tel: ${KOPERASI_TEL}`, textX, 27);

  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(M, 33, right, 33);

  /* ----- Tajuk ----- */
  doc.setFont(TIMES, "bold");
  doc.setFontSize(13);
  doc.setTextColor(0);
  text(RECEIPT_TITLE.toUpperCase(), W / 2, 41, { align: "center" });
  doc.setLineWidth(0.2);
  doc.line(M, 45, right, 45);
  let y = 52;

  /* ----- Maklumat: label kiri, nilai kanan ----- */
  const meta = (label, value) => {
    doc.setFont(SANS, "normal");
    doc.setFontSize(9);
    doc.setTextColor(100);
    text(label, M, y);
    doc.setFont(SANS, "bold");
    doc.setTextColor(0);
    const lines = doc.splitTextToSize(safe(value), 85);
    doc.text(lines, right, y, { align: "right" });
    y += 5 * lines.length + 1;
  };
  meta("No. Resit", r.receiptNo);
  meta("Tarikh", formatDateTime(r.createdAt));
  meta("Nama Murid", r.studentNameSnapshot);
  y += 2;

  /* ----- Jadual item (lajur seimbang) ----- */
  const contentW = right - M;
  const itemW = contentW * 0.5;
  const colQty = M + contentW * 0.64;
  const colPrice = M + contentW * 0.82;
  const header = () => {
    doc.setFont(SANS, "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    text("Item", M, y);
    text("Kuantiti", colQty, y, { align: "right" });
    text("Harga (RM)", colPrice, y, { align: "right" });
    text("Jumlah (RM)", right, y, { align: "right" });
    y += 1.5;
    doc.setLineWidth(0.2);
    doc.line(M, y, right, y);
    y += 5;
  };
  header();

  for (const i of r.items) {
    const variant = i.variant ?? i.size;
    const label = `${i.itemNameSnapshot}${variant ? ` (${variant})` : ""}`;
    doc.setFont(SANS, "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(safe(label), itemW);
    const h = lines.length * 4.5 + 1.5;
    if (y + h > H - 40) {
      doc.addPage();
      y = M + 6;
      header();
      doc.setFont(SANS, "normal");
      doc.setFontSize(9);
    }
    doc.setTextColor(0);
    doc.text(lines, M, y);
    doc.setFont(SANS, "normal");
    text(String(i.quantity), colQty, y, { align: "right" });
    text(formatAmount(i.unitPriceSen), colPrice, y, { align: "right" });
    text(formatAmount(i.subtotalSen), right, y, { align: "right" });
    y += h;
  }

  if (y > H - 40) {
    doc.addPage();
    y = M + 6;
  }
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.line(M, y, right, y);
  y += 6;
  doc.setFont(SANS, "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(0);
  text("Jumlah Keseluruhan", M, y);
  text(formatAmount(r.totalSen), right, y, { align: "right" });
  y += 10;

  meta("Kaedah Pembayaran", paymentLabel(r.paymentMethod));
  if (r.bankRef) meta("No. Rujukan", r.bankRef);

  y += 4;
  doc.setFont(SANS, "italic");
  doc.setFontSize(10);
  doc.setTextColor(0);
  text("Terima kasih.", W / 2, y, { align: "center" });

  doc.save(`Resit-${String(r.receiptNo).replace(/[^A-Za-z0-9_-]/g, "")}.pdf`);
}

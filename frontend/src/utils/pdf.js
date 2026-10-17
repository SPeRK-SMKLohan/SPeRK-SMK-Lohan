import { SCHOOL_NAME, RECEIPT_TITLE } from "../config.js";
import { formatRM } from "./money.js";
import { formatDateTime, paymentLabel } from "./dom.js";

// Fon asas PDF hanya menyokong aksara Latin. Aksara lain digantikan dengan "?".
const safe = (v) =>
  String(v ?? "")
    .replace(/[\u00a0\u202f\u2009]/g, " ")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");

export async function downloadReceiptPdf(r) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a5" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 12;
  const right = W - M;
  let y = 18;

  const text = (value, x, yy, opts) => doc.text(safe(value), x, yy, opts);

  // Tajuk
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(0);
  text(RECEIPT_TITLE, W / 2, y, { align: "center" });
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  text(SCHOOL_NAME, W / 2, y, { align: "center" });
  doc.setTextColor(0);
  y += 4;
  doc.line(M, y, right, y);
  y += 7;

  // Baris maklumat: label di kiri, nilai di kanan (nilai panjang dibungkus)
  const meta = (label, value) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(safe(value), 80);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100);
    text(label, M, y);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(lines, right, y, { align: "right" });
    y += 5 * lines.length + 1;
  };
  meta("No. Resit", r.receiptNo);
  meta("Tarikh", formatDateTime(r.createdAt));
  meta("Nama Murid", r.studentNameSnapshot);
  y += 2;

  // Jadual item
  const colQty = 92;
  const colPrice = 115;
  const header = () => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    text("Item", M, y);
    text("Kuantiti", colQty, y, { align: "right" });
    text("Harga", colPrice, y, { align: "right" });
    text("Jumlah", right, y, { align: "right" });
    y += 2;
    doc.line(M, y, right, y);
    y += 5;
  };
  header();

  for (const i of r.items) {
    const label = `${i.itemNameSnapshot}${i.size ? ` (${i.size})` : ""}`;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(safe(label), 60);
    const h = lines.length * 4.5 + 1.5;
    if (y + h > H - 45) {
      doc.addPage();
      y = M + 6;
      header();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }
    doc.text(lines, M, y);
    text(String(i.quantity), colQty, y, { align: "right" });
    text(formatRM(i.unitPriceSen), colPrice, y, { align: "right" });
    text(formatRM(i.subtotalSen), right, y, { align: "right" });
    y += h;
  }

  // Jumlah keseluruhan
  if (y > H - 45) {
    doc.addPage();
    y = M + 6;
  }
  doc.line(M, y, right, y);
  y += 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  text("Jumlah Keseluruhan", M, y);
  text(formatRM(r.totalSen), right, y, { align: "right" });
  y += 9;

  meta("Kaedah Pembayaran", paymentLabel(r.paymentMethod));
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  text("Terima kasih.", W / 2, y, { align: "center" });

  doc.save(`Resit-${String(r.receiptNo).replace(/[^A-Za-z0-9_-]/g, "")}.pdf`);
}
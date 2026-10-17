import { schools } from "../data/constants.js";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 2000;

const norm = (s) => String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

// Nama lajur yang diterima (selepas membuang huruf besar, titik dan ruang).
const HEADER_ALIASES = {
  name: ["namamurid", "nama"],
  icNumber: ["noic", "ic", "nokp", "nokadpengenalan"],
  school: ["sekolahrendahasal", "sekolahrendah", "sekolah"],
};
const HEADER_LABELS = { name: "Nama Murid", icNumber: "No. IC", school: "Sekolah Rendah Asal" };

function cellToText(v) {
  if (v === null || v === undefined) return "";
  return String(v).trim();
}

export async function parseStudentsFile(file) {
  if (!/\.xlsx$/i.test(file.name)) throw new Error("Sila pilih fail .xlsx.");
  if (file.size > MAX_FILE_BYTES) throw new Error("Fail terlalu besar (maksimum 2 MB).");

  const XLSX = await import("xlsx");

  let workbook;
  try {
    workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  } catch {
    throw new Error("Fail tidak dapat dibaca. Pastikan ia fail Excel .xlsx yang sah.");
  }

  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet || !sheet["!ref"]) throw new Error("Fail kosong.");
  const startRow = XLSX.utils.decode_range(sheet["!ref"]).s.r;

  // raw: true supaya IC yang disimpan sebagai nombor tidak bertukar kepada format saintifik.
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" });

  const headers = (data[0] ?? []).map(norm);
  const col = {};
  for (const [key, aliases] of Object.entries(HEADER_ALIASES)) {
    col[key] = headers.findIndex((h) => aliases.includes(h));
  }
  const missing = Object.keys(col).filter((k) => col[k] < 0).map((k) => HEADER_LABELS[k]);
  if (missing.length) {
    throw new Error(
      `Lajur tidak dijumpai: ${missing.join(", ")}. Baris pertama mesti mengandungi: Nama Murid, No. IC, Sekolah Rendah Asal.`
    );
  }

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const name = cellToText(r[col.name]);
    const icNumber = cellToText(r[col.icNumber]);
    const school = cellToText(r[col.school]);
    if (!name && !icNumber && !school) continue; // langkau baris kosong
    rows.push({ row: startRow + i + 1, name, icNumber, school }); // nombor baris Excel
  }

  if (!rows.length) throw new Error("Tiada data murid dalam fail.");
  if (rows.length > MAX_ROWS) {
    throw new Error(`Terlalu banyak baris (maksimum ${MAX_ROWS} setiap import). Pecahkan fail kepada beberapa bahagian.`);
  }
  return rows;
}

export async function downloadStudentTemplate() {
  const XLSX = await import("xlsx");

  const sheet = XLSX.utils.aoa_to_sheet([["Nama Murid", "No. IC", "Sekolah Rendah Asal"]]);
  sheet["!cols"] = [{ wch: 35 }, { wch: 18 }, { wch: 25 }];

  const guide = XLSX.utils.aoa_to_sheet([
    ["Panduan"],
    ["1. Isi data pada helaian 'Murid', satu murid setiap baris. Jangan ubah baris pertama."],
    ["2. No. IC mesti 12 digit, dengan atau tanpa tanda sempang. Contoh: 140512-12-1234 atau 140512121234."],
    ["3. Format lajur No. IC sebagai Text supaya sifar di hadapan tidak hilang."],
    ["4. Sekolah Rendah Asal mesti salah satu daripada senarai berikut:"],
    ...schools.map((s) => [s]),
    ["5. Murid yang sudah ada dalam sistem (IC sama) akan dilangkau."],
  ]);
  guide["!cols"] = [{ wch: 100 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Murid");
  XLSX.utils.book_append_sheet(book, guide, "Panduan");
  XLSX.writeFile(book, "templat-murid.xlsx");
}
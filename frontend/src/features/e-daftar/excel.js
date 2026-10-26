import { schools } from "./constants.js";

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_ROWS = 2000;

// Buang penanda "(wajib)"/"(pilihan)" pada kepala lajur templat supaya
// padanan nama lajur kekal berfungsi.
const norm = (s) =>
  String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "").replace(/(wajib|pilihan)$/, "");

// Nama lajur yang diterima (selepas membuang huruf besar, titik dan ruang).
const HEADER_ALIASES = {
  name: ["namamurid", "nama"],
  icNumber: ["noic", "ic", "nokp", "nokadpengenalan"],
  school: ["sekolahrendahasal", "sekolahrendah", "sekolah"],
  tingkatan: ["tingkatan", "kelas", "ting"],
  oku: ["statusoku", "oku", "okukah"],
  registrationStatus: ["statusdaftar", "statuspendaftaran", "daftar", "kehadiran"],
  transferSchool: ["sekolahdipohon", "namasekolahdipohon", "sekolahbaharu"],
  transferReason: ["sebab", "sebabpenempatansemula", "sebabpermohonan"],
  transferNotes: ["catatan", "catatanpenempatansemula", "nota"],
  motherPhone: ["notelibu", "telefonibu", "nombortelefonibu"],
  fatherPhone: ["notelbapa", "telefonbapa", "nombortelefonbapa"],
};

const HEADER_LABELS = {
  name: "Nama Murid (wajib)",
  icNumber: "No. IC (wajib)",
  school: "Sekolah Rendah Asal (wajib)",
  tingkatan: "Tingkatan (pilihan)",
  oku: "Status OKU (pilihan)",
  registrationStatus: "Status Daftar (pilihan)",
  transferSchool: "Sekolah Dipohon (pilihan)",
  transferReason: "Sebab Penempatan Semula (pilihan)",
  transferNotes: "Catatan (pilihan)",
  motherPhone: "No Tel. Ibu (pilihan)",
  fatherPhone: "No Tel. Bapa (pilihan)",
};

// Hanya lajur ini wajib ada dalam fail. Selebihnya pilihan.
const REQUIRED_COLUMNS = ["name", "icNumber", "school"];

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
  const missing = REQUIRED_COLUMNS.filter((k) => col[k] < 0).map((k) => HEADER_LABELS[k]);
  if (missing.length) {
    throw new Error(
      `Lajur tidak dijumpai: ${missing.join(", ")}. Baris pertama mesti mengandungi sekurang-kurangnya: Nama Murid, No. IC, Sekolah Rendah Asal.`
    );
  }

  const cell = (r, key) => (col[key] < 0 ? "" : cellToText(r[col[key]]));

  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    const row = {
      row: startRow + i + 1, // nombor baris Excel
      name: cell(r, "name"),
      icNumber: cell(r, "icNumber"),
      school: cell(r, "school"),
      tingkatan: cell(r, "tingkatan"),
      oku: cell(r, "oku"),
      registrationStatus: cell(r, "registrationStatus"),
      transferSchool: cell(r, "transferSchool"),
      transferReason: cell(r, "transferReason"),
      transferNotes: cell(r, "transferNotes"),
      motherPhone: cell(r, "motherPhone"),
      fatherPhone: cell(r, "fatherPhone"),
    };
    if (!row.name && !row.icNumber && !row.school) continue; // langkau baris kosong
    rows.push(row);
  }

  if (!rows.length) throw new Error("Tiada data murid dalam fail.");
  if (rows.length > MAX_ROWS) {
    throw new Error(`Terlalu banyak baris (maksimum ${MAX_ROWS} setiap import). Pecahkan fail kepada beberapa bahagian.`);
  }
  return rows;
}

export async function downloadStudentTemplate() {
  const XLSX = await import("xlsx");

  const headers = Object.keys(HEADER_ALIASES).map((k) => HEADER_LABELS[k]);
  const sheet = XLSX.utils.aoa_to_sheet([headers]);
  sheet["!cols"] = [
    { wch: 35 }, { wch: 18 }, { wch: 22 }, { wch: 10 }, { wch: 11 },
    { wch: 14 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 20 }, { wch: 20 },
  ];

  const guide = XLSX.utils.aoa_to_sheet([
    ["Panduan import data murid (SPeRK SMK Lohan)"],
    [""],
    ["1. Isi data pada helaian 'Murid', satu murid setiap baris. Jangan ubah baris pertama."],
    ["2. Lajur bertanda (wajib) mesti diisi; lajur bertanda (pilihan) boleh dikosongkan."],
    ["3. No. IC mesti 12 digit, dengan atau tanpa tanda sempang. Contoh: 140512-12-1234 atau 140512121234."],
    ["4. Format lajur No. IC sebagai Text supaya sifar di hadapan tidak hilang."],
    [""],
    ["Sistem ini menerima murid Tingkatan 1 sahaja. Jika lajur Tingkatan dikosongkan, murid dianggap Tingkatan 1."],
    ["Status OKU: 'Ya' atau 'Tidak'."],
    ["Status Daftar: 'Sudah daftar' atau 'Belum daftar'. Kosong dianggap belum daftar."],
    ["Penempatan semula: isi Sekolah Dipohon, Sebab dan Catatan jika berkenaan."],
    [""],
    ["Sekolah Rendah Asal mesti salah satu daripada senarai berikut:"],
    ...schools.map((s) => [s]),
    [""],
    ["Murid yang sudah ada dalam sistem (IC sama) akan dilangkau, tidak diganti."],
  ]);
  guide["!cols"] = [{ wch: 100 }];

  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, "Murid");
  XLSX.utils.book_append_sheet(book, guide, "Panduan");
  XLSX.writeFile(book, "templat-murid.xlsx");
}

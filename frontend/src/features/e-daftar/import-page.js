import { importStudents } from "./api.js";
import { parseStudentsFile, downloadStudentTemplate } from "./excel.js";
import { esc, maskIC } from "../../shared/dom.js";

const STATUS_LABEL = {
  invalid: "Tidak sah",
  duplicate_in_file: "Pendua dalam fail",
  duplicate_existing: "Sudah wujud",
};

const STATUS_CLASS = {
  invalid: "bad",
  duplicate_in_file: "warn",
  duplicate_existing: "warn",
};

const EMPTY_BOX = `<p class="muted">Pilih fail Excel untuk memulakan pratonton semakan di sini.</p>`;

export function renderImportData(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Import Data</h1>
      <p>Muat naik senarai murid daripada fail Excel (.xlsx). Gunakan halaman ini
        sebelum hari pendaftaran untuk menyediakan senarai murid dalam sistem.</p>
    </div>

    <div class="import-layout">
      <section class="card">
        <h2>Fail murid</h2>
        <p class="muted">Lajur wajib: <strong>Nama Murid</strong>, <strong>No. IC</strong> dan
          <strong>Sekolah Rendah Asal</strong>. Lajur pilihan: <strong>Tingkatan</strong>,
          <strong>Status OKU</strong>, <strong>Status Daftar</strong>, <strong>Sekolah Dipohon</strong>,
          <strong>Sebab Penempatan Semula</strong> dan <strong>Catatan</strong>.</p>
        <p class="muted">Murid yang sudah wujud (IC sama) dilangkau, tidak diganti.</p>
        <div class="toolbar">
          <input id="file" class="input" type="file" accept=".xlsx">
          <button id="template" class="btn small" type="button">Muat turun templat</button>
        </div>
        <p class="muted">Selepas import, buka <a href="#/pendaftaran">e-Daftar</a> untuk menanda status
          daftar murid pada hari pendaftaran.</p>
      </section>

      <section class="card">
        <h2>Pratonton semakan</h2>
        <div id="import-box">${EMPTY_BOX}</div>
      </section>
    </div>`;

  const fileInput = root.querySelector("#file");
  const importBox = root.querySelector("#import-box");
  let pendingRows = null;

  const pill = (cls, count, label) =>
    `<span class="pill ${cls}"><strong>${count}</strong><span>${label}</span></span>`;

  function resetImport() {
    pendingRows = null;
    fileInput.value = "";
    importBox.innerHTML = EMPTY_BOX;
  }

  function renderPreview(rows, result) {
    const s = result.summary;
    const byRow = new Map(rows.map((r) => [r.row, r]));
    const shown = result.problems.slice(0, 50);
    const hidden = s.invalid + s.duplicateInFile + s.duplicateExisting - shown.length;

    importBox.innerHTML = `
      <div class="import-summary">
        ${pill("", s.total, "baris dibaca")}
        ${pill("ok", s.valid, "sah")}
        ${pill(s.invalid ? "bad" : "", s.invalid, "tidak sah")}
        ${pill(s.duplicateInFile ? "warn" : "", s.duplicateInFile, "pendua dalam fail")}
        ${pill(s.duplicateExisting ? "warn" : "", s.duplicateExisting, "sudah wujud")}
      </div>
      ${shown.length ? `
        <div class="table-wrap"><table class="table compact">
          <thead><tr><th>Baris</th><th>Nama</th><th>No. IC</th><th>Status</th><th>Sebab</th></tr></thead>
          <tbody>${shown.map((p) => {
            const r = byRow.get(p.row);
            return `<tr>
              <td>${esc(p.row)}</td>
              <td>${esc(r?.name ?? "")}</td>
              <td>${esc(maskIC(r?.icNumber ?? ""))}</td>
              <td><span class="badge ${STATUS_CLASS[p.status] ?? ""}">${esc(STATUS_LABEL[p.status] ?? p.status)}</span></td>
              <td>${esc(p.reason)}</td>
            </tr>`;
          }).join("")}</tbody>
        </table></div>` : ""}
      ${hidden > 0 ? `<p class="muted">Dan ${hidden} baris bermasalah lain tidak dipaparkan.</p>` : ""}
      <p class="muted">Hanya baris yang sah akan diimport. Baris bermasalah dilangkau.</p>
      <div class="toolbar">
        <button id="confirm-import" class="btn primary" type="button" ${s.valid ? "" : "disabled"}>Import ${s.valid} murid</button>
        <button id="cancel-import" class="btn" type="button">Batal</button>
      </div>
      <p id="import-msg" class="error"></p>`;

    importBox.querySelector("#cancel-import").addEventListener("click", resetImport);

    const confirmBtn = importBox.querySelector("#confirm-import");
    confirmBtn.addEventListener("click", async () => {
      const msg = importBox.querySelector("#import-msg");
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Mengimport...";
      msg.textContent = "";
      try {
        const done = await importStudents(pendingRows, false);
        renderDone(done);
        pendingRows = null;
        fileInput.value = "";
      } catch (err) {
        msg.textContent = err.message;
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Import ${s.valid} murid`;
      }
    });
  }

  function renderDone(done) {
    const s = done.summary;
    importBox.innerHTML = `
      <p class="notice ok"><strong>Import selesai.</strong> ${done.imported} murid ditambah.
      ${s.invalid + s.duplicateInFile + s.duplicateExisting} baris dilangkau
      (${s.invalid} tidak sah, ${s.duplicateInFile + s.duplicateExisting} pendua).
      Buka <a href="#/pendaftaran">e-Daftar</a> untuk menyemak senarai murid.</p>`;
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    pendingRows = null;
    importBox.innerHTML = "";
    if (!file) {
      importBox.innerHTML = EMPTY_BOX;
      return;
    }

    importBox.innerHTML = `<p class="muted">Membaca dan menyemak fail...</p>`;
    try {
      const rows = await parseStudentsFile(file);
      const result = await importStudents(rows, true); // pratonton sahaja, tiada data disimpan
      pendingRows = rows;
      renderPreview(rows, result);
    } catch (err) {
      importBox.innerHTML = `<p class="error">${esc(err.message)}</p>`;
    }
  });

  root.querySelector("#template").addEventListener("click", () => {
    downloadStudentTemplate().catch(() => {
      importBox.innerHTML = `<p class="error">Templat gagal dijana. Sila cuba lagi.</p>`;
    });
  });
}

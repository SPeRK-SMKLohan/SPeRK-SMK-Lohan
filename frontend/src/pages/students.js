import { schools } from "../data/constants.js";
import { searchStudents, importStudents } from "../services.js";
import { parseStudentsFile, downloadStudentTemplate } from "../utils/excel.js";
import { esc, maskIC } from "../utils/dom.js";

const STATUS_LABEL = {
  invalid: "Tidak sah",
  duplicate_in_file: "Pendua dalam fail",
  duplicate_existing: "Sudah wujud",
};

export function renderStudents(root) {
  root.innerHTML = `
    <h1>Murid</h1>

    <section class="card">
      <h2>Import dari Excel</h2>
      <p class="muted">Fail .xlsx dengan lajur <strong>Nama Murid</strong>, <strong>No. IC</strong> dan
        <strong>Sekolah Rendah Asal</strong>. Murid yang sudah wujud (IC sama) dilangkau, tidak diganti.</p>
      <div class="toolbar">
        <input id="file" class="input" type="file" accept=".xlsx">
        <button id="template" class="btn small" type="button">Muat turun templat</button>
      </div>
      <div id="import-box"></div>
    </section>

    <p class="notice">No. IC dipaparkan separa.</p>
    <div class="toolbar">
      <input id="q" class="input" type="search" placeholder="Cari nama atau no. IC">
      <select id="school" class="input">
        <option value="">Semua sekolah rendah</option>
        ${schools.map((s) => `<option>${esc(s)}</option>`).join("")}
      </select>
    </div>
    <p id="count" class="muted"></p>
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Nama Murid</th><th>No. IC</th><th>Sekolah Rendah Asal</th></tr></thead>
      <tbody id="rows"></tbody>
    </table></div>`;

  const q = root.querySelector("#q");
  const school = root.querySelector("#school");
  const countEl = root.querySelector("#count");
  const rowsEl = root.querySelector("#rows");
  const fileInput = root.querySelector("#file");
  const importBox = root.querySelector("#import-box");
  let pendingRows = null;
  let seq = 0;
  let timer;

  /* ----- Senarai murid ----- */
  async function update() {
    const mine = ++seq;
    countEl.textContent = "Memuatkan...";
    try {
      const { students, total } = await searchStudents(q.value.trim(), { school: school.value, limit: 100 });
      if (mine !== seq) return;
      countEl.textContent = total > students.length
        ? `Menunjukkan ${students.length} daripada ${total} murid`
        : `${total} murid`;
      rowsEl.innerHTML = students.map((s) => `
        <tr>
          <td>${esc(s.name)}</td>
          <td>${esc(s.icMasked)}</td>
          <td>${esc(s.formerPrimarySchool)}</td>
        </tr>`).join("") || `<tr><td colspan="3" class="muted">Tiada padanan.</td></tr>`;
    } catch (err) {
      if (mine !== seq) return;
      countEl.textContent = "";
      rowsEl.innerHTML = `<tr><td colspan="3" class="error">${esc(err.message)}</td></tr>`;
    }
  }

  q.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(update, 300);
  });
  school.addEventListener("change", update);

  /* ----- Import Excel ----- */
  const pill = (cls, label) => `<span class="pill ${cls}">${esc(label)}</span>`;

  function resetImport() {
    pendingRows = null;
    fileInput.value = "";
    importBox.innerHTML = "";
  }

  function renderPreview(rows, result) {
    const s = result.summary;
    const byRow = new Map(rows.map((r) => [r.row, r]));
    const shown = result.problems.slice(0, 50);
    const hidden = s.invalid + s.duplicateInFile + s.duplicateExisting - shown.length;

    importBox.innerHTML = `
      <div class="import-summary">
        ${pill("", `${s.total} baris dibaca`)}
        ${pill("ok", `${s.valid} sah`)}
        ${pill(s.invalid ? "bad" : "", `${s.invalid} tidak sah`)}
        ${pill(s.duplicateInFile ? "warn" : "", `${s.duplicateInFile} pendua dalam fail`)}
        ${pill(s.duplicateExisting ? "warn" : "", `${s.duplicateExisting} sudah wujud`)}
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
              <td>${esc(STATUS_LABEL[p.status] ?? p.status)}</td>
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
        update();
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
      <p class="notice"><strong>Import selesai.</strong> ${done.imported} murid ditambah.
      ${s.invalid + s.duplicateInFile + s.duplicateExisting} baris dilangkau
      (${s.invalid} tidak sah, ${s.duplicateInFile + s.duplicateExisting} pendua).</p>`;
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    pendingRows = null;
    importBox.innerHTML = "";
    if (!file) return;

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

  update();
}
import { importStudents } from "./api.js";
import { parseStudentsFile, downloadStudentTemplate } from "./excel.js";
import { esc, maskIC } from "../../shared/dom.js";
import { loadingState } from "../../shared/feedback.js";

/* Import roster.
   Three numbered steps, in the order staff actually do them: get the template,
   fill it, bring it back. The preview is the review step, so it sits below. */

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

const EMPTY_BOX = `<p class="muted">Pilih fail Excel untuk melihat semakan di sini.</p>`;

export function renderImportData(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Import senarai murid</h1>
      <p class="lede">Muat naik senarai murid daripada fail Excel sebelum hari
        pendaftaran, supaya guru hanya perlu mencari dan menanda kehadiran.</p>
    </div>

    <div class="import-grid">
      <section class="card">
        <h2 style="display:flex;gap:var(--s3);align-items:center">
          <span class="step-num">1</span> Muat turun templat
        </h2>
        <p class="muted tiny" style="margin-left:calc(34px + var(--s3))">
          Templat mengandungi lajur yang betul dan satu helaian panduan.
        </p>
        <button id="template" class="btn secondary block" type="button">Muat turun templat Excel</button>
      </section>

      <section class="card">
        <h2 style="display:flex;gap:var(--s3);align-items:center">
          <span class="step-num">2</span> Pilih fail yang telah diisi
        </h2>
        <div class="file-drop" style="margin-top:var(--s3)">
          <label class="label" for="file" style="margin-bottom:0">Fail Excel (.xlsx)</label>
          <input id="file" type="file" accept=".xlsx" aria-describedby="file-help">
          <p class="hint" id="file-help" style="margin:0">
            Maksimum 2 MB dan 2,000 baris. Murid yang sudah wujud (No. IC sama)
            akan dilangkau, bukan diganti.
          </p>
        </div>
      </section>
    </div>

    <section class="card" style="margin-top:var(--s4)">
      <h2 style="display:flex;gap:var(--s3);align-items:center">
        <span class="step-num">3</span> Semak, kemudian import
      </h2>
      <div id="import-box">${EMPTY_BOX}</div>
    </section>`;

  const fileInput = root.querySelector("#file");
  const importBox = root.querySelector("#import-box");
  let pendingRows = null;

  const pill = (cls, count, label) =>
    `<span class="pill ${cls}">${count} ${label}</span>`;

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
      <div class="summary-pills">
        ${pill("", s.total, "baris dibaca")}
        ${pill("ok", s.valid, "sah")}
        ${pill(s.invalid ? "bad" : "", s.invalid, "tidak sah")}
        ${pill(s.duplicateInFile ? "warn" : "", s.duplicateInFile, "pendua dalam fail")}
        ${pill(s.duplicateExisting ? "warn" : "", s.duplicateExisting, "sudah wujud")}
      </div>

      ${shown.length ? `
        <div class="table-wrap" style="margin-bottom:var(--s4)">
          <table class="table">
            <caption class="sr-only">Baris fail yang memerlukan semakan</caption>
            <thead>
              <tr>
                <th scope="col">Baris</th>
                <th scope="col">Nama</th>
                <th scope="col">No. IC</th>
                <th scope="col">Status</th>
                <th scope="col">Sebab</th>
              </tr>
            </thead>
            <tbody>
              ${shown.map((p) => {
                const r = byRow.get(p.row);
                return `<tr>
                  <td>${esc(p.row)}</td>
                  <td>${esc(String(r?.name ?? "").toUpperCase())}</td>
                  <td class="num">${esc(maskIC(r?.icNumber ?? ""))}</td>
                  <td><span class="pill ${STATUS_CLASS[p.status] ?? ""}">${esc(STATUS_LABEL[p.status] ?? p.status)}</span></td>
                  <td>${esc(p.reason)}</td>
                </tr>`;
              }).join("")}
            </tbody>
          </table>
        </div>` : ""}

      ${hidden > 0 ? `<p class="muted tiny">Dan ${hidden} baris bermasalah lain tidak dipaparkan.</p>` : ""}
      <p class="muted tiny">Hanya baris yang sah akan diimport. Baris bermasalah dilangkau.</p>

      <div class="cluster" style="margin-top:var(--s4)">
        <button id="confirm-import" class="btn primary lg" type="button"${s.valid ? "" : " disabled"}>
          Import ${s.valid} murid
        </button>
        <button id="cancel-import" class="btn secondary" type="button">Batal</button>
      </div>
      <div id="import-msg" role="alert" aria-live="assertive"></div>`;

    importBox.querySelector("#cancel-import").addEventListener("click", resetImport);

    const confirmBtn = importBox.querySelector("#confirm-import");
    confirmBtn.addEventListener("click", async () => {
      const msg = importBox.querySelector("#import-msg");
      confirmBtn.disabled = true;
      confirmBtn.textContent = "Mengimport…";
      msg.innerHTML = "";
      try {
        const done = await importStudents(pendingRows, false);
        renderDone(done);
        pendingRows = null;
        fileInput.value = "";
      } catch (err) {
        msg.innerHTML = `<p class="err"></p>`;
        msg.querySelector(".err").textContent = err.message;
        confirmBtn.disabled = false;
        confirmBtn.textContent = `Import ${s.valid} murid`;
      }
    });
  }

  function renderDone(done) {
    const s = done.summary;
    importBox.innerHTML = `
      <div class="status ok" role="status" aria-live="polite">
        <div class="status-body">
          <strong class="status-title">Import selesai</strong>
          <span class="status-text">${done.imported} murid ditambah.
            ${s.invalid + s.duplicateInFile + s.duplicateExisting} baris dilangkau
            (${s.invalid} tidak sah, ${s.duplicateInFile + s.duplicateExisting} pendua).</span>
          <div class="status-actions">
            <a class="btn secondary sm" href="#/pendaftaran">Buka pendaftaran</a>
          </div>
        </div>
      </div>`;
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    pendingRows = null;
    importBox.innerHTML = "";
    if (!file) {
      importBox.innerHTML = EMPTY_BOX;
      return;
    }

    importBox.innerHTML = loadingState("Membaca fail dan menyemak data. Sila tunggu…");
    try {
      const rows = await parseStudentsFile(file);
      const result = await importStudents(rows, true); // preview only, nothing saved
      pendingRows = rows;
      renderPreview(rows, result);
    } catch (err) {
      importBox.innerHTML = `<div class="status bad" role="alert">
        <div class="status-body">
          <strong class="status-title">Fail tidak dapat dibaca</strong>
          <span class="status-text"></span>
        </div>
      </div>`;
      importBox.querySelector(".status-text").textContent = err.message;
    }
  });

  root.querySelector("#template").addEventListener("click", () => {
    downloadStudentTemplate().catch(() => {
      importBox.innerHTML = `<div class="fail" role="alert">
        <strong class="fail-title">Templat tidak dapat dimuat turun</strong>
        <span class="fail-text">Cuba jana templat sekali lagi.</span>
        <button class="btn secondary" type="button" data-retry-template>Cuba lagi</button>
      </div>`;
      importBox.querySelector("[data-retry-template]").addEventListener("click", () => {
        root.querySelector("#template").click();
      });
    });
  });
}

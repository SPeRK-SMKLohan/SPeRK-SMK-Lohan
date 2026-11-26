import { importStudents } from "./api.js";
import { parseStudentsFile, downloadStudentTemplate } from "./excel.js";
import { esc, maskIC } from "../../shared/dom.js";
import { loadingState, inlineError } from "../../shared/feedback.js";

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

const EMPTY_BOX = `<p class="muted">Pilih fail Excel untuk semakan.</p>`;

export function renderImportData(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Import senarai murid</h1>
      <p class="lede">Muat naik fail Excel untuk menambah murid Tingkatan 1 sekaligus.</p>
    </div>

    <div class="import-grid">
      <section class="card">
        <h2 class="step-head"><span class="step-num">1</span> Templat</h2>
        <p class="step-note">Muat turun fail contoh, isi, kemudian bawa kembali.</p>
        <button id="template" class="btn secondary block" type="button">Muat turun templat</button>
      </section>

      <section class="card">
        <h2 class="step-head"><span class="step-num">2</span> Pilih fail</h2>
        <p class="step-note">Fail Excel (.xlsx) yang sudah diisi.</p>
        <div class="file-drop">
          <input id="file" class="sr-only" type="file" accept=".xlsx"
                 aria-label="Pilih fail Excel senarai murid" aria-describedby="file-help">
          <label class="btn secondary file-drop-btn" for="file">Pilih fail</label>
          <span class="file-drop-name" id="file-name">Tiada fail dipilih</span>
          <p class="hint" id="file-help">
            Maksimum 2 MB dan 2,000 baris. Murid yang sudah wujud (No. IC sama)
            akan dilangkau, bukan diganti.
          </p>
        </div>
      </section>
    </div>

    <section class="card">
      <h2 class="step-head"><span class="step-num">3</span> Semak dan import</h2>
      <div id="import-box">${EMPTY_BOX}</div>
    </section>`;

  const fileInput = root.querySelector("#file");
  const importBox = root.querySelector("#import-box");
  const fileName = root.querySelector("#file-name");
  let pendingRows = null;

  const pill = (cls, count, label) =>
    `<span class="pill ${cls}">${count} ${label}</span>`;

  function resetImport() {
    pendingRows = null;
    fileInput.value = "";
    fileName.textContent = "Tiada fail dipilih";
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
        <div class="table-wrap mb-s4">
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

      ${hidden > 0 ? `<p class="muted tiny">${hidden} lagi tidak dipaparkan.</p>` : ""}
      <p class="muted tiny">Baris tidak sah atau pendua akan dilangkau.</p>

      <div class="cluster mt-s4">
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
        fileName.textContent = "Tiada fail dipilih";
        fileName.classList.remove("has-file");
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
          <span class="status-text">${done.imported} murid ditambah; ${s.invalid + s.duplicateInFile + s.duplicateExisting} baris dilangkau
            (${s.invalid} tidak sah, ${s.duplicateInFile + s.duplicateExisting} pendua).</span>
          <div class="status-actions">
            <a class="btn secondary sm" href="#/pendaftaran">Buka pendaftaran</a>
          </div>
        </div>
      </div>`;
  }

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files[0];
    // The browser's own file control speaks the browser's language, not the
    // school's, so the chosen name is echoed here instead.
    fileName.textContent = file ? file.name : "Tiada fail dipilih";
    fileName.classList.toggle("has-file", Boolean(file));
    pendingRows = null;
    importBox.innerHTML = "";
    if (!file) {
      importBox.innerHTML = EMPTY_BOX;
      return;
    }

    importBox.innerHTML = loadingState("Menyemak fail…");
    try {
      const rows = await parseStudentsFile(file);
      const result = await importStudents(rows, true); // preview only, nothing saved
      pendingRows = rows;
      renderPreview(rows, result);
    } catch (err) {
      importBox.innerHTML = inlineError("Fail tidak dapat dibaca", err.message);
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

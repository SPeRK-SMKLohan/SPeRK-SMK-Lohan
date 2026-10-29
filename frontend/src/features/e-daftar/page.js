import { schools, okuOptions, registrationStatusOptions, transferReasons } from "./constants.js";
import {
  createStudent, deleteStudents, getStudent, searchStudents,
  setStudentStatus, updateStudent,
} from "./api.js";
import { esc, formatTime } from "../../shared/dom.js";
import { loginErrorMessage, reauthenticate } from "../../shared/auth.js";
import { showStatus } from "../../shared/status.js";

/* Registration counter.
   The screen is built around one repeated action: choose a primary school,
   find the child, tap Tanda daftar. Everything administrative is deliberately
   out of the way until someone opens it. */

const PAGE_SIZE = 50;
const EXPORT_PAGE_SIZE = 200;
const PASSWORD_ERR_CODES = new Set([
  "auth/wrong-password", "auth/invalid-credential", "auth/user-mismatch", "auth/invalid-email",
]);

export function renderRegistration(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Pendaftaran murid</h1>
      <p class="lede">Daftar dan kemas kini murid Tingkatan 1.</p>
    </div>

    <section class="card registration-card">
      <div class="school-picker">
        <div class="field">
          <label class="label" for="schools">Sekolah rendah asal</label>
          <select class="select school-select" id="schools">
            <option value="">Pilih sekolah rendah</option>
            ${schools.map((s) => `<option value="${esc(s)}">${esc(s)}</option>`).join("")}
          </select>
        </div>
        <p class="school-prompt" id="school-prompt">Pilih sekolah untuk mencari dan mengurus murid.</p>
      </div>

      <div id="list-content" hidden>
      <div class="list-toolbar">
        <label class="search">
          <span class="sr-only">Cari murid</span>
          <input id="q" class="input" type="search" autocomplete="off"
                 placeholder="Nama atau No. IC"
                 aria-label="Cari nama atau nombor IC murid">
          <button id="clear-search" class="clear" type="button" hidden>Kosongkan</button>
        </label>
        <div class="seg" id="status-filter" role="group" aria-label="Tapis status daftar">
          <button type="button" data-status="" aria-pressed="true">Semua</button>
          ${registrationStatusOptions.map((o) => `
            <button type="button" data-status="${o.value}" aria-pressed="false">${o.label}</button>`).join("")}
        </div>
        <button id="new" class="btn primary" type="button">+ Murid baharu</button>
        <details class="list-more">
          <summary>Lagi</summary>
          <div class="list-more-menu">
            <button id="refresh" class="btn secondary" type="button">Muat semula</button>
            <button id="export-csv" class="btn secondary" type="button">Muat turun CSV</button>
            <button id="start-select" class="btn danger" type="button">Padam murid</button>
          </div>
        </details>
      </div>

      <p class="list-count" id="count" role="status" aria-live="polite"></p>

      <div id="bulk-bar" class="bulk-bar" hidden>
        <span id="bulk-count">0 dipilih</span>
        <span class="spacer"></span>
        <button id="sel-none" class="btn secondary sm" type="button">Batal pilihan</button>
        <button id="bulk-del" class="btn danger sm" type="button">Padam murid terpilih</button>
      </div>

      <div class="table-wrap student-table-wrap">
        <table class="table student-table">
          <caption class="sr-only">Senarai murid Tingkatan 1</caption>
          <thead><tr>
            <th class="student-check-cell" scope="col"><span class="sr-only">Pilih</span></th>
            <th scope="col">Nama murid</th>
            <th class="student-ic-cell" scope="col">No. IC</th>
            <th scope="col">Sekolah rendah asal</th>
            <th scope="col">Status daftar</th>
            <th class="student-actions-cell" scope="col">Tindakan</th>
          </tr></thead>
          <tbody id="rows" aria-label="Senarai murid"></tbody>
        </table>
      </div>

      <div id="pager" class="pager" hidden>
        <button id="btn-prev" class="btn secondary" type="button">‹ Sebelumnya</button>
        <span id="pager-info" class="muted"></span>
        <button id="btn-next" class="btn secondary" type="button">Seterusnya ›</button>
      </div>
      </div>
    </section>

    <dialog id="form-dialog" class="modal" aria-labelledby="form-title">
      <form id="student-form" method="dialog" novalidate>
        <div class="modal-head">
          <h2 id="form-title">Daftar murid baharu</h2>
          <p>Tingkatan 1</p>
        </div>
        <div class="modal-body">
          <div class="field">
            <label class="label" for="f-name">Nama murid</label>
            <input id="f-name" class="input" type="text" maxlength="100" autocomplete="off" required>
            <span class="err" id="f-name-err"></span>
          </div>

          <div class="field">
            <label class="label" for="f-ic">No. IC <span class="optional">(12 digit)</span></label>
            <input id="f-ic" class="input" type="text" inputmode="numeric" maxlength="14"
                   placeholder="140512-12-1234" autocomplete="off"
                   aria-describedby="f-ic-help f-ic-err" required>
            <p class="hint" id="f-ic-help">Tanda sempang pilihan.</p>
            <span class="err" id="f-ic-err"></span>
          </div>

          <div class="field">
            <label class="label" for="f-school">Sekolah rendah asal</label>
            <select id="f-school" class="select" required>
              <option value="">— Pilih sekolah —</option>
              ${schools.map((s) => `<option>${esc(s)}</option>`).join("")}
            </select>
            <span class="err" id="f-school-err"></span>
          </div>

          <div class="field">
            <label class="label" for="f-mother-phone">Telefon ibu <span class="optional">(pilihan)</span></label>
            <input id="f-mother-phone" class="input" type="tel" maxlength="30" autocomplete="tel">
          </div>
          <div class="field">
            <label class="label" for="f-father-phone">Telefon bapa <span class="optional">(pilihan)</span></label>
            <input id="f-father-phone" class="input" type="tel" maxlength="30" autocomplete="tel">
          </div>

          <fieldset>
            <legend>Status OKU</legend>
            <div class="choice-grid">
              ${okuOptions.map((o, i) => `
                <label class="choice">
                  <input type="radio" name="oku" value="${o.value}"${i === 0 ? " required" : ""}>
                  <span class="choice-body"><span class="choice-title">${o.label}</span></span>
                </label>`).join("")}
            </div>
          </fieldset>

          <fieldset>
            <legend>Status daftar</legend>
            <div class="choice-grid">
              ${registrationStatusOptions.map((o) => `
                <label class="choice">
                  <input type="radio" name="status" value="${o.value}"${o.value === "BELUM" ? " checked" : ""}>
                  <span class="choice-body"><span class="choice-title">${o.label}</span></span>
                </label>`).join("")}
            </div>
          </fieldset>

          <fieldset>
            <legend>Permohonan pindah</legend>
            <label class="choice" style="margin-bottom:var(--s3)">
              <input id="f-transfer" type="checkbox">
              <span class="choice-body">
                <span class="choice-title">Pindah ke sekolah lain</span>
                <span class="choice-note">Kehadiran tetap dikira.</span>
              </span>
            </label>

            <div id="transfer-box" hidden>
              <div class="field">
                <label class="label" for="f-transfer-school">Sekolah dipohon</label>
                <input id="f-transfer-school" class="input" type="text" maxlength="100" autocomplete="off">
                <span class="err" id="f-transfer-err"></span>
              </div>
              <div class="field">
                <label class="label" for="f-transfer-reason">Sebab</label>
                <select id="f-transfer-reason" class="select">
                  <option value="">— Pilih sebab —</option>
                  ${transferReasons.map((r) => `<option value="${esc(r.value)}">${esc(r.value)}</option>`).join("")}
                </select>
              </div>
              <div class="field" style="margin-bottom:0">
                <label class="label" for="f-transfer-notes">Catatan <span class="optional">(pilihan)</span></label>
                <textarea id="f-transfer-notes" class="input" maxlength="300" rows="3"></textarea>
              </div>
            </div>
          </fieldset>

          <div id="form-msg" role="alert" aria-live="assertive"></div>
        </div>
        <div class="modal-foot">
          <button id="close" class="btn secondary" type="button">Tutup</button>
          <button id="save" class="btn primary" type="submit">Simpan</button>
        </div>
      </form>
    </dialog>

    <dialog id="confirm-dialog" class="modal" aria-labelledby="confirm-title" aria-describedby="confirm-text">
      <form method="dialog">
        <div class="modal-head">
          <h2 id="confirm-title">Sahkan</h2>
          <p id="confirm-text"></p>
        </div>
        <div class="modal-foot">
          <button id="confirm-cancel" class="btn secondary" type="button">Batal</button>
          <button id="confirm-ok" class="btn danger" type="button">Teruskan</button>
        </div>
      </form>
    </dialog>

    <dialog id="bulk-delete-dialog" class="modal" aria-labelledby="bulk-delete-title">
      <form id="bulk-delete-form" method="dialog" novalidate>
        <div class="modal-head">
          <h2 id="bulk-delete-title">Padam murid terpilih</h2>
          <p>Anda akan memadam <strong id="bulk-del-count">0</strong> murid. Tindakan ini
            <strong>kekal</strong> dan tidak boleh dibatalkan. Resit lama masih menyimpan
            nama murid.</p>
        </div>
        <div class="modal-body">
          <div class="field" style="margin-bottom:0">
            <label class="label" for="bulk-del-password">Kata laluan</label>
            <input id="bulk-del-password" class="input" type="password" autocomplete="current-password">
            <p class="hint">Diperlukan untuk mengesahkan tindakan ini.</p>
          </div>
          <div id="bulk-del-msg" role="alert" aria-live="assertive"></p>
        </div>
        <div class="modal-foot">
          <button id="bulk-del-cancel" class="btn secondary" type="button">Batal</button>
          <button id="bulk-del-confirm" class="btn danger" type="submit">Padam semua terpilih</button>
        </div>
      </form>
    </dialog>`;

  /* ----- element references ----- */
  const $ = (sel) => root.querySelector(sel);
  const dialog = $("#form-dialog");
  const form = $("#student-form");
  const formTitle = $("#form-title");
  const formMsg = $("#form-msg");
  const saveBtn = $("#save");
  const transferToggle = $("#f-transfer");
  const transferBox = $("#transfer-box");
  const transferReasonEl = $("#f-transfer-reason");
  const transferNotesEl = $("#f-transfer-notes");

  const listContent = $("#list-content");
  const schoolPrompt = $("#school-prompt");
  const rowsEl = $("#rows");
  const countEl = $("#count");
  const schoolEl = $("#schools");
  const qEl = $("#q");
  const clearSearchBtn = $("#clear-search");
  const statusFilter = $("#status-filter");
  const pagerEl = $("#pager");
  const btnPrev = $("#btn-prev");
  const btnNext = $("#btn-next");
  const pagerInfo = $("#pager-info");
  const bulkBar = $("#bulk-bar");
  const bulkCount = $("#bulk-count");
  const startSelectBtn = $("#start-select");
  const exportCsvBtn = $("#export-csv");

  const confirmDialog = $("#confirm-dialog");
  const confirmTitle = $("#confirm-title");
  const confirmText = $("#confirm-text");
  const confirmOk = $("#confirm-ok");

  const bulkDeleteDialog = $("#bulk-delete-dialog");
  const bulkDeleteForm = $("#bulk-delete-form");
  const bulkDelCount = $("#bulk-del-count");
  const bulkDelPassword = $("#bulk-del-password");
  const bulkDelMsg = $("#bulk-del-msg");
  const bulkDelConfirmBtn = $("#bulk-del-confirm");

  /* ----- state ----- */
  let selectedSchool = "";
  let status = "";
  let rows = [];
  let editingId = null;
  let selectedIds = new Set();
  let selecting = false;
  let seq = 0;
  let mutationGen = 0;
  let busy = 0;
  let loading = false;
  let lastDataFingerprint = "";
  let timer;
  let page = 0;
  let hasMore = false;

  /* ----- confirm helper ----- */
  function askConfirm({ title, message, confirmLabel = "Teruskan", danger = true }) {
    return new Promise((resolve) => {
      confirmTitle.textContent = title;
      confirmText.textContent = message;
      confirmOk.textContent = confirmLabel;
      confirmOk.className = `btn ${danger ? "danger" : "primary"}`;

      const done = (value) => {
        confirmOk.removeEventListener("click", onOk);
        $("#confirm-cancel").removeEventListener("click", onCancel);
        confirmDialog.removeEventListener("cancel", onCancel);
        if (confirmDialog.open) confirmDialog.close();
        resolve(value);
      };
      const onOk = () => done(true);
      const onCancel = (e) => { e?.preventDefault?.(); done(false); };

      confirmOk.addEventListener("click", onOk);
      $("#confirm-cancel").addEventListener("click", onCancel);
      confirmDialog.addEventListener("cancel", onCancel);
      confirmDialog.showModal();
      $("#confirm-cancel").focus();
    });
  }

  /* ----- school choice ----- */
  schoolEl.addEventListener("change", () => {
    selectedSchool = schoolEl.value;
    page = 0;
    rows = [];
    qEl.value = "";
    clearSearchBtn.hidden = true;
    try {
      if (selectedSchool) localStorage.setItem("sperk-registration-school", selectedSchool);
      else localStorage.removeItem("sperk-registration-school");
    } catch { /* storage may be blocked; the session still works */ }

    listContent.hidden = !selectedSchool;
    schoolPrompt.hidden = Boolean(selectedSchool);
    if (!selectedSchool) {
      rowsEl.innerHTML = "";
      countEl.textContent = "";
      return;
    }
    load();
  });

  /* ----- list rendering ----- */
  function statusCell(s) {
    const done = s.registrationStatus === "SUDAH";
    // The time is a separate item so a long status never forces the row wider
    // than the screen at the largest text size.
    return done
      ? `<span class="pill ok">Sudah daftar</span>${s.registeredAt ? `<span>${esc(formatTime(s.registeredAt))}</span>` : ""}`
      : `<span class="pill warn">Belum daftar</span>`;
  }

  function rowHtml(s) {
    const done = s.registrationStatus === "SUDAH";
    const action = `<button class="btn ${done ? "secondary" : "ok"}" type="button"
      data-action="toggle-status" aria-pressed="${done}" aria-label="${done ? "Batal daftar" : "Tanda daftar"} ${esc(s.name)}"${s._pending ? " disabled" : ""}>${done ? "Batal daftar" : "Tanda daftar"}</button>`;

    return `<tr class="record${done ? " is-done" : ""}" data-id="${esc(s.studentId)}">
      <td class="student-check-cell"><input type="checkbox" class="record-select" data-id="${esc(s.studentId)}"
             aria-label="Pilih ${esc(s.name)}"${selectedIds.has(s.studentId) ? " checked" : ""}></td>
      <td class="student-name-cell"><strong class="student-name">${esc(s.name)}</strong>${s.oku === true ? ' <span class="pill warn">OKU</span>' : ""}</td>
      <td class="num student-ic-cell" data-label="No. IC">${esc(s.icMasked)}</td>
      <td class="student-school-cell" data-label="Sekolah rendah asal">${esc(s.formerPrimarySchool)}${s.transferSchool ? `<span class="student-note">Pindah: ${esc(s.transferSchool)}</span>` : ""}</td>
      <td class="student-status" data-label="Status daftar">${statusCell(s)}</td>
      <td class="student-actions-cell"><div class="record-actions">
        ${action}
        <button class="btn secondary" type="button" data-action="edit"${s._pending ? " disabled" : ""}>Butiran</button>
      </div></td>
    </tr>`;
  }

  function renderRows() {
    if (loading) {
      rowsEl.innerHTML = `<tr><td class="student-table-message" colspan="6"><span class="spinner" aria-hidden="true"></span>
        Memuatkan senarai untuk ${esc(selectedSchool)}…</td></tr>`;
      return;
    }
    if (rows.length) {
      rowsEl.innerHTML = rows.map(rowHtml).join("");
      return;
    }

    const query = qEl.value.trim();
    let body;
    if (query) {
      body = `<p>Tiada murid sepadan dengan “<strong>${esc(query)}</strong>”.</p>
        <p><button class="btn primary" type="button" data-action="new-from-search">
          Daftar “${esc(query)}” sebagai murid baharu</button></p>`;
    } else if (status) {
      body = `<p>Tiada murid dengan status ini untuk ${esc(selectedSchool)}.</p>
        <p><button class="btn secondary" type="button" data-action="clear-filter">Tunjuk semua status</button></p>`;
    } else {
      body = `<p>Belum ada senarai murid untuk ${esc(selectedSchool)}.</p>
        <p><a class="btn secondary" href="#/import">Import senarai murid</a></p>`;
    }
    rowsEl.innerHTML = `<tr><td class="record-empty student-table-message" colspan="6">${body}</td></tr>`;
  }

  function renderPager() {
    pagerEl.hidden = page === 0 && !hasMore;
    btnPrev.disabled = page === 0;
    btnNext.disabled = !hasMore;
    pagerInfo.textContent = `Halaman ${page + 1}`;
  }

  /* ----- loading ----- */
  async function load({ silent = false } = {}) {
    const mine = ++seq;
    const gen = mutationGen;

    if (!selectedSchool) {
      loading = false;
      rows = [];
      renderRows();
      return;
    }

    if (!silent) {
      loading = true;
      rows = [];
      countEl.textContent = "Memuatkan…";
      renderRows();
    }

    try {
      const data = await searchStudents(qEl.value.trim(), {
        status,
        school: selectedSchool,
        offset: page * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      if (mine !== seq || gen !== mutationGen) return;

      // Quiet refreshes run in the background. Keep the existing DOM (and its
      // focus/selection state) when neither the visible page nor its totals changed.
      const fingerprint = JSON.stringify(data);
      if (silent && fingerprint === lastDataFingerprint) return;
      lastDataFingerprint = fingerprint;

      loading = false;
      rows = data.students;
      hasMore = data.hasMore ?? false;
      selectedIds.clear();
      renderBulkBar();

      if (!rows.length && page > 0) {
        page = 0;
        return load({ silent });
      }

      renderRows();
      renderPager();

      const from = page * PAGE_SIZE + 1;
      const to = page * PAGE_SIZE + rows.length;
      countEl.textContent = data.total > rows.length
        ? `Menunjukkan ${from}–${to} daripada ${data.total} murid`
        : `${data.total} murid`;
    } catch (err) {
      if (mine !== seq) return;
      loading = false;
      if (!silent || !rows.length) {
        countEl.textContent = "";
        const isConnectionError = !err.status || /rangkaian|internet|terlalu lama/i.test(err.message);
        rowsEl.innerHTML = `<tr><td class="record-empty student-table-message" colspan="6">
          <div class="fail" role="alert">
            <strong class="fail-title">${isConnectionError ? "Sambungan terganggu" : "Senarai belum dapat dimuatkan"}</strong>
            <span class="fail-text">${isConnectionError
              ? "Semak sambungan internet, kemudian cuba semula. Sekolah dan carian anda masih tersimpan."
              : "Cuba semula sebentar lagi. Jika berterusan, maklumkan pentadbir sistem."}</span>
            <button class="btn primary" type="button" data-action="retry">Cuba semula</button>
          </div>
        </td></tr>`;
      }
    }
  }

  /* ----- mark / unmark ----- */
  async function setStatus(s, next, { skipConfirm = false } = {}) {
    if (next === "BELUM" && !skipConfirm) {
      const ok = await askConfirm({
        title: "Batal daftar murid",
        message: `Kembalikan status ${s.name} kepada "Belum daftar"?`,
        confirmLabel: "Ya, batal daftar",
      });
      if (!ok) return;
    }

    mutationGen += 1;
    busy += 1;

    const prev = {
      registrationStatus: s.registrationStatus,
      registeredAt: s.registeredAt,
      registeredBy: s.registeredBy,
    };

    s._pending = true;
    s.registrationStatus = next;
    s.registeredAt = next === "SUDAH" ? new Date().toISOString() : null;
    s.registeredBy = next === "SUDAH" ? "(anda)" : "";
    renderRows();

    try {
      const { student } = await setStudentStatus(s.studentId, next);
      Object.assign(s, student);

      showStatus({
        type: "ok",
        title: next === "SUDAH" ? "Murid ditanda sudah daftar" : "Status dikembalikan",
        message: next === "SUDAH"
          ? `${s.name} direkodkan hadir pada ${formatTime(s.registeredAt)}.`
          : `${s.name} kini berstatus belum daftar.`,
        actionLabel: "Buat asal",
        timeout: 12000,
        onAction: () => setStatus(s, next === "SUDAH" ? "BELUM" : "SUDAH", { skipConfirm: true }),
      });
    } catch (err) {
      Object.assign(s, prev);
      showStatus({
        type: "bad",
        title: "Status tidak dapat disimpan",
        message: err.message,
      });
    } finally {
      s._pending = false;
      busy -= 1;
      renderRows();
      if (s.registrationStatus === next) load({ silent: true });
    }
  }

  /* ----- row actions ----- */
  rowsEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "retry") return load();
    if (action === "clear-filter") {
      status = "";
      for (const b of statusFilter.querySelectorAll("button")) {
        b.setAttribute("aria-pressed", String(b.dataset.status === ""));
      }
      return load();
    }
    if (action === "new-from-search") {
      openForm(null, { prefillName: qEl.value.trim() });
      return;
    }

    const tr = btn.closest("tr.record");
    const s = rows.find((x) => x.studentId === tr?.dataset.id);
    if (!s) return;

    if (action === "toggle-status") return setStatus(s, s.registrationStatus === "SUDAH" ? "BELUM" : "SUDAH");
    if (action === "edit") {
      btn.disabled = true;
      try {
        const { student } = await getStudent(s.studentId);
        openForm(student);
      } catch (err) {
        showStatus({ type: "bad", title: "Butiran tidak dapat dibuka", message: err.message });
      } finally {
        btn.disabled = false;
      }
    }
  });

  /* ----- selection ----- */
  rowsEl.addEventListener("change", (e) => {
    const cb = e.target.closest(".record-select");
    if (!cb) return;
    if (cb.checked) selectedIds.add(cb.dataset.id);
    else selectedIds.delete(cb.dataset.id);
    renderBulkBar();
  });

  function renderBulkBar() {
    const n = selectedIds.size;
    bulkBar.hidden = n === 0;
    bulkCount.textContent = `${n} murid dipilih`;
  }

  startSelectBtn.addEventListener("click", () => {
    if (selecting) {
      selecting = false;
      selectedIds.clear();
      rowsEl.classList.remove("selecting");
      startSelectBtn.textContent = "Pilih murid untuk dipadam";
      renderBulkBar();
      return;
    }
    if (!selectedSchool) {
      showStatus({ type: "warn", title: "Pilih sekolah dahulu", message: "Pilih sekolah rendah sebelum memilih murid untuk dipadam." });
      return;
    }
    selecting = true;
    rowsEl.classList.add("selecting");
    startSelectBtn.textContent = "Tutup mod pilih";
    $(".list-more").open = false;
    showStatus({
      type: "info",
      title: "Mod pilih",
      message: "Tandakan kotak di sebelah kiri murid, kemudian tekan “Padam murid terpilih”.",
    });
    rowsEl.querySelector(".record-select")?.focus();
  });

  $("#sel-none").addEventListener("click", () => {
    selectedIds.clear();
    for (const cb of rowsEl.querySelectorAll(".record-select")) cb.checked = false;
    renderBulkBar();
  });

  /* ----- filters and search ----- */
  statusFilter.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-status]");
    if (!btn) return;
    for (const b of statusFilter.querySelectorAll("button")) {
      b.setAttribute("aria-pressed", String(b === btn));
    }
    status = btn.dataset.status;
    page = 0;
    load();
  });

  qEl.addEventListener("input", () => {
    clearSearchBtn.hidden = !qEl.value;
    clearTimeout(timer);
    timer = setTimeout(() => { page = 0; load(); }, 250);
  });

  clearSearchBtn.addEventListener("click", () => {
    qEl.value = "";
    clearSearchBtn.hidden = true;
    qEl.dispatchEvent(new Event("input", { bubbles: true }));
    qEl.focus();
  });

  $("#refresh").addEventListener("click", () => load());

  function csvCell(value) {
    const safe = String(value ?? "").replace(/^[-=+@]/, "'$&");
    return `"${safe.replaceAll('"', '""')}"`;
  }

  exportCsvBtn.addEventListener("click", async () => {
    if (!selectedSchool || exportCsvBtn.disabled) return;
    exportCsvBtn.disabled = true;
    const originalLabel = exportCsvBtn.textContent;
    exportCsvBtn.textContent = "Menyediakan CSV…";
    try {
      const exported = [];
      let offset = 0;
      let hasMore = true;
      while (hasMore) {
        const data = await searchStudents(qEl.value.trim(), {
          status,
          school: selectedSchool,
          offset,
          limit: EXPORT_PAGE_SIZE,
        });
        exported.push(...data.students);
        offset += data.students.length;
        hasMore = Boolean(data.hasMore);
        if (!data.students.length && hasMore) throw new Error("Senarai berubah semasa CSV disediakan. Sila cuba semula.");
      }

      const header = ["Nama", "No. IC", "Sekolah rendah asal", "Tingkatan", "Status OKU", "Status daftar", "Tarikh daftar", "No. Tel. Ibu", "No. Tel. Bapa", "Sekolah dipohon", "Sebab pindah", "Catatan pindah"];
      const lines = exported.map((s) => [
        s.name,
        s.icNumber,
        s.formerPrimarySchool,
        s.tingkatan ? `Tingkatan ${s.tingkatan}` : "",
        s.oku === true ? "Ya" : s.oku === false ? "Tidak" : "",
        s.registrationStatus === "SUDAH" ? "Sudah daftar" : "Belum daftar",
        s.registeredAt || "",
        s.motherPhone || "",
        s.fatherPhone || "",
        s.transferSchool || "",
        s.transferReason || "",
        s.transferNotes || "",
      ]);
      const csv = [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = `senarai-murid-${selectedSchool.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.csv`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      showStatus({ type: "ok", title: "CSV sedia", message: `${exported.length} murid dieksport.` });
    } catch (err) {
      showStatus({ type: "bad", title: "CSV tidak dapat disediakan", message: err.message });
    } finally {
      exportCsvBtn.disabled = false;
      exportCsvBtn.textContent = originalLabel;
    }
  });

  btnPrev.addEventListener("click", () => {
    if (page > 0) { page -= 1; load(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });
  btnNext.addEventListener("click", () => {
    if (hasMore) { page += 1; load(); window.scrollTo({ top: 0, behavior: "smooth" }); }
  });

  // "/" jumps to search when the user is not already typing.
  const onKey = (e) => {
    if (!root.isConnected) { document.removeEventListener("keydown", onKey); return; }
    if (e.key !== "/" || e.ctrlKey || e.metaKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || dialog.open) return;
    if (!selectedSchool) return;
    e.preventDefault();
    qEl.focus();
  };
  document.addEventListener("keydown", onKey);

  /* ----- quiet refresh ----- */
  function scheduleAutoRefresh(delay) {
    setTimeout(() => {
      if (!root.isConnected) return;
      const idle = document.visibilityState === "visible" && !busy && !dialog.open &&
        !selecting && document.activeElement !== qEl;
      if (idle) load({ silent: true });
      scheduleAutoRefresh(30000);
    }, delay);
  }
  scheduleAutoRefresh(Math.random() * 30000);

  /* ----- student form ----- */
  const setRadio = (name, value) => {
    for (const el of form.querySelectorAll(`input[name="${name}"]`)) el.checked = el.value === value;
  };
  const checkedRadio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value ?? "";

  function showTransfer(on) {
    transferToggle.checked = on;
    transferBox.hidden = !on;
    if (on) setRadio("status", "SUDAH");
  }

  // Old records may hold free-text reasons; keep them visible and selectable.
  function setTransferReason(value) {
    const v = value ?? "";
    for (const o of transferReasonEl.querySelectorAll("option[data-legacy]")) o.remove();
    if (v && !transferReasons.some((r) => r.value === v)) {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = `${v} (rekod lama)`;
      o.dataset.legacy = "1";
      transferReasonEl.append(o);
    }
    transferReasonEl.value = v;
  }

  transferReasonEl.addEventListener("change", () => {
    const found = transferReasons.find((r) => r.value === transferReasonEl.value);
    if (found) transferNotesEl.value = found.notes;
  });

  transferToggle.addEventListener("change", () => {
    showTransfer(transferToggle.checked);
    if (transferToggle.checked) setRadio("status", "SUDAH");
  });

  function clearFormErrors() {
    formMsg.innerHTML = "";
    for (const id of ["f-name", "f-ic", "f-school", "f-transfer"]) {
      const slot = $(`#${id}-err`);
      if (slot) slot.textContent = "";
      $(`#${id}`)?.removeAttribute("aria-invalid");
    }
  }

  function resetForm() {
    editingId = null;
    form.reset();
    formTitle.textContent = "Daftar murid baharu";
    clearFormErrors();
    showTransfer(false);
  }

  function openForm(student, { prefillName = "" } = {}) {
    resetForm();
    if (student) {
      editingId = student.studentId;
      formTitle.textContent = `Butiran: ${student.name}`;
      $("#f-school").value = student.formerPrimarySchool;
      $("#f-name").value = student.name;
      $("#f-ic").value = student.icNumber;
      $("#f-mother-phone").value = student.motherPhone || "";
      $("#f-father-phone").value = student.fatherPhone || "";
      setRadio("oku", student.oku === true ? "true" : student.oku === false ? "false" : "");
      setRadio("status", student.registrationStatus);
      $("#f-transfer-school").value = student.transferSchool;
      setTransferReason(student.transferReason);
      transferNotesEl.value = student.transferNotes;
      showTransfer(Boolean(student.transferSchool || student.transferReason || student.transferNotes));
    } else {
      if (selectedSchool) $("#f-school").value = selectedSchool;
      $("#f-name").value = prefillName;
    }
    dialog.showModal();
    (student ? $("#f-name") : $("#f-ic")).focus();
  }

  $("#new").addEventListener("click", () => openForm(null));
  $("#close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", resetForm);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearFormErrors();

    const name = $("#f-name").value.trim();
    const ic = $("#f-ic").value.trim();
    const school = $("#f-school").value;
    const transfer = transferToggle.checked;
    const transferSchool = $("#f-transfer-school").value.trim();

    let bad = false;
    if (name.length < 2) { $("#f-name-err").textContent = "Sila isi nama penuh murid."; $("#f-name").setAttribute("aria-invalid", "true"); bad = true; }
    if (!ic) { $("#f-ic-err").textContent = "Sila isi nombor IC."; $("#f-ic").setAttribute("aria-invalid", "true"); bad = true; }
    else if (ic.replace(/\D/g, "").length !== 12) { $("#f-ic-err").textContent = "No. IC mesti 12 digit."; $("#f-ic").setAttribute("aria-invalid", "true"); bad = true; }
    if (!school) { $("#f-school-err").textContent = "Sila pilih sekolah rendah asal."; $("#f-school").setAttribute("aria-invalid", "true"); bad = true; }
    if (transfer && !transferSchool) { $("#f-transfer-err").textContent = "Sila isi nama sekolah dipohon."; $("#f-transfer-school").setAttribute("aria-invalid", "true"); bad = true; }

    if (bad) {
      form.querySelector("[aria-invalid='true']")?.focus();
      return;
    }

    const payload = {
      formerPrimarySchool: school,
      name,
      icNumber: ic,
      tingkatan: "Tingkatan 1",
      oku: checkedRadio("oku") === "true",
      registrationStatus: transfer ? "SUDAH" : checkedRadio("status") || "BELUM",
      motherPhone: $("#f-mother-phone").value.trim(),
      fatherPhone: $("#f-father-phone").value.trim(),
      transferSchool: transfer ? transferSchool : "",
      transferReason: transfer ? transferReasonEl.value.trim() : "",
      transferNotes: transfer ? transferNotesEl.value.trim() : "",
    };

    const updating = Boolean(editingId);
    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan…";
    try {
      if (updating) await updateStudent(editingId, payload);
      else await createStudent(payload);
      dialog.close();
      showStatus({
        type: "ok",
        title: updating ? "Maklumat dikemas kini" : "Murid didaftarkan",
        message: `${name} telah ${updating ? "dikemas kini" : "ditambah ke senarai"}.`,
      });
      await load();
    } catch (err) {
      formMsg.innerHTML = `<div class="status bad"><div class="status-body">
        <strong class="status-title">Tidak dapat disimpan</strong>
        <span class="status-text"></span></div></div>`;
      formMsg.querySelector(".status-text").textContent = err.message;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan";
    }
  });

  /* ----- bulk delete ----- */
  $("#bulk-del").addEventListener("click", () => {
    if (selectedIds.size === 0) return;
    bulkDelCount.textContent = selectedIds.size;
    bulkDelMsg.innerHTML = "";
    bulkDeleteForm.reset();
    bulkDeleteDialog.showModal();
    bulkDelPassword.focus();
  });

  $("#bulk-del-cancel").addEventListener("click", () => bulkDeleteDialog.close());
  bulkDeleteDialog.addEventListener("close", () => {
    bulkDelMsg.innerHTML = "";
    bulkDeleteForm.reset();
  });

  bulkDeleteForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    bulkDelMsg.innerHTML = "";
    if (selectedIds.size === 0) return;

    const password = bulkDelPassword.value;
    if (!password) {
      bulkDelMsg.innerHTML = `<p class="err">Sila isi kata laluan untuk pengesahan.</p>`;
      bulkDelPassword.focus();
      return;
    }

    bulkDelConfirmBtn.disabled = true;
    bulkDelConfirmBtn.textContent = "Memadam…";
    try {
      await reauthenticate(password);
      const n = selectedIds.size;
      await deleteStudents([...selectedIds]);
      selectedIds.clear();
      bulkDeleteDialog.close();
      renderBulkBar();
      selecting = false;
      rowsEl.classList.remove("selecting");
      startSelectBtn.textContent = "Pilih murid untuk dipadam";
      showStatus({ type: "ok", title: "Murid dipadam", message: `${n} murid telah dibuang daripada senarai.` });
      await load();
    } catch (err) {
      bulkDelMsg.innerHTML = `<p class="err"></p>`;
      bulkDelMsg.querySelector(".err").textContent = err.code
        ? (PASSWORD_ERR_CODES.has(err.code) ? "Kata laluan tidak betul." : loginErrorMessage(err))
        : err.message;
    } finally {
      bulkDelConfirmBtn.disabled = false;
      bulkDelConfirmBtn.textContent = "Padam semua terpilih";
    }
  });

  /* ----- initial state ----- */
  resetForm();
  try {
    const saved = localStorage.getItem("sperk-registration-school");
    if (schools.includes(saved)) selectedSchool = saved;
  } catch { /* use manual choice */ }

  schoolEl.value = selectedSchool;
  listContent.hidden = !selectedSchool;
  schoolPrompt.hidden = Boolean(selectedSchool);
  if (selectedSchool) {
    load();
  }
}

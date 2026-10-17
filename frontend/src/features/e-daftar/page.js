import { schools, tingkatanOptions, okuOptions, registrationStatusOptions } from "./constants.js";
import {
  createStudent, getStudent, searchStudents, setStudentStatus, updateStudent,
} from "./api.js";
import { esc, formatClock, formatTime } from "../../shared/dom.js";
import { showToast } from "../../shared/toast.js";

/* Halaman e-Daftar dioptimumkan sebagai kaunter hari pendaftaran:
   cari murid -> tekan "Tanda daftar" (satu ketukan) -> selesai, dengan "Batal".
   Borang penuh (untuk pembetulan atau murid baharu) berada dalam dialog. */

export function renderEDaftar(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>e-Daftar</h1>
      <p class="muted">Cari murid, kemudian tekan <strong>Tanda daftar</strong>. Data ini
        dikongsi dengan e-Resit Koperasi.</p>
    </div>

    <section class="cards">
      <div class="card stat"><span>Sudah daftar</span><strong id="stat-done">–</strong></div>
      <div class="card stat"><span>Belum daftar</span><strong id="stat-not">–</strong></div>
      <div class="card stat"><span>Didaftarkan hari ini</span><strong id="stat-today">–</strong></div>
      <div class="card stat"><span>Jumlah murid aktif</span><strong id="stat-total">–</strong></div>
    </section>

    <section class="card">
      <div class="progress-row">
        <div class="progress" role="img" aria-label="Kemajuan pendaftaran">
          <div class="progress-bar" id="progress-bar" style="width:0%"></div>
        </div>
        <span class="muted" id="progress-text">Memuatkan…</span>
      </div>
    </section>

    <section class="card kaunter-tools">
      <div class="search-row">
        <input id="q" class="input input-lg" type="search" autocomplete="off"
               placeholder="Cari nama atau No. IC — contoh: ahmad 140512"
               aria-label="Cari murid">
        <button id="refresh" class="btn" type="button" title="Muat semula senarai">↻ Muat semula</button>
        <button id="new" class="btn primary" type="button">+ Murid baharu</button>
      </div>

      <div class="filter-row">
        <div class="chips" id="chips-tingkatan" role="group" aria-label="Tapis tingkatan">
          <button class="chip active" type="button" data-value="">Semua ting.</button>
          ${tingkatanOptions.map((t) => `
            <button class="chip" type="button" data-value="${t}">Tingkatan ${t}</button>`).join("")}
        </div>
        <div class="chips" id="chips-status" role="group" aria-label="Tapis status daftar">
          <button class="chip active" type="button" data-value="">Semua status</button>
          ${registrationStatusOptions.map((o) => `
            <button class="chip" type="button" data-value="${o.value}">${o.label}</button>`).join("")}
        </div>
        <select id="school" class="input input-school" aria-label="Tapis sekolah rendah">
          <option value="">Semua sekolah rendah</option>
          ${schools.map((s) => `<option>${esc(s)}</option>`).join("")}
        </select>
      </div>

      <p class="muted count-line"><span id="count">Memuatkan…</span>
        <span id="hint"></span>
        <span id="updated" class="muted"></span></p>
    </section>

    <section class="card">
      <div class="table-wrap"><table class="table wide">
        <thead><tr>
          <th>Murid</th><th>Sekolah Rendah Asal</th><th>Status Daftar</th>
          <th>Penempatan Semula</th><th>Tindakan</th>
        </tr></thead>
        <tbody id="rows"><tr><td colspan="5" class="muted">Memuatkan…</td></tr></tbody>
      </table></div>
      <p class="notice">No. IC dipaparkan separa. Guna <strong>Butiran</strong> untuk
        membetulkan maklumat atau merekod permohonan penempatan semula.</p>
    </section>

    <dialog id="form-dialog" class="modal">
      <form id="student-form">
        <h2 id="form-title">Daftar murid baharu</h2>
        <div class="form-grid">
          <label>Sekolah (SK Terdahulu)
            <select id="f-school" class="input" required>
              <option value="">— Pilih sekolah —</option>
              ${schools.map((s) => `<option>${esc(s)}</option>`).join("")}
            </select>
          </label>
          <label>Nama murid
            <input id="f-name" class="input" type="text" maxlength="100" autocomplete="off" required>
          </label>
          <label>No. IC (12 digit)
            <input id="f-ic" class="input" type="text" inputmode="numeric" maxlength="14"
                   placeholder="140512-12-1234" autocomplete="off" required>
          </label>
          <label>Tingkatan
            <select id="f-tingkatan" class="input">
              <option value="">— Belum ditetapkan —</option>
              ${tingkatanOptions.map((t) => `<option value="${t}">Tingkatan ${t}</option>`).join("")}
            </select>
          </label>

          <fieldset class="radio-group">
            <legend>Status OKU</legend>
            ${okuOptions.map((o, i) => `<label class="radio">
              <input type="radio" name="oku" value="${o.value}"${i === 0 ? " required" : ""}> ${o.label}
            </label>`).join("")}
          </fieldset>

          <fieldset class="radio-group">
            <legend>Status daftar (kehadiran hari pendaftaran)</legend>
            ${registrationStatusOptions.map((o) => `<label class="radio">
              <input type="radio" name="status" value="${o.value}"${o.value === "BELUM" ? " checked" : ""}> ${o.label}
            </label>`).join("")}
          </fieldset>

          <label class="inline full"><input id="f-transfer" type="checkbox"> Mohon penempatan semula ke sekolah lain</label>

          <div id="transfer-box" class="form-grid full hidden">
            <label>Nama sekolah dipohon
              <input id="f-transfer-school" class="input" type="text" maxlength="100" autocomplete="off">
            </label>
            <label>Sebab
              <input id="f-transfer-reason" class="input" type="text" maxlength="200" autocomplete="off">
            </label>
            <label class="full">Catatan
              <input id="f-transfer-notes" class="input" type="text" maxlength="300" autocomplete="off">
            </label>
            <p class="muted full">Murid yang hadir pada hari pendaftaran tetap dikira
              <strong>sudah daftar</strong>, walaupun memohon penempatan semula.</p>
          </div>
        </div>

        <p id="form-msg" class="error"></p>
        <div class="toolbar">
          <button id="save" class="btn primary" type="submit">Simpan</button>
          <button id="clear" class="btn" type="button">Kosongkan borang</button>
          <button id="close" class="btn" type="button">Tutup</button>
        </div>
      </form>
    </dialog>`;

  const dialog = root.querySelector("#form-dialog");
  const form = root.querySelector("#student-form");
  const formTitle = root.querySelector("#form-title");
  const msg = root.querySelector("#form-msg");
  const saveBtn = root.querySelector("#save");
  const transferToggle = root.querySelector("#f-transfer");
  const transferBox = root.querySelector("#transfer-box");

  const qEl = root.querySelector("#q");
  const schoolEl = root.querySelector("#school");
  const countEl = root.querySelector("#count");
  const hintEl = root.querySelector("#hint");
  const updatedEl = root.querySelector("#updated");
  const rowsEl = root.querySelector("#rows");
  const statDone = root.querySelector("#stat-done");
  const statNot = root.querySelector("#stat-not");
  const statToday = root.querySelector("#stat-today");
  const statTotal = root.querySelector("#stat-total");
  const progressBar = root.querySelector("#progress-bar");
  const progressText = root.querySelector("#progress-text");

  let filters = { tingkatan: "", status: "" };
  let rows = [];
  let editingId = null;
  let seq = 0;
  let mutationGen = 0; // ditambah pada setiap mutasi: muatan lama diabaikan
  let busy = 0;
  let timer;

  /* ----- Statistik dan kemajuan ----- */
  let counts = { done: 0, not: 0, today: 0, total: 0 };

  function renderCounts() {
    statDone.textContent = counts.done;
    statNot.textContent = counts.not;
    statToday.textContent = counts.today;
    statTotal.textContent = counts.total;
    const pct = counts.total ? Math.round((counts.done / counts.total) * 100) : 0;
    progressBar.style.width = `${pct}%`;
    progressText.textContent = `${pct}% sudah daftar (${counts.done} daripada ${counts.total} murid)`;
  }

  /* ----- Jadual murid ----- */
  function rowHtml(s) {
    const done = s.registrationStatus === "SUDAH";
    const statusCell = done
      ? `<span class="badge ok">✓ Sudah daftar</span>` +
        (s.registeredAt
          ? `<br><span class="muted">${esc(formatTime(s.registeredAt))}${
              s.registeredBy ? ` · ${esc(s.registeredBy)}` : ""}</span>`
          : "")
      : `<span class="badge">Belum daftar</span>`;

    const actions = done
      ? `<button class="btn small" type="button" data-action="unmark"${s._pending ? " disabled" : ""}>↩ Batal daftar</button>`
      : `<button class="btn small ok" type="button" data-action="mark"${s._pending ? " disabled" : ""}>✓ Tanda daftar</button>`;

    return `<tr data-id="${esc(s.studentId)}"${done ? ' class="row-done"' : ""}>
      <td>
        <strong>${esc(s.name)}</strong>
        ${s.tingkatan ? `<span class="tag">T${esc(s.tingkatan)}</span>` : ""}
        ${s.oku === true ? `<span class="tag oku">OKU</span>` : ""}
        <br><span class="muted">${esc(s.icMasked)}</span>
      </td>
      <td>${esc(s.formerPrimarySchool)}</td>
      <td class="nowrap">${statusCell}</td>
      <td>${s.transferSchool ? esc(s.transferSchool) : "—"}</td>
      <td class="row-actions nowrap">
        <button class="btn small" type="button" data-action="edit"${s._pending ? " disabled" : ""}>Butiran</button>
        ${actions}
      </td>
    </tr>`;
  }

  function renderRows() {
    if (rows.length) {
      rowsEl.innerHTML = rows.map(rowHtml).join("");
      return;
    }
    const query = qEl.value.trim();
    rowsEl.innerHTML = `<tr><td colspan="5" class="muted">
      Tiada padanan ${query ? `untuk “${esc(query)}”` : ""}.
      ${query ? `<button class="btn primary small" type="button" data-action="new-from-search">+ Daftar “${esc(query)}” sebagai murid baharu</button>` : ""}
    </td></tr>`;
  }

  function renderHint() {
    const only = rows.length === 1 ? rows[0] : null;
    hintEl.innerHTML = only && only.registrationStatus === "BELUM"
      ? ` · <strong>Tekan Enter</strong> untuk tanda daftar ${esc(only.name)}`
      : "";
  }

  /* ----- Muat turun senarai ----- */
  async function load({ silent = false } = {}) {
    const mine = ++seq;
    const gen = mutationGen;
    if (!silent) countEl.textContent = "Memuatkan…";
    try {
      const data = await searchStudents(qEl.value.trim(), {
        ...filters,
        school: schoolEl.value,
        limit: 200,
      });
      // Abaikan respons lapuk: carian lebih baharu, atau mutasi berlaku selepas muatan ini mula.
      if (mine !== seq || gen !== mutationGen) return;
      rows = data.students;
      counts = {
        done: data.registeredTotal,
        not: data.notRegisteredTotal,
        today: data.registeredTodayCount ?? 0,
        total: data.registeredTotal + data.notRegisteredTotal,
      };
      renderRows();
      renderHint();
      renderCounts();
      countEl.textContent = data.total > rows.length
        ? `Menunjukkan ${rows.length} daripada ${data.total} padanan`
        : `${data.total} padanan`;
      updatedEl.textContent = ` · dikemas kini ${formatClock()}`;
    } catch (err) {
      if (mine !== seq) return;
      countEl.textContent = "";
      rowsEl.innerHTML = `<tr><td colspan="5" class="error">${esc(err.message)}</td></tr>`;
    }
  }

  /* ----- Tanda daftar / batal daftar (dengan undo) ----- */
  const isToday = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
      && d.getDate() === now.getDate();
  };

  async function setStatus(s, status, { skipConfirm = false } = {}) {
    if (
      status === "BELUM" && !skipConfirm &&
      !confirm(`Kembalikan status ${s.name} kepada "Belum daftar"?`)
    ) return;

    mutationGen += 1; // muatan senarai yang bermula sebelum ini akan diabaikan
    busy += 1;
    const prev = {
      registrationStatus: s.registrationStatus,
      registeredAt: s.registeredAt,
      registeredBy: s.registeredBy,
    };
    const wasToday = prev.registrationStatus === "SUDAH" && prev.registeredAt
      && isToday(prev.registeredAt);

    s._pending = true;
    s.registrationStatus = status;
    s.registeredAt = status === "SUDAH" ? new Date().toISOString() : null;
    s.registeredBy = status === "SUDAH" ? "(anda)" : "";
    renderRows();

    try {
      const { student } = await setStudentStatus(s.studentId, status);
      Object.assign(s, student); // nilai sebenar daripada pelayan
      if (status === "SUDAH") {
        counts.done += 1;
        counts.not -= 1;
        counts.today += 1;
      } else {
        counts.done -= 1;
        counts.not += 1;
        if (wasToday) counts.today -= 1;
      }
      renderCounts();
      showToast(
        status === "SUDAH"
          ? `✓ ${s.name} ditanda sudah daftar.`
          : `Status ${s.name} dikembalikan kepada belum daftar.`,
        {
          actionLabel: "Batal",
          onAction: () => setStatus(s, status === "SUDAH" ? "BELUM" : "SUDAH", { skipConfirm: true }),
        }
      );
    } catch (err) {
      Object.assign(s, prev);
      showToast(err.message, { type: "danger" });
    } finally {
      s._pending = false;
      busy -= 1;
      renderRows();
    }
  }

  /* ----- Tindakan pada baris ----- */
  rowsEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === "new-from-search") {
      openForm(null, { prefillName: qEl.value.trim() });
      return;
    }

    const tr = btn.closest("tr");
    const s = rows.find((x) => x.studentId === tr?.dataset.id);
    if (!s) return;

    if (action === "mark") return setStatus(s, "SUDAH");
    if (action === "unmark") return setStatus(s, "BELUM");
    if (action === "edit") {
      btn.disabled = true;
      try {
        const { student } = await getStudent(s.studentId);
        openForm(student);
      } catch (err) {
        showToast(err.message, { type: "danger" });
      } finally {
        btn.disabled = false;
      }
    }
  });

  /* ----- Penapis dan carian ----- */
  function chipGroup(id, key) {
    const group = root.querySelector(`#${id}`);
    group.addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      for (const c of group.querySelectorAll(".chip")) c.classList.toggle("active", c === chip);
      filters[key] = chip.dataset.value;
      load();
    });
  }
  chipGroup("chips-tingkatan", "tingkatan");
  chipGroup("chips-status", "status");

  schoolEl.addEventListener("change", () => load());

  qEl.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => load(), 250);
  });

  // Cari murid tunggal -> Enter terus tanda daftar (dengan "Batal" jika tersalah).
  qEl.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const only = rows.length === 1 ? rows[0] : null;
    if (only && only.registrationStatus === "BELUM") setStatus(only, "SUDAH");
  });

  root.querySelector("#refresh").addEventListener("click", () => load());

  // Pintasan "/" untuk fokus carian (bila tidak menaip dalam medan lain).
  const onKey = (e) => {
    if (!root.isConnected) {
      document.removeEventListener("keydown", onKey);
      return;
    }
    if (e.key !== "/" || e.ctrlKey || e.metaKey) return;
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA" || dialog.open) return;
    e.preventDefault();
    qEl.focus();
  };
  document.addEventListener("keydown", onKey);

  // Kemas kini automatik setiap 30 saat supaya kaunter lain nampak data terkini.
  const autoRefresh = setInterval(() => {
    if (!root.isConnected) {
      clearInterval(autoRefresh);
      return;
    }
    if (document.visibilityState !== "visible" || busy || dialog.open) return;
    if (document.activeElement === qEl || document.activeElement === schoolEl) return;
    load({ silent: true });
  }, 30000);

  /* ----- Borang (dialog) ----- */
  const setRadio = (name, value) => {
    for (const el of form.querySelectorAll(`input[name="${name}"]`)) el.checked = el.value === value;
  };
  const checkedRadio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value ?? "";

  function showTransfer(on) {
    transferToggle.checked = on;
    transferBox.classList.toggle("hidden", !on);
  }

  function resetForm() {
    editingId = null;
    form.reset();
    formTitle.textContent = "Daftar murid baharu";
    msg.textContent = "";
    showTransfer(false);
  }

  function openForm(student, { prefillName = "" } = {}) {
    resetForm();
    if (student) {
      editingId = student.studentId;
      formTitle.textContent = `Kemaskini murid: ${student.name}`;
      root.querySelector("#f-school").value = student.formerPrimarySchool;
      root.querySelector("#f-name").value = student.name;
      root.querySelector("#f-ic").value = student.icNumber;
      root.querySelector("#f-tingkatan").value = student.tingkatan ?? "";
      setRadio("oku", student.oku === true ? "true" : student.oku === false ? "false" : "");
      setRadio("status", student.registrationStatus);
      root.querySelector("#f-transfer-school").value = student.transferSchool;
      root.querySelector("#f-transfer-reason").value = student.transferReason;
      root.querySelector("#f-transfer-notes").value = student.transferNotes;
      showTransfer(Boolean(student.transferSchool || student.transferReason || student.transferNotes));
    } else {
      root.querySelector("#f-tingkatan").value = filters.tingkatan || "1";
      root.querySelector("#f-name").value = prefillName;
    }
    dialog.showModal();
    root.querySelector(student ? "#f-name" : "#f-ic").focus();
  }

  root.querySelector("#new").addEventListener("click", () => openForm(null));
  root.querySelector("#close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", resetForm);
  root.querySelector("#clear").addEventListener("click", () => {
    const title = editingId ? formTitle.textContent : "";
    resetForm();
    if (title) root.querySelector("#f-ic").focus();
  });
  transferToggle.addEventListener("change", () => showTransfer(transferToggle.checked));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";

    const transfer = transferToggle.checked;
    const transferSchool = root.querySelector("#f-transfer-school").value.trim();
    if (transfer && !transferSchool) {
      msg.textContent = "Sila isi nama sekolah dipohon, atau nyahpilih penempatan semula.";
      return;
    }

    const payload = {
      formerPrimarySchool: root.querySelector("#f-school").value,
      name: root.querySelector("#f-name").value.trim(),
      icNumber: root.querySelector("#f-ic").value.trim(),
      tingkatan: root.querySelector("#f-tingkatan").value || null,
      oku: checkedRadio("oku") === "true",
      registrationStatus: checkedRadio("status") || "BELUM",
      transferSchool: transfer ? transferSchool : "",
      transferReason: transfer ? root.querySelector("#f-transfer-reason").value.trim() : "",
      transferNotes: transfer ? root.querySelector("#f-transfer-notes").value.trim() : "",
    };

    const updating = Boolean(editingId);
    saveBtn.disabled = true;
    saveBtn.textContent = "Menyimpan…";
    try {
      if (updating) await updateStudent(editingId, payload);
      else await createStudent(payload);
      dialog.close();
      showToast(updating ? `Maklumat ${payload.name} dikemas kini.` : `${payload.name} telah didaftarkan.`);
      await load();
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan";
    }
  });

  resetForm();
  load();
  qEl.focus();
}

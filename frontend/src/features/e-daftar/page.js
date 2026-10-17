import { schools, tingkatanOptions, okuOptions, registrationStatusOptions } from "./constants.js";
import { searchStudents, getStudent, createStudent, updateStudent } from "./api.js";
import { esc } from "../../shared/dom.js";

const STATUS_TEXT = { SUDAH: "Sudah daftar", BELUM: "Belum daftar" };
const okuText = (v) => (v === true ? "Ya" : v === false ? "Tidak" : "—");

export function renderEDaftar(root) {
  root.innerHTML = `
    <h1>e-Daftar</h1>
    <p class="muted">Pendaftaran murid dan kemas kini status daftar. Data ini dikongsi dengan e-Resit Koperasi.</p>

    <section class="card">
      <h2>Senarai murid</h2>
      <div class="toolbar">
        <input id="q" class="input" type="search" placeholder="Cari nama atau no. IC">
        <select id="school" class="input">
          <option value="">Semua sekolah rendah</option>
          ${schools.map((s) => `<option>${esc(s)}</option>`).join("")}
        </select>
        <select id="tingkatan" class="input">
          <option value="">Semua tingkatan</option>
          ${tingkatanOptions.map((t) => `<option value="${t}">Tingkatan ${t}</option>`).join("")}
        </select>
        <select id="status" class="input">
          <option value="">Semua status daftar</option>
          ${registrationStatusOptions.map((o) => `<option value="${o.value}">${o.label}</option>`).join("")}
        </select>
        <button id="new" class="btn primary" type="button">+ Tambah murid</button>
      </div>
      <p id="count" class="muted"></p>
      <div class="table-wrap"><table class="table wide">
        <thead><tr>
          <th>Nama Murid</th><th>No. IC</th><th>Ting.</th><th>Sekolah Rendah Asal</th>
          <th>OKU</th><th>Status Daftar</th><th>Penempatan Semula</th><th></th>
        </tr></thead>
        <tbody id="rows"></tbody>
      </table></div>
      <p class="notice">No. IC dipaparkan separa. Guna butang <strong>Kemas kini</strong> untuk mengubah status daftar atau maklumat murid.</p>
    </section>

    <section class="card" id="form-card">
      <h2 id="form-title">Daftar murid baharu</h2>
      <form id="student-form">
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
        <p id="form-ok" class="notice hidden"></p>
        <div class="toolbar">
          <button id="save" class="btn primary" type="submit">Simpan</button>
          <button id="cancel" class="btn hidden" type="button">Batal kemas kini</button>
          <button id="clear" class="btn" type="button">Kosongkan borang</button>
        </div>
      </form>
    </section>`;

  const form = root.querySelector("#student-form");
  const formCard = root.querySelector("#form-card");
  const formTitle = root.querySelector("#form-title");
  const msg = root.querySelector("#form-msg");
  const okMsg = root.querySelector("#form-ok");
  const saveBtn = root.querySelector("#save");
  const cancelBtn = root.querySelector("#cancel");
  const transferToggle = root.querySelector("#f-transfer");
  const transferBox = root.querySelector("#transfer-box");

  const qEl = root.querySelector("#q");
  const schoolEl = root.querySelector("#school");
  const tingkatanEl = root.querySelector("#tingkatan");
  const statusEl = root.querySelector("#status");
  const countEl = root.querySelector("#count");
  const rowsEl = root.querySelector("#rows");

  let editingId = null;
  let seq = 0;
  let timer;

  /* ----- Senarai murid ----- */
  async function update() {
    const mine = ++seq;
    countEl.textContent = "Memuatkan...";
    try {
      const { students, total, registeredTotal, notRegisteredTotal } = await searchStudents(qEl.value.trim(), {
        school: schoolEl.value,
        tingkatan: tingkatanEl.value,
        status: statusEl.value,
        limit: 100,
      });
      if (mine !== seq) return;
      countEl.textContent =
        (total > students.length ? `Menunjukkan ${students.length} daripada ${total} murid` : `${total} murid`) +
        ` · keseluruhan: ${registeredTotal} sudah daftar, ${notRegisteredTotal} belum daftar`;
      rowsEl.innerHTML = students.map((s) => `
        <tr>
          <td>${esc(s.name)}</td>
          <td class="nowrap">${esc(s.icMasked)}</td>
          <td class="num">${s.tingkatan ? esc(s.tingkatan) : "—"}</td>
          <td>${esc(s.formerPrimarySchool)}</td>
          <td>${esc(okuText(s.oku))}</td>
          <td>${esc(STATUS_TEXT[s.registrationStatus] ?? s.registrationStatus)}</td>
          <td>${s.transferSchool
            ? `<span title="${esc([s.transferReason, s.transferNotes].filter(Boolean).join(" — "))}">${esc(s.transferSchool)}</span>`
            : "—"}</td>
          <td><button class="btn small" type="button" data-id="${esc(s.studentId)}">Kemas kini</button></td>
        </tr>`).join("") || `<tr><td colspan="8" class="muted">Tiada padanan.</td></tr>`;
    } catch (err) {
      if (mine !== seq) return;
      countEl.textContent = "";
      rowsEl.innerHTML = `<tr><td colspan="8" class="error">${esc(err.message)}</td></tr>`;
    }
  }

  qEl.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(update, 300);
  });
  schoolEl.addEventListener("change", update);
  tingkatanEl.addEventListener("change", update);
  statusEl.addEventListener("change", update);

  /* ----- Borang ----- */
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
    form.reset(); // radio status kembali kepada "Belum daftar"
    formTitle.textContent = "Daftar murid baharu";
    cancelBtn.classList.add("hidden");
    msg.textContent = "";
    okMsg.classList.add("hidden");
    showTransfer(false);
  }

  function fillForm(s) {
    editingId = s.studentId;
    formTitle.textContent = `Kemas kini murid: ${s.name}`;
    root.querySelector("#f-school").value = s.formerPrimarySchool;
    root.querySelector("#f-name").value = s.name;
    root.querySelector("#f-ic").value = s.icNumber;
    root.querySelector("#f-tingkatan").value = s.tingkatan ?? "";
    setRadio("oku", s.oku === true ? "true" : s.oku === false ? "false" : "");
    setRadio("status", s.registrationStatus);
    root.querySelector("#f-transfer-school").value = s.transferSchool;
    root.querySelector("#f-transfer-reason").value = s.transferReason;
    root.querySelector("#f-transfer-notes").value = s.transferNotes;
    showTransfer(Boolean(s.transferSchool || s.transferReason || s.transferNotes));
    msg.textContent = "";
    okMsg.classList.add("hidden");
    cancelBtn.classList.remove("hidden");
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  rowsEl.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-id]");
    if (!btn) return;
    btn.disabled = true;
    try {
      const { student } = await getStudent(btn.dataset.id);
      fillForm(student);
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  root.querySelector("#new").addEventListener("click", () => {
    resetForm();
    formCard.scrollIntoView({ behavior: "smooth", block: "start" });
    root.querySelector("#f-name").focus();
  });
  root.querySelector("#clear").addEventListener("click", resetForm);
  cancelBtn.addEventListener("click", resetForm);
  transferToggle.addEventListener("change", () => showTransfer(transferToggle.checked));

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    okMsg.classList.add("hidden");

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
    saveBtn.textContent = "Menyimpan...";
    try {
      if (updating) await updateStudent(editingId, payload);
      else await createStudent(payload);
      resetForm();
      okMsg.textContent = updating ? "Maklumat murid dikemas kini." : "Murid baharu telah didaftarkan.";
      okMsg.classList.remove("hidden");
      await update();
    } catch (err) {
      msg.textContent = err.message;
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Simpan";
    }
  });

  resetForm();
  update();
}

// Student records come from e-Daftar: both features share one database.
import { searchStudents, getStudent } from "../e-daftar/api.js";
import { createReceipt, getItems } from "./api.js";
import { paymentMethods } from "./constants.js";
import { formatRM, grandTotal } from "../../shared/money.js";
import { esc, maskIC } from "../../shared/dom.js";
import { makeId } from "../../shared/id.js";
import { getDeviceStaffName, setDeviceStaffName } from "../../shared/staff-name.js";
import { loadingState } from "../../shared/feedback.js";
import { showStatus } from "../../shared/status.js";

/* Receipt counter.
   One page, four sections, and a bar pinned to the bottom that always shows the
   running total and the save action. Nobody has to scroll to find out what they
   are about to charge or how to finish. */

export async function renderNewReceipt(root, params = new URLSearchParams()) {
  const deviceStaffName = getDeviceStaffName();

  if (!deviceStaffName) {
    root.innerHTML = `
      <div class="page-head">
        <h1>Jana resit koperasi</h1>
        <p class="lede">Sebelum mula, simpan nama guru pada peranti ini. Nama ini akan
          dicetak pada setiap resit yang anda jana di sini.</p>
      </div>
      <section class="card" style="max-width:560px">
        <div class="field">
          <label class="label" for="receipt-staff-name">Nama guru</label>
          <input id="receipt-staff-name" class="input" type="text" autocomplete="name"
                 maxlength="80" placeholder="Contoh: Cikgu Ahmad"
                 aria-describedby="receipt-staff-name-help receipt-staff-name-error" required>
          <p class="hint" id="receipt-staff-name-help">Disimpan pada peranti ini sahaja.</p>
          <span class="err" id="receipt-staff-name-error"></span>
        </div>
        <button id="save-receipt-name" class="btn primary lg block" type="button">Simpan dan teruskan</button>
      </section>`;
    root.querySelector("#save-receipt-name").addEventListener("click", () => {
      const input = root.querySelector("#receipt-staff-name");
      if (!setDeviceStaffName(input.value)) {
        root.querySelector("#receipt-staff-name-error").textContent =
          "Sila isi nama guru, antara 2 dan 80 aksara.";
        input.setAttribute("aria-invalid", "true");
        input.focus();
        return;
      }
      renderNewReceipt(root, params);
    });
    return;
  }

  let student = null;
  let paymentMethod = "CASH";
  let bankRef = "";
  let confirmed = false;
  let lines = [];
  let items = [];
  let errorMsg = "";
  let saving = false;
  const requestId = makeId();

  root.innerHTML = `
    <div class="page-head">
      <h1>Jana resit koperasi</h1>
      <p class="lede">Guru: <strong>${esc(deviceStaffName)}</strong> · Pilih murid, tambah
        barangan, pilih bayaran, kemudian simpan.</p>
    </div>

    <ol class="steps" id="steps" aria-label="Langkah menjana resit">
      <li class="is-current"><span>Pilih murid</span></li>
      <li><span>Pilih barangan</span></li>
      <li><span>Pilih bayaran</span></li>
      <li><span>Semak dan simpan</span></li>
    </ol>

    <section class="step-block" id="step-1">
      <h2><span class="step-num">1</span> Pilih murid</h2>
      <p class="step-help">Cari menggunakan nama atau sekurang-kurangnya 2 digit No. IC.</p>
      <div id="student-box"></div>
    </section>

    <section class="step-block" id="step-2" hidden>
      <h2><span class="step-num">2</span> Pilih barangan</h2>
      <p class="step-help">Tambah setiap barangan yang dibeli. Kuantiti boleh diubah kemudian.</p>
      <div id="items-box">${loadingState("Sedang mendapatkan senarai barangan…")}</div>
    </section>

    <section class="step-block" id="step-3" hidden>
      <h2><span class="step-num">3</span> Pilih bayaran</h2>
      <p class="step-help">Pilih tunai atau pindahan bank. Pindahan bank memerlukan nombor rujukan.</p>
      <div id="payment-box"></div>
    </section>

    <section class="step-block" id="step-4" hidden>
      <h2><span class="step-num">4</span> Semak dan simpan</h2>
      <p class="step-help">Pastikan nama murid dan jumlah betul sebelum menyimpan.</p>
      <div id="summary-box"></div>
    </section>

    <div class="trolley no-print">
      <div class="trolley-in">
        <div class="trolley-info">
          <span class="trolley-label">Jumlah resit</span>
          <strong class="trolley-total" id="trolley-total">RM0.00</strong>
          <span class="trolley-note" id="trolley-note" role="status" aria-live="polite">Pilih murid untuk bermula.</span>
        </div>
        <button id="save" class="btn primary lg" type="button" disabled>Simpan Resit</button>
      </div>
    </div>`;

  document.body.classList.add("has-trolley");

  const $ = (sel) => root.querySelector(sel);
  const studentBox = $("#student-box");
  const itemsBox = $("#items-box");
  const paymentBox = $("#payment-box");
  const summaryBox = $("#summary-box");
  const step1 = $("#step-1");
  const step2 = $("#step-2");
  const step3 = $("#step-3");
  const step4 = $("#step-4");
  const stepList = $("#steps");
  const trolleyTotal = $("#trolley-total");
  const trolleyNote = $("#trolley-note");
  const saveBtn = $("#save");

  const itemOf = (id) => items.find((i) => i.itemId === id);
  const unitPrice = (item) => item?.priceSen ?? 0;
  const initials = (name) =>
    String(name).trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  /* ----- progress ----- */
  function syncProgress() {
    const hasStudent = Boolean(student);
    const hasLines = lines.length > 0;
    const done = hasStudent && hasLines && confirmed;

    step2.hidden = !hasStudent;
    step3.hidden = !hasStudent || !hasLines;
    step4.hidden = !hasStudent || !hasLines;

    const marks = stepList.querySelectorAll("li");
    marks.forEach((li, i) => {
      li.classList.toggle("is-done", i === 0 ? hasStudent : i === 1 ? hasLines : i === 2 ? confirmed : false);
      li.classList.toggle("is-current", i === (hasStudent ? (hasLines ? (confirmed ? 3 : 2) : 1) : 0));
    });

    trolleyNote.textContent = !hasStudent
      ? "Pilih murid untuk bermula."
      : !hasLines
        ? "Seterusnya, tambah barangan."
        : !confirmed
          ? "Sahkan pembayaran di langkah 4."
          : "Sedia untuk disimpan.";
  }

  /* ----- 1. student ----- */
  function renderStudentBox({ focusSearch = false } = {}) {
    if (student) {
      studentBox.innerHTML = `
        <div class="receipt-picked">
          <span class="avatar" aria-hidden="true">${esc(initials(student.name))}</span>
          <div class="picked-body">
            <strong>${esc(student.name)}</strong>
            <span class="muted tiny">${esc(student.icMasked)} · ${esc(student.formerPrimarySchool)}</span>
          </div>
          <button class="btn secondary" id="change-student" type="button">Tukar</button>
        </div>`;
      studentBox.querySelector("#change-student").addEventListener("click", () => {
        student = null;
        lines = [];
        confirmed = false;
        bankRef = "";
        renderStudentBox({ focusSearch: true });
        renderPayment();
        renderSummary();
      });
      return;
    }

    studentBox.innerHTML = `
      <label class="search">
        <span class="sr-only">Cari murid</span>
        <input id="student-search" class="input" type="search" autocomplete="off"
               placeholder="Nama atau No. IC murid"
               aria-label="Cari murid Tingkatan 1 mengikut nama atau nombor IC">
        <button id="clear-student-search" class="clear" type="button" hidden>Kosongkan</button>
      </label>
      <div id="student-results" class="search-results" role="region"
           aria-label="Hasil carian murid" aria-live="polite"></div>`;

    const input = studentBox.querySelector("#student-search");
    const clear = studentBox.querySelector("#clear-student-search");
    const results = studentBox.querySelector("#student-results");
    let found = [];
    let seq = 0;
    let timer;

    const choose = (s) => {
      student = s;
      confirmed = false;
      renderStudentBox();
      renderSummary();
    };

    input.addEventListener("input", () => {
      clear.hidden = !input.value;
      clearTimeout(timer);
      const value = input.value.trim();
      const mine = ++seq;
      found = [];
      if (value.length < 2) {
        results.innerHTML = value
          ? `<p class="muted tiny" role="status">Taip sekurang-kurangnya 2 aksara.</p>`
          : "";
        return;
      }
      results.innerHTML = `<p class="muted tiny" role="status">Mencari murid…</p>`;
      timer = setTimeout(async () => {
        try {
          const data = await searchStudents(value, { limit: 8 });
          if (mine !== seq) return;
          found = data.students;
          results.innerHTML = found.length
            ? found.map((s) => `
              <button type="button" data-id="${esc(s.studentId)}">
                <span class="sr-name">${esc(s.name)}</span>
                <span class="sr-meta">${esc(s.icMasked)} · ${esc(s.formerPrimarySchool)}</span>
              </button>`).join("")
            : `<p class="muted tiny">Tiada murid sepadan. Semak ejaan atau nombor IC.</p>`;
        } catch (err) {
          if (mine !== seq) return;
          const offline = !err.status || /rangkaian|internet|terlalu lama/i.test(err.message);
          results.innerHTML = `<div class="fail" role="alert">
            <strong class="fail-title">${offline ? "Sambungan terganggu" : "Carian belum tersedia"}</strong>
            <span class="fail-text">${offline ? "Semak internet dan cuba semula." : "Pelayan belum dapat mencari murid."}</span>
            <button class="btn secondary" type="button" data-retry-students>Cuba semula</button>
          </div>`;
        }
      }, 250);
    });

    clear.addEventListener("click", () => {
      input.value = "";
      clear.hidden = true;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });

    results.addEventListener("click", (e) => {
      if (e.target.closest("[data-retry-students]")) {
        input.dispatchEvent(new Event("input"));
        return;
      }
      const btn = e.target.closest("[data-id]");
      if (!btn) return;
      const picked = found.find((s) => s.studentId === btn.dataset.id);
      if (picked) choose(picked);
    });

    if (focusSearch) input.focus();
  }

  /* ----- 2. items ----- */
  function renderItemsBox() {
    if (!items.length) {
      itemsBox.innerHTML = `<div class="record-empty">
        <p>Tiada barangan aktif untuk dipilih.</p>
        <p class="muted tiny">Hubungi pentadbir koperasi untuk mengaktifkan barangan.</p>
      </div>`;
      return;
    }

    itemsBox.innerHTML = `<ul class="item-list">
      ${items.map((i) => {
        const line = lines.find((l) => l.itemId === i.itemId);
        return `<li class="item-row${line ? " in-cart" : ""}" data-item="${esc(i.itemId)}">
          <div>
            <span class="item-name">${esc(i.name)}</span>
            ${line ? `<span class="pill brand" style="margin-left:var(--s2)">${line.quantity} dalam resit</span>` : ""}
          </div>
          <span class="item-price">${formatRM(i.priceSen)}</span>
          <div class="item-controls">
            ${i.fixedQuantity
              ? `<span class="pill">Tetap ${i.fixedQuantity}</span>`
              : `<div class="stepper">
                   <button class="qty-minus" type="button" aria-label="Kurangkan kuantiti ${esc(i.name)}" disabled>−</button>
                   <input class="qty" type="number" min="1" max="99" value="1" inputmode="numeric"
                          aria-label="Kuantiti ${esc(i.name)}">
                   <button class="qty-plus" type="button" aria-label="Tambah kuantiti ${esc(i.name)}">+</button>
                 </div>`}
            <button class="btn ${line ? "secondary" : "primary"} sm add" type="button">
              ${line ? "Tambah lagi" : "Tambah"}
            </button>
          </div>
        </li>`;
      }).join("")}
    </ul>`;
  }

  itemsBox.addEventListener("click", (e) => {
    if (e.target.closest("[data-retry-items]")) { loadItems(); return; }

    const stepBtn = e.target.closest(".qty-minus, .qty-plus");
    if (stepBtn) {
      const stepper = stepBtn.closest(".stepper");
      const input = stepper.querySelector(".qty");
      const delta = stepBtn.classList.contains("qty-minus") ? -1 : 1;
      const next = Math.min(99, Math.max(1, (parseInt(input.value, 10) || 1) + delta));
      input.value = next;
      stepper.querySelector(".qty-minus").disabled = next <= 1;
      stepper.querySelector(".qty-plus").disabled = next >= 99;
      return;
    }

    const btn = e.target.closest(".add");
    if (!btn) return;
    const row = btn.closest("li.item-row");
    const item = itemOf(row.dataset.item);
    if (!item) return;

    const quantity = item.fixedQuantity ?? parseInt(row.querySelector(".qty")?.value ?? "1", 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      showStatus({ type: "warn", title: "Kuantiti tidak sah", message: "Kuantiti mesti antara 1 dan 99." });
      return;
    }

    const existing = lines.find((l) => l.itemId === item.itemId);
    if (existing) existing.quantity = item.fixedQuantity ?? Math.min(99, existing.quantity + quantity);
    else lines.push({ itemId: item.itemId, quantity });

    confirmed = false;
    renderItemsBox();
    renderSummary();
  });

  /* ----- 3. payment ----- */
  function renderPayment() {
    paymentBox.innerHTML = `
      <div class="pay-options">
        ${paymentMethods.map((p) => `
          <label class="choice">
            <input type="radio" name="pay" value="${esc(p.value)}"${p.value === paymentMethod ? " checked" : ""}>
            <span class="choice-body"><span class="choice-title">${esc(p.label)}</span></span>
          </label>`).join("")}
      </div>
      <div class="field" id="bankref-field" style="margin-top:var(--s4);margin-bottom:0"${paymentMethod === "BANK_TRANSFER" ? "" : " hidden"}>
        <label class="label" for="bankref">No. rujukan pindahan</label>
        <input id="bankref" class="input" type="text" autocomplete="off" maxlength="60"
               placeholder="Contoh: MBB2026010112345" value="${esc(bankRef)}">
        <p class="hint">Salin nombor rujukan daripada slip atau penyata bank.</p>
      </div>`;

    paymentBox.querySelectorAll("input[name=pay]").forEach((el) => {
      el.addEventListener("change", () => {
        paymentMethod = el.value;
        confirmed = false;
        paymentBox.querySelector("#bankref-field").hidden = paymentMethod !== "BANK_TRANSFER";
        renderSummary();
      });
    });

    paymentBox.querySelector("#bankref")?.addEventListener("input", (e) => {
      bankRef = e.target.value;
      confirmed = false;
      renderSummary();
    });
  }

  /* ----- 4. review ----- */
  function renderSummary() {
    const total = grandTotal(lines.map((l) => ({
      quantity: l.quantity,
      unitPriceSen: unitPrice(itemOf(l.itemId)),
    })));

    const needsRef = paymentMethod === "BANK_TRANSFER" && bankRef.trim().length === 0;
    const ready = Boolean(student) && lines.length > 0 && confirmed && !saving && !needsRef;

    summaryBox.innerHTML = `
      <div class="card-soft" style="margin-bottom:var(--s4)">
        <div class="spread">
          <div>
            <span class="stat-label">Murid</span>
            <strong>${student ? esc(student.name) : "Belum dipilih"}</strong>
            ${student ? `<span class="muted tiny" style="display:block">${esc(student.icMasked)} · ${esc(student.formerPrimarySchool)}</span>` : ""}
          </div>
          <div style="text-align:right">
            <span class="stat-label">Bayaran</span>
            <strong>${esc(paymentMethods.find((p) => p.value === paymentMethod)?.label ?? "—")}</strong>
            ${paymentMethod === "BANK_TRANSFER"
              ? `<span class="muted tiny" style="display:block">${bankRef.trim() ? esc(bankRef.trim()) : "Rujukan belum diisi"}</span>`
              : ""}
          </div>
        </div>
      </div>

      ${lines.length ? `
        <table class="summary-table">
          <caption class="sr-only">Barangan dalam resit</caption>
          <thead class="sr-only"><tr><th scope="col">Barangan</th><th scope="col">Kuantiti</th><th scope="col">Jumlah kecil</th><th scope="col">Tindakan</th></tr></thead>
          <tbody>
            ${lines.map((l) => {
              const item = itemOf(l.itemId);
              const price = unitPrice(item);
              return `<tr>
                <td>${esc(item.name)}<br><span class="muted tiny">${formatRM(price)} setiap satu</span></td>
                <td class="summary-line-qty">
                  ${item.fixedQuantity
                    ? `<span class="pill">${item.fixedQuantity}</span>`
                    : `<input class="input line-qty" type="number" min="1" max="99" value="${l.quantity}"
                        data-key="${esc(l.itemId)}" aria-label="Kuantiti ${esc(item.name)}">`}
                </td>
                <td class="num">${formatRM(l.quantity * price)}</td>
                <td style="text-align:right">
                  <button class="summary-remove" type="button" data-key="${esc(l.itemId)}"
                          aria-label="Buang ${esc(item.name)}">✕</button>
                </td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>
        <div class="total-line">
          <span class="label">Jumlah keseluruhan</span>
          <span class="value">${formatRM(total)}</span>
        </div>` : `<p class="muted">Belum ada barangan. Tambah di langkah 2.</p>`}

      <label class="choice" style="margin-top:var(--s4)">
        <input type="checkbox" id="confirm"${confirmed ? " checked" : ""}>
        <span class="choice-body">
          <span class="choice-title">Pembayaran telah disahkan</span>
          <span class="choice-note">Saya telah menerima bayaran mengikut prosedur koperasi.</span>
        </span>
      </label>

      ${errorMsg ? `<p class="err" role="alert">${esc(errorMsg)}</p>` : ""}`;

    // The trolley mirrors the same state, so the total is visible everywhere.
    trolleyTotal.textContent = formatRM(total);
    saveBtn.disabled = !ready;
    saveBtn.textContent = saving ? "Menyimpan…" : "Simpan Resit";
    saveBtn.setAttribute("aria-describedby", "trolley-note");

    summaryBox.querySelector("#confirm")?.addEventListener("change", (e) => {
      confirmed = e.target.checked;
      errorMsg = "";
      renderSummary();
    });

    summaryBox.querySelectorAll(".line-qty").forEach((el) => {
      el.addEventListener("change", () => {
        const line = lines.find((l) => l.itemId === el.dataset.key);
        const quantity = parseInt(el.value, 10);
        if (line && Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
          line.quantity = quantity;
          errorMsg = "";
          confirmed = false;
        } else {
          errorMsg = "Kuantiti mesti antara 1 dan 99.";
        }
        renderSummary();
      });
    });

    summaryBox.querySelectorAll(".summary-remove").forEach((el) => {
      el.addEventListener("click", () => {
        lines = lines.filter((l) => l.itemId !== el.dataset.key);
        confirmed = false;
        renderItemsBox();
        renderSummary();
      });
    });

    syncProgress();
  }

  /* ----- save ----- */
  saveBtn.addEventListener("click", async () => {
    if (saving || saveBtn.disabled) return;
    saving = true;
    errorMsg = "";
    renderSummary();

    try {
      const { receipt } = await createReceipt({
        requestId,
        studentId: student.studentId,
        staffName: deviceStaffName,
        paymentMethod,
        bankRef: paymentMethod === "BANK_TRANSFER" ? bankRef.trim() : undefined,
        lines: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity })),
      });
      location.hash = `/resit/${receipt.receiptId}`;
      return;
    } catch (err) {
      errorMsg = err.status
        ? err.message
        : `${err.message} Semak Laporan dahulu, kerana resit mungkin telah disimpan.`;
    }

    saving = false;
    renderSummary();
  });

  /* ----- items load ----- */
  async function loadItems() {
    itemsBox.innerHTML = loadingState("Sedang mendapatkan senarai barangan…");
    try {
      const data = await getItems();
      items = data.items.filter((i) => i.active);
      renderItemsBox();
    } catch (err) {
      const offline = !err.status || /rangkaian|internet|terlama|terlalu lama/i.test(err.message);
      itemsBox.innerHTML = `<div class="fail" role="alert">
        <strong class="fail-title">${offline ? "Sambungan terganggu" : "Barangan belum tersedia"}</strong>
        <span class="fail-text">${offline ? "Semak internet dan cuba semula." : "Senarai barangan belum dapat dimuatkan."}</span>
        <button class="btn secondary" type="button" data-retry-items>Cuba semula</button>
      </div>`;
    }
  }

  renderStudentBox();
  renderPayment();
  renderSummary();

  // A link from an old receipt can pre-select the same student.
  const preselectId = params.get?.("student");
  if (preselectId) {
    try {
      const { student: s } = await getStudent(preselectId);
      student = {
        studentId: s.studentId,
        name: s.name,
        icMasked: maskIC(s.icNumber),
        formerPrimarySchool: s.formerPrimarySchool,
        tingkatan: s.tingkatan,
      };
      renderStudentBox();
      renderSummary();
    } catch {
      /* The counter can search manually. */
    }
  }

  await loadItems();
}

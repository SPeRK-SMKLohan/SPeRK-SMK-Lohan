// Senarai murid datang daripada e-Daftar: kedua-dua ciri berkongsi satu pangkalan data.
import { searchStudents, getStudent } from "../e-daftar/api.js";
import { createReceipt, getItems } from "./api.js";
import { paymentMethods } from "./constants.js";
import { formatRM, grandTotal } from "../../shared/money.js";
import { esc, maskIC } from "../../shared/dom.js";
import { makeId } from "../../shared/id.js";

export async function renderNewReceipt(root, params = new URLSearchParams()) {
  let student = null;
  let paymentMethod = "CASH"; // Tunai ialah kaedah paling kerap di kaunter koperasi.
  let bankRef = "";
  let confirmed = false;
  let lines = []; // { itemId, quantity }
  let items = [];
  let errorMsg = "";
  let saving = false;
  const requestId = makeId(); // satu ID untuk resit ini; mengelakkan resit pendua

  root.innerHTML = `
    <div class="page-head">
      <h1>e-Resit Koperasi</h1>
      <p class="muted">Pilih murid, tambah barangan, pilih bayaran dan semak sebelum simpan.</p>
    </div>
    <p id="receipt-progress" class="receipt-progress" role="status" aria-live="polite"></p>
    <div class="receipt-layout">
      <div>
        <section class="card receipt-step"><h2 class="step"><span class="step-num">1</span>Pilih murid</h2><p class="muted step-help">Cari nama atau nombor IC. Semak sekolah rendah sebelum memilih.</p><div id="student-box"></div></section>
        <section id="receipt-step-items" class="card receipt-step hidden"><h2 class="step"><span class="step-num">2</span>Pilih barangan</h2><p class="muted step-help">Tambah setiap barangan yang dibeli. Kuantiti boleh diubah sebelum resit disimpan.</p><div id="items-box"><p class="muted">Memuatkan barangan...</p></div></section>
        <section id="receipt-step-payment" class="card receipt-step hidden"><h2 class="step"><span class="step-num">3</span>Pilih bayaran</h2><p class="muted step-help">Pilih tunai atau pindahan bank. Pindahan bank memerlukan nombor rujukan.</p><div id="payment-box"></div></section>
      </div>
      <aside>
        <section id="receipt-step-review" class="card sticky hidden"><h2 class="step"><span class="step-num">4</span>Semak dan simpan</h2><p class="muted step-help">Pastikan nama murid dan jumlah betul sebelum menyimpan resit.</p><div id="summary-box"></div></section>
      </aside>
    </div>`;

  const studentBox = root.querySelector("#student-box");
  const itemsBox = root.querySelector("#items-box");
  const paymentBox = root.querySelector("#payment-box");
  const summaryBox = root.querySelector("#summary-box");
  const itemsStep = root.querySelector("#receipt-step-items");
  const paymentStep = root.querySelector("#receipt-step-payment");
  const reviewStep = root.querySelector("#receipt-step-review");
  const progress = root.querySelector("#receipt-progress");

  function syncReceiptSteps() {
    const hasStudent = Boolean(student);
    const hasLines = lines.length > 0;
    itemsStep.classList.toggle("hidden", !hasStudent);
    paymentStep.classList.toggle("hidden", !hasStudent || !hasLines);
    reviewStep.classList.toggle("hidden", !hasStudent || !hasLines);
    progress.textContent = !hasStudent
      ? "Langkah 1 daripada 4: pilih murid untuk bermula."
      : !hasLines
        ? "Langkah 2 daripada 4: pilih barangan yang dibeli."
        : !confirmed
          ? "Langkah 3 daripada 4: pilih kaedah bayaran, kemudian semak jumlah."
          : "Langkah 4 daripada 4: semak nama dan jumlah, kemudian simpan resit.";
  }

  const itemOf = (id) => items.find((i) => i.itemId === id);
  const keyOf = (l) => l.itemId;

  // Harga seunit diambil daripada senarai barangan rasmi.
  const unitPrice = (item) => item?.priceSen ?? 0;

  const initials = (name) =>
    String(name).trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  /* ----- 1. Murid ----- */
  function renderStudentBox({ focusSearch = false } = {}) {
    if (student) {
      studentBox.innerHTML = `
        <div class="selected">
          <span class="avatar" aria-hidden="true">${esc(initials(student.name))}</span>
          <div class="selected-info">
            <strong>${esc(student.name)}</strong>${student.tingkatan ? `<span class="tag">T${esc(student.tingkatan)}</span>` : ""}<br>
            <span class="muted">${esc(student.icMasked)} · ${esc(student.formerPrimarySchool)}</span>
          </div>
          <button class="btn small" id="change-student" type="button">Tukar</button>
        </div>`;
      studentBox.insertAdjacentHTML("beforeend", `<p class="notice ok">Murid dipilih. Seterusnya, pilih barangan di bawah.</p>`);
      studentBox.querySelector("#change-student").addEventListener("click", () => {
        student = null;
        lines = [];
        confirmed = false;
        bankRef = "";
        renderStudentBox({ focusSearch: true });
        renderItemsBox();
        renderSummary();
      });
      return;
    }

    studentBox.innerHTML = `
      <div class="search-field">
        <input id="student-search" class="input" type="search" autocomplete="off"
               aria-label="Cari murid Tingkatan 1 mengikut nama atau nombor IC"
               placeholder="Nama atau sekurang-kurangnya 2 digit No. IC">
        <button id="clear-student-search" class="clear-search" type="button" aria-label="Kosongkan carian murid" hidden>Kosongkan</button>
      </div>
      <div id="student-results" class="results"></div>`;
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
        results.innerHTML = value ? `<p class="muted" role="status">Taip sekurang-kurangnya 2 aksara untuk mencari.</p>` : "";
        return;
      }
      results.innerHTML = `<p class="muted" role="status">Mencari murid…</p>`;
      timer = setTimeout(async () => {
        try {
          const data = await searchStudents(value, { limit: 8 });
          if (mine !== seq) return;
          found = data.students;
          results.innerHTML = found.map((s) => `
            <button type="button" class="result" data-id="${esc(s.studentId)}">
              <strong>${esc(s.name)}</strong>
              <span class="muted">${esc(s.icMasked)}${s.tingkatan ? ` · Tingkatan ${esc(s.tingkatan)}` : ""} · ${esc(s.formerPrimarySchool)}</span>
            </button>`).join("") || `<p class="muted">Tiada padanan.</p>`;
        } catch (err) {
          if (mine !== seq) return;
          const isConnectionError = !err.status || /rangkaian|internet|terlalu lama/i.test(err.message);
          results.innerHTML = `<div class="load-error" role="alert"><strong>${isConnectionError ? "Sambungan terganggu" : "Carian belum tersedia"}</strong><span>${isConnectionError ? "Semak internet dan cuba semula." : "Pelayan belum dapat mencari murid."}</span><button class="btn" type="button" data-retry-students>Cuba semula carian</button></div>`;
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

  /* ----- 2. Barangan ----- */
  function renderItemsBox() {
    if (!items.length) {
      itemsBox.innerHTML = `<p class="muted">Tiada barangan aktif untuk dipilih. Hubungi pentadbir koperasi.</p>`;
      return;
    }
    itemsBox.innerHTML = `
      <div class="table-wrap"><table class="table receipt-item-table">
        <thead><tr><th>Item</th><th class="num">Harga</th><th class="num">Kuantiti</th><th></th></tr></thead>
        <tbody>${items.map((i) => {
          const line = lines.find((l) => l.itemId === i.itemId);
          return `
          <tr data-item="${esc(i.itemId)}"${line ? ' class="row-in-cart"' : ""}>
              <td data-label="Barangan">${esc(i.name)}${line ? ` <span class="badge cart">${line.quantity} dalam resit</span>` : ""}</td>
            <td class="num" data-label="Harga">${formatRM(i.priceSen)}</td>
            <td class="num" data-label="Kuantiti">${i.fixedQuantity
              ? `<span class="fixed-qty">${i.fixedQuantity}</span>`
              : `<div class="stepper">
                   <button class="step-btn qty-minus" type="button" aria-label="Kurangkan kuantiti ${esc(i.name)}" disabled>−</button>
                   <input class="input qty" type="number" min="1" max="99" value="1" aria-label="Kuantiti ${esc(i.name)}">
                   <button class="step-btn qty-plus" type="button" aria-label="Tambah kuantiti ${esc(i.name)}">+</button>
                 </div>`}</td>
            <td data-label="Tindakan"><button class="btn small primary add" type="button">${line ? "Tambah lagi" : "Tambah"}</button></td>
          </tr>`;
        }).join("")}
        </tbody>
      </table></div>`;
  }

  itemsBox.addEventListener("click", (e) => {
    if (e.target.closest("[data-retry-items]")) {
      loadItems();
      return;
    }
    // Butang naik/turun kuantiti (stepper).
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
    const row = btn.closest("tr");
    const item = itemOf(row.dataset.item);
    if (!item) return;

    const quantity = item.fixedQuantity ?? parseInt(row.querySelector(".qty")?.value ?? "1", 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      errorMsg = "Kuantiti mesti antara 1 dan 99.";
      renderSummary();
      return;
    }
    errorMsg = "";

    const existing = lines.find((l) => keyOf(l) === item.itemId);
    if (existing) {
      existing.quantity = item.fixedQuantity ?? Math.min(99, existing.quantity + quantity);
    } else {
      lines.push({ itemId: item.itemId, quantity });
    }
    confirmed = false;
    renderItemsBox(); // tanda "dalam resit" pada baris item
    renderSummary();
  });

  /* ----- 3. Pembayaran ----- */
  paymentBox.innerHTML = `
    ${paymentMethods.map((p) => `
      <label class="pay-option">
        <input type="radio" name="pay" value="${esc(p.value)}"${p.value === paymentMethod ? " checked" : ""}>
        <strong>${esc(p.label)}</strong>
      </label>`).join("")}
    <label id="bankref-label" class="bankref hidden">No. Rujukan pindahan
      <input id="bankref" class="input" type="text" autocomplete="off" maxlength="60"
             placeholder="Contoh: MBB2026010112345">
    </label>`;

  const bankRefLabel = paymentBox.querySelector("#bankref-label");
  const bankRefInput = paymentBox.querySelector("#bankref");

  paymentBox.addEventListener("change", (e) => {
    if (e.target.name === "pay") {
      paymentMethod = e.target.value;
      confirmed = false;
      bankRefLabel.classList.toggle("hidden", paymentMethod !== "BANK_TRANSFER");
      renderSummary();
    }
  });
  bankRefInput.addEventListener("input", () => {
    bankRef = bankRefInput.value;
    confirmed = false;
    renderSummary();
  });

  /* ----- Ringkasan ----- */
  function renderSummary() {
    // Jumlah di sini hanya sementara. Pelayan mengira semula daripada harga sebenar.
    const total = grandTotal(lines.map((l) => ({
      quantity: l.quantity,
      unitPriceSen: unitPrice(itemOf(l.itemId)),
    })));
    const payLabel = paymentMethods.find((p) => p.value === paymentMethod)?.label;
    const needsRef = paymentMethod === "BANK_TRANSFER" && bankRef.trim().length === 0;
    const ready = student && lines.length > 0 && paymentMethod && confirmed && !saving && !needsRef;

    summaryBox.innerHTML = `
      <div class="receiver">
        <span class="receiver-label">Murid</span>
        <strong>${student ? esc(student.name) : "Belum dipilih"}</strong>
      </div>
      ${lines.length ? `
        <table class="table compact receipt-summary-table">
          <thead class="sr-only"><tr><th scope="col">Barangan</th><th scope="col">Kuantiti</th><th scope="col">Jumlah kecil</th><th scope="col">Tindakan</th></tr></thead>
          <tbody>${lines.map((l) => {
            const item = itemOf(l.itemId);
            const price = unitPrice(item);
            return `
              <tr>
                <td data-label="Barangan">${esc(item.name)}<br>
                  <span class="muted">${formatRM(price)} setiap satu</span></td>
                <td data-label="Kuantiti">${item.fixedQuantity
                  ? `<span class="fixed-qty" data-label="Kuantiti">${item.fixedQuantity}</span>`
                  : `<input class="input line-qty" type="number" min="1" max="99"
                       value="${l.quantity}" data-key="${esc(keyOf(l))}">`}</td>
                <td class="num" data-label="Jumlah kecil">${formatRM(l.quantity * price)}</td>
                <td><button class="btn small remove" type="button" data-key="${esc(keyOf(l))}" aria-label="Buang ${esc(item.name)}" title="Buang">✕</button></td>
              </tr>`;
          }).join("")}</tbody>
        </table>` : `<p class="muted">Belum ada barangan.</p>`}
      <p class="total">Jumlah <strong>${formatRM(total)}</strong></p>
      <p class="sum-row"><span>Bayaran</span><strong>${payLabel ? esc(payLabel) : "Belum dipilih"}</strong></p>
      ${paymentMethod === "BANK_TRANSFER" ? `<p class="sum-row"><span>No. Rujukan</span><strong>${bankRef.trim() ? esc(bankRef.trim()) : "Belum diisi"}</strong></p>` : ""}
      <label class="check receipt-confirm">
        <input type="checkbox" id="confirm" ${confirmed ? "checked" : ""}>
        Pembayaran telah disahkan mengikut prosedur koperasi
      </label>
      ${errorMsg ? `<p class="error">${esc(errorMsg)}</p>` : ""}
      <button id="save" class="btn primary block" type="button" ${ready ? "" : "disabled"}>
        ${saving ? "Menyimpan..." : "Simpan Resit"}
      </button>`;
    syncReceiptSteps();
  }

  summaryBox.addEventListener("click", (e) => {
    const remove = e.target.closest(".remove");
    if (remove) {
      lines = lines.filter((l) => keyOf(l) !== remove.dataset.key);
      confirmed = false;
      renderItemsBox();
      renderSummary();
      return;
    }
    if (e.target.closest("#save")) save();
  });

  summaryBox.addEventListener("change", (e) => {
    if (e.target.id === "confirm") {
      confirmed = e.target.checked;
      renderSummary();
      summaryBox.querySelector("#confirm")?.focus({ preventScroll: true });
      return;
    }
    if (e.target.classList.contains("line-qty")) {
      const line = lines.find((l) => keyOf(l) === e.target.dataset.key);
      const quantity = parseInt(e.target.value, 10);
      if (line && Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
        line.quantity = quantity;
        errorMsg = "";
        confirmed = false;
      } else {
        errorMsg = "Kuantiti mesti antara 1 dan 99.";
      }
      renderSummary();
    }
  });

  async function save() {
    if (saving) return;
    saving = true;
    errorMsg = "";
    renderSummary();
    try {
      // Hanya ID barangan dan kuantiti dihantar. Pelayan menentukan harga dan jumlah.
      const { receipt } = await createReceipt({
        requestId,
        studentId: student.studentId,
        paymentMethod,
        bankRef: paymentMethod === "BANK_TRANSFER" ? bankRef.trim() : undefined,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          quantity: l.quantity,
        })),
      });
      location.hash = `/resit/${receipt.receiptId}`;
      return;
    } catch (err) {
      errorMsg = err.status
        ? err.message
        : `${err.message} Semak Sejarah Resit dahulu, kerana resit mungkin telah disimpan.`;
    }
    saving = false;
    renderSummary();
  }

  renderStudentBox();
  renderSummary();

  // Pratanda murid daripada pautan "Resit baharu (murid sama)" pada resit lama.
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
      // Abaikan: kaunter boleh cari murid secara manual.
    }
  }

  await loadItems();

  async function loadItems() {
    itemsBox.innerHTML = `<p class="muted" role="status">Memuatkan barangan…</p>`;
    try {
      const data = await getItems();
      items = data.items.filter((i) => i.active);
      renderItemsBox();
    } catch (err) {
      const isConnectionError = !err.status || /rangkaian|internet|terlalu lama/i.test(err.message);
      itemsBox.innerHTML = `<div class="load-error" role="alert"><strong>${isConnectionError ? "Sambungan terganggu" : "Barangan belum tersedia"}</strong><span>${isConnectionError ? "Semak internet dan cuba semula." : "Senarai barangan belum dapat dimuatkan."}</span><button class="btn" type="button" data-retry-items>Cuba semula</button></div>`;
    }
  }
}

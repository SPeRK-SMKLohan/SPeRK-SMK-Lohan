import { getItems, searchStudents, createReceipt } from "../services.js";
import { paymentMethods } from "../data/constants.js";
import { formatRM, grandTotal } from "../utils/money.js";
import { esc } from "../utils/dom.js";
import { makeId } from "../utils/id.js";

export async function renderNewReceipt(root) {
  let student = null;
  let paymentMethod = "";
  let confirmed = false;
  let lines = []; // { itemId, size, quantity }
  let items = [];
  let errorMsg = "";
  let saving = false;
  const requestId = makeId(); // satu ID untuk resit ini; mengelakkan resit pendua

  root.innerHTML = `
    <h1>Jana Resit</h1>
    <div class="receipt-layout">
      <div>
        <section class="card"><h2>1. Murid</h2><div id="student-box"></div></section>
        <section class="card"><h2>2. Barangan</h2><div id="items-box"><p class="muted">Memuatkan...</p></div></section>
        <section class="card"><h2>3. Kaedah pembayaran</h2><div id="payment-box"></div></section>
      </div>
      <aside>
        <section class="card sticky"><h2>Ringkasan</h2><div id="summary-box"></div></section>
      </aside>
    </div>`;

  const studentBox = root.querySelector("#student-box");
  const itemsBox = root.querySelector("#items-box");
  const paymentBox = root.querySelector("#payment-box");
  const summaryBox = root.querySelector("#summary-box");

  const itemOf = (id) => items.find((i) => i.itemId === id);
  const keyOf = (l) => `${l.itemId}|${l.size}`;

  /* ----- 1. Murid ----- */
  function renderStudentBox() {
    if (student) {
      studentBox.innerHTML = `
        <div class="selected">
          <div>
            <strong>${esc(student.name)}</strong><br>
            <span class="muted">${esc(student.icMasked)} · ${esc(student.formerPrimarySchool)}</span>
          </div>
          <button class="btn small" id="change-student" type="button">Tukar</button>
        </div>`;
      studentBox.querySelector("#change-student").addEventListener("click", () => {
        student = null;
        renderStudentBox();
        renderSummary();
      });
      return;
    }

    studentBox.innerHTML = `
      <input id="student-search" class="input" type="search" autocomplete="off"
             placeholder="Cari nama atau no. IC (sekurang-kurangnya 2 aksara)">
      <div id="student-results" class="results"></div>`;
    const input = studentBox.querySelector("#student-search");
    const results = studentBox.querySelector("#student-results");
    let found = [];
    let seq = 0;
    let timer;

    input.addEventListener("input", () => {
      clearTimeout(timer);
      const value = input.value.trim();
      const mine = ++seq;
      if (value.length < 2) {
        results.innerHTML = "";
        return;
      }
      timer = setTimeout(async () => {
        results.innerHTML = `<p class="muted">Mencari...</p>`;
        try {
          const data = await searchStudents(value, { limit: 8 });
          if (mine !== seq) return;
          found = data.students;
          results.innerHTML = found.map((s) => `
            <button type="button" class="result" data-id="${esc(s.studentId)}">
              <strong>${esc(s.name)}</strong>
              <span class="muted">${esc(s.icMasked)} · ${esc(s.formerPrimarySchool)}</span>
            </button>`).join("") || `<p class="muted">Tiada padanan.</p>`;
        } catch (err) {
          if (mine !== seq) return;
          results.innerHTML = `<p class="error">${esc(err.message)}</p>`;
        }
      }, 300);
    });

    results.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-id]");
      if (!btn) return;
      student = found.find((s) => s.studentId === btn.dataset.id) ?? null;
      renderStudentBox();
      renderSummary();
    });

    input.focus();
  }

  /* ----- 2. Barangan ----- */
  function renderItemsBox() {
    itemsBox.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Item</th><th class="num">Harga</th><th>Saiz</th><th>Kuantiti</th><th></th></tr></thead>
        <tbody>${items.map((i) => `
          <tr data-item="${esc(i.itemId)}">
            <td>${esc(i.name)}</td>
            <td class="num">${formatRM(i.priceSen)}</td>
            <td>${i.sizes
              ? `<select class="input size">${i.sizes.map((s) => `<option>${esc(s)}</option>`).join("")}</select>`
              : "-"}</td>
            <td><input class="input qty" type="number" min="1" max="99" value="1"></td>
            <td><button class="btn small add" type="button">Tambah</button></td>
          </tr>`).join("")}
        </tbody>
      </table></div>`;
  }

  itemsBox.addEventListener("click", (e) => {
    const btn = e.target.closest(".add");
    if (!btn) return;
    const row = btn.closest("tr");
    const qtyInput = row.querySelector(".qty");
    const quantity = parseInt(qtyInput.value, 10);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      errorMsg = "Kuantiti mesti antara 1 dan 99.";
      renderSummary();
      return;
    }
    errorMsg = "";
    const itemId = row.dataset.item;
    const size = row.querySelector(".size")?.value ?? "";
    const existing = lines.find((l) => l.itemId === itemId && l.size === size);
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity);
    else lines.push({ itemId, size, quantity });
    qtyInput.value = 1;
    renderSummary();
  });

  /* ----- 3. Pembayaran ----- */
  paymentBox.innerHTML = paymentMethods.map((p) => `
    <label class="radio">
      <input type="radio" name="pay" value="${esc(p.value)}"> ${esc(p.label)}
    </label>`).join("");
  paymentBox.addEventListener("change", (e) => {
    if (e.target.name === "pay") {
      paymentMethod = e.target.value;
      renderSummary();
    }
  });

  /* ----- Ringkasan ----- */
  function renderSummary() {
    // Jumlah di sini hanya sementara. Pelayan mengira semula daripada harga sebenar.
    const total = grandTotal(lines.map((l) => ({
      quantity: l.quantity,
      unitPriceSen: itemOf(l.itemId)?.priceSen ?? 0,
    })));
    const payLabel = paymentMethods.find((p) => p.value === paymentMethod)?.label;
    const ready = student && lines.length > 0 && paymentMethod && confirmed && !saving;

    summaryBox.innerHTML = `
      <p><strong>Murid:</strong> ${student ? esc(student.name) : "<em>Belum dipilih</em>"}</p>
      ${lines.length ? `
        <table class="table compact">
          <tbody>${lines.map((l) => {
            const item = itemOf(l.itemId);
            return `
              <tr>
                <td>${esc(item.name)}${l.size ? ` (${esc(l.size)})` : ""}<br>
                  <span class="muted">${formatRM(item.priceSen)} setiap satu</span></td>
                <td><input class="input line-qty" type="number" min="1" max="99"
                     value="${l.quantity}" data-key="${esc(keyOf(l))}"></td>
                <td class="num">${formatRM(l.quantity * item.priceSen)}</td>
                <td><button class="btn small remove" type="button" data-key="${esc(keyOf(l))}" title="Buang">✕</button></td>
              </tr>`;
          }).join("")}</tbody>
        </table>` : `<p class="muted">Belum ada barangan.</p>`}
      <p class="total">Jumlah: <strong>${formatRM(total)}</strong></p>
      <p><strong>Bayaran:</strong> ${payLabel ? esc(payLabel) : "<em>Belum dipilih</em>"}</p>
      <label class="check">
        <input type="checkbox" id="confirm" ${confirmed ? "checked" : ""}>
        Pembayaran telah disahkan mengikut prosedur koperasi
      </label>
      ${errorMsg ? `<p class="error">${esc(errorMsg)}</p>` : ""}
      <button id="save" class="btn primary block" type="button" ${ready ? "" : "disabled"}>
        ${saving ? "Menyimpan..." : "Simpan Resit"}
      </button>`;
  }

  summaryBox.addEventListener("click", (e) => {
    const remove = e.target.closest(".remove");
    if (remove) {
      lines = lines.filter((l) => keyOf(l) !== remove.dataset.key);
      renderSummary();
      return;
    }
    if (e.target.closest("#save")) save();
  });

  summaryBox.addEventListener("change", (e) => {
    if (e.target.id === "confirm") {
      confirmed = e.target.checked;
      renderSummary();
      return;
    }
    if (e.target.classList.contains("line-qty")) {
      const line = lines.find((l) => keyOf(l) === e.target.dataset.key);
      const quantity = parseInt(e.target.value, 10);
      if (line && Number.isInteger(quantity) && quantity >= 1 && quantity <= 99) {
        line.quantity = quantity;
        errorMsg = "";
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
      // Hanya ID dan kuantiti dihantar. Pelayan menentukan harga dan jumlah.
      const { receipt } = await createReceipt({
        requestId,
        studentId: student.studentId,
        paymentMethod,
        lines: lines.map((l) => ({
          itemId: l.itemId,
          size: l.size || undefined,
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

  try {
    const data = await getItems();
    items = data.items.filter((i) => i.active);
    renderItemsBox();
  } catch (err) {
    itemsBox.innerHTML = `<p class="error">${esc(err.message)}</p>`;
  }
}
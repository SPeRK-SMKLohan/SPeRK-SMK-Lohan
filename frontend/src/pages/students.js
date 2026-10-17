import { schools } from "../data/constants.js";
import { searchStudents } from "../services.js";
import { esc } from "../utils/dom.js";

export function renderStudents(root) {
  root.innerHTML = `
    <h1>Murid</h1>
    <p class="notice">No. IC dipaparkan separa. Import Excel ditambah pada Fasa 5.</p>
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
  let seq = 0;
  let timer;

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
  update();
}
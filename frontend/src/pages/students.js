import { schools } from "../data/mock-data.js";
import { searchStudents } from "../state.js";
import { esc, maskIC } from "../utils/dom.js";

export function renderStudents(root) {
  root.innerHTML = `
    <h1>Murid</h1>
    <p class="notice">Data rekaan. Import Excel ditambah pada Fasa 5. No. IC dipaparkan separa.</p>
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

  function update() {
    const list = searchStudents(q.value, { school: school.value });
    root.querySelector("#count").textContent = `${list.length} murid`;
    root.querySelector("#rows").innerHTML = list.map((s) => `
      <tr>
        <td>${esc(s.name)}</td>
        <td>${esc(maskIC(s.icNumber))}</td>
        <td>${esc(s.formerPrimarySchool)}</td>
      </tr>`).join("") || `<tr><td colspan="3" class="muted">Tiada padanan.</td></tr>`;
  }

  q.addEventListener("input", update);
  school.addEventListener("change", update);
  update();
}
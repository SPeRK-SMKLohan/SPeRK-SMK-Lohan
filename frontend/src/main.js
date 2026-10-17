import "./style.css";
import { items, students } from "./data/mock-data.js";
import { formatRM, lineTotal, grandTotal } from "./utils/money.js";

// Contoh pengiraan daripada dokumentasi (Fail Murid x1, Buku Tulis Panjang x2)
const demoLines = [
  { name: "Fail Murid", quantity: 1, unitPriceSen: 500 },
  { name: "Buku Tulis Panjang", quantity: 2, unitPriceSen: 200 },
];

document.querySelector("#app").innerHTML = `
  <header>
    <h1>Sistem Resit Koperasi SMK Lohan, Ranau</h1>
    <nav>Log Masuk · Dashboard · Murid · Barangan · Jana Resit · Sejarah Resit</nav>
    <p class="warn">Mod pembangunan: data rekaan sahaja</p>
  </header>
  <main>
    <h2>Senarai Barangan (${items.length})</h2>
    <ul>${items.map(i => `<li>${i.name}: ${formatRM(i.priceSen)}</li>`).join("")}</ul>

    <h2>Murid Rekaan (${students.length})</h2>
    <ul>${students.map(s => `<li>${s.name}: ${s.formerPrimarySchool}</li>`).join("")}</ul>

    <h2>Ujian Pengiraan</h2>
    <table>
      <tr><th>Item</th><th>Kuantiti</th><th>Harga</th><th>Jumlah</th></tr>
      ${demoLines.map(l => `
        <tr><td>${l.name}</td><td>${l.quantity}</td>
        <td>${formatRM(l.unitPriceSen)}</td>
        <td>${formatRM(lineTotal(l.quantity, l.unitPriceSen))}</td></tr>`).join("")}
      <tr><th colspan="3">Jumlah</th><th>${formatRM(grandTotal(demoLines))}</th></tr>
    </table>
  </main>
`;
import { getItems } from "./api.js";
import { formatRM } from "../../shared/money.js";
import { esc } from "../../shared/dom.js";

export async function renderItems(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Barangan</h1>
    </div>
    <p class="notice">Harga daripada senarai yang diluluskan pihak sekolah. Sesetengah item mempunyai jenis dengan harga berbeza.</p>
    <div id="box"><p class="muted">Memuatkan...</p></div>`;
  const box = root.querySelector("#box");

  try {
    const { items } = await getItems();
    box.innerHTML = `
      <section class="card">
        <div class="table-wrap"><table class="table">
          <thead><tr><th>Item</th><th class="num">Harga</th><th>Kuantiti</th><th>Status</th></tr></thead>
          <tbody>${items.map((i) => `
            <tr>
              <td>${esc(i.name)}</td>
              <td class="num">${formatRM(i.priceSen)}</td>
              <td>${i.fixedQuantity ? `<span class="badge">Tetap (${i.fixedQuantity})</span>` : `<span class="badge">Boleh pilih</span>`}</td>
              <td>${i.active ? `<span class="badge">Aktif</span>` : `<span class="badge warn">Tidak aktif</span>`}</td>
            </tr>`).join("") || `<tr><td colspan="4" class="muted">Tiada barangan.</td></tr>`}
          </tbody>
        </table></div>
      </section>`;
  } catch (err) {
    box.innerHTML = `<p class="error">${esc(err.message)}</p>`;
  }
}

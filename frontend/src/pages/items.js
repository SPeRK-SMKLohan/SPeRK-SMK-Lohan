import { getItems } from "../services.js";
import { formatRM } from "../utils/money.js";
import { esc } from "../utils/dom.js";

export async function renderItems(root) {
  root.innerHTML = `
    <h1>Barangan</h1>
    <p class="notice">Harga contoh sahaja. Senarai dan harga akhir perlu diluluskan oleh sekolah.</p>
    <div id="box"><p class="muted">Memuatkan...</p></div>`;
  const box = root.querySelector("#box");

  try {
    const { items } = await getItems();
    box.innerHTML = `
      <div class="table-wrap"><table class="table">
        <thead><tr><th>Item</th><th class="num">Harga</th><th>Saiz</th><th>Status</th></tr></thead>
        <tbody>${items.map((i) => `
          <tr>
            <td>${esc(i.name)}</td>
            <td class="num">${formatRM(i.priceSen)}</td>
            <td>${i.sizes ? esc(i.sizes.join(", ")) : "-"}</td>
            <td>${i.active ? "Aktif" : "Tidak aktif"}</td>
          </tr>`).join("") || `<tr><td colspan="4" class="muted">Tiada barangan.</td></tr>`}
        </tbody>
      </table></div>`;
  } catch (err) {
    box.innerHTML = `<p class="error">${esc(err.message)}</p>`;
  }
}
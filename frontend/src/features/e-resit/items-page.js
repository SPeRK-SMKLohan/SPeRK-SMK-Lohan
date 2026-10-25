import { getItems } from "./api.js";
import { formatRM } from "../../shared/money.js";
import { esc } from "../../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../../shared/feedback.js";

export function renderItems(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Barangan</h1>
    </div>
    <p class="notice">Harga daripada senarai yang diluluskan pihak sekolah. Sesetengah item mempunyai jenis dengan harga berbeza.</p>
    <div id="box">${loadingState("Sedang mendapatkan senarai barangan…")}</div>`;
  const box = root.querySelector("#box");

  async function load() {
    box.innerHTML = loadingState("Sedang mendapatkan senarai barangan…");
    try {
      const { items } = await getItems();
      box.innerHTML = `
      <section class="card">
        <div class="table-wrap"><table class="table">
          <caption class="sr-only">Senarai barangan dan harga koperasi</caption>
          <thead><tr><th scope="col">Item</th><th scope="col" class="num">Harga</th><th scope="col">Kuantiti</th><th scope="col">Status</th></tr></thead>
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
      box.innerHTML = readErrorState(err, "Senarai barangan");
      wireReadRetry(box, load);
    }
  }
  load();
}

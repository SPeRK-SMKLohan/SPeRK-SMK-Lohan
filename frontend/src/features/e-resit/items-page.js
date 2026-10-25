import { getItems } from "./api.js";
import { formatRM } from "../../shared/money.js";
import { esc } from "../../shared/dom.js";
import { loadingState, readErrorState, wireReadRetry } from "../../shared/feedback.js";

/* Item catalogue — read only. Prices come from the approved school list. */

export function renderItems(root) {
  root.innerHTML = `
    <div class="page-head">
      <h1>Barangan koperasi</h1>
      <p class="lede">Senarai harga yang diluluskan pihak sekolah. Harga ini digunakan
        secara automatik semasa menjana resit.</p>
    </div>
    <div id="box">${loadingState("Sedang mendapatkan senarai barangan…")}</div>`;

  const box = root.querySelector("#box");

  async function load() {
    box.innerHTML = loadingState("Sedang mendapatkan senarai barangan…");
    try {
      const { items } = await getItems();

      if (!items.length) {
        box.innerHTML = `<div class="record-empty"><p>Tiada barangan dalam senarai.</p></div>`;
        return;
      }

      box.innerHTML = `
        <ul class="record-list">
          ${items.map((i) => `
            <li class="record"${i.active ? "" : ' style="opacity:.75"'}>
              <div class="record-main">
                <p class="record-name">${esc(i.name)}</p>
                <div class="record-meta">
                  <span>${i.fixedQuantity ? `Kuantiti tetap ${i.fixedQuantity}` : "Kuantiti boleh dipilih"}</span>
                  ${i.active ? "" : `<span class="pill warn">Tidak aktif</span>`}
                </div>
              </div>
              <div class="record-actions">
                <strong class="num" style="font-size:1.0625rem">${formatRM(i.priceSen)}</strong>
              </div>
            </li>`).join("")}
        </ul>`;
    } catch (err) {
      box.innerHTML = readErrorState(err, "Senarai barangan");
      wireReadRetry(box, load);
    }
  }

  load();
}

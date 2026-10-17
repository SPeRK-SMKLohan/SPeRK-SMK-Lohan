import "./style.css";
import { initAuth, isLoggedIn, signOutUser, currentEmail } from "./shared/auth.js";
import { esc } from "./shared/dom.js";
import { APP_NAME, APP_LONG_NAME } from "./shared/config.js";
import { renderLogin } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderEDaftar } from "./features/e-daftar/page.js";
import { renderImportData } from "./features/e-daftar/import-page.js";
import { renderNewReceipt } from "./features/e-resit/page.js";
import { renderItems } from "./features/e-resit/items-page.js";
import { renderHistory } from "./features/e-resit/history-page.js";
import { renderReceiptDetail } from "./features/e-resit/receipt-page.js";

/* SPeRK: dua ciri berkongsi satu pangkalan data murid.
   Navigasi dikelompokkan mengikut ciri. */
const NAV_GROUPS = [
  { label: null, links: [["/", "Papan Pemuka"]] },
  {
    label: "e-Daftar",
    links: [
      ["/pendaftaran", "Pendaftaran"],
      ["/import", "Import Data"],
    ],
  },
  {
    label: "e-Resit Koperasi",
    links: [
      ["/jana-resit", "Jana Resit"],
      ["/barangan", "Barangan"],
      ["/sejarah", "Sejarah Resit"],
    ],
  },
];

const routes = {
  "/": renderDashboard,
  "/pendaftaran": renderEDaftar,
  "/import": renderImportData,
  "/jana-resit": renderNewReceipt,
  "/barangan": renderItems,
  "/sejarah": renderHistory,
};

// Alamat lama: nama halaman sebelum disusun semula.
const REDIRECTS = {
  "/murid": "/pendaftaran",
  "/e-daftar": "/pendaftaran",
  "/e-resit": "/jana-resit",
};

const app = document.querySelector("#app");
document.title = APP_LONG_NAME;

function currentPath() {
  return location.hash.replace(/^#/, "") || "/";
}

function layoutHtml(path) {
  const active = (p) =>
    path === p || (p === "/sejarah" && path.startsWith("/resit/")) ? "active" : "";
  const navLink = ([p, label]) => {
    const state = active(p);
    return `<a href="#${p}" class="${state}"${state ? ' aria-current="page"' : ""}>${label}</a>`;
  };
  const navGroup = ({ label, links }) => `
      <div class="nav-group">
        ${label ? `<span class="nav-group-label">${label}</span>` : ""}
        <div class="nav-group-links">${links.map(navLink).join("")}</div>
      </div>`;
  return `
    ${import.meta.env.DEV ? `<div class="devbar no-print">Mod pembangunan: data rekaan sahaja</div>` : ""}
    <header class="topbar no-print">
      <div class="topbar-main">
        <div class="brand"><img class="brand-logo" src="/logo.svg" alt="" /> ${APP_NAME} SMK Lohan</div>
        <span class="who">${esc(currentEmail())}</span>
        <button id="logout" class="btn small" type="button">Log Keluar</button>
      </div>
      <nav class="nav">${NAV_GROUPS.map(navGroup).join("")}</nav>
    </header>
    <main id="view" class="container"></main>`;
}

function render() {
  const path = currentPath();

  if (!isLoggedIn() && path !== "/login") {
    location.hash = "/login";
    return;
  }
  if (isLoggedIn() && path === "/login") {
    location.hash = "/";
    return;
  }

  if (isLoggedIn() && REDIRECTS[path]) {
    location.replace(`#${REDIRECTS[path]}`);
    return;
  }

  if (path === "/login") {
    app.innerHTML = "";
    renderLogin(app);
    return;
  }

  app.innerHTML = layoutHtml(path);
  const view = app.querySelector("#view");

  if (path.startsWith("/resit/")) {
    renderReceiptDetail(view, decodeURIComponent(path.slice("/resit/".length)));
  } else if (routes[path]) {
    routes[path](view);
  } else {
    view.innerHTML = `<h1>Halaman tidak dijumpai</h1><p><a href="#/">Kembali ke Papan Pemuka</a></p>`;
  }

  app.querySelector("#logout").addEventListener("click", async () => {
    await signOutUser();
    location.hash = "/login";
  });
  window.scrollTo(0, 0);
}

// Tunggu Firebase memulihkan sesi dahulu, kemudian mulakan aplikasi.
app.innerHTML = `<p class="muted" style="padding:1rem">Memuatkan...</p>`;
initAuth().then(() => {
  window.addEventListener("hashchange", render);
  render();
});

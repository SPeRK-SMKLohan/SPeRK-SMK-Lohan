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
const NAV = [
  { label: "Papan Pemuka", path: "/" },
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

function currentRoute() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path, params: new URLSearchParams(query) };
}

const isActive = (path, p) =>
  path === p || (p === "/sejarah" && path.startsWith("/resit/"));

function layoutHtml(path) {
  const navLink = (p, label) => {
    const state = isActive(path, p) ? " active" : "";
    return `<a class="nav-link${state}" href="#${p}"${state ? ' aria-current="page"' : ""}>${label}</a>`;
  };
  const navDrop = ({ label, links }) => {
    const state = links.some(([p]) => isActive(path, p)) ? " active" : "";
    return `
      <div class="nav-drop">
        <button class="nav-link nav-drop-btn${state}" type="button" aria-haspopup="true" aria-expanded="false">${label}</button>
        <div class="nav-menu">
          ${links.map(([p, l]) => navLink(p, l)).join("")}
        </div>
      </div>`;
  };
  const navItem = (item) => (item.links ? navDrop(item) : navLink(item.path, item.label));

  return `
    ${import.meta.env.DEV ? `<div class="devbar no-print">Mod pembangunan: disambung ke pangkalan data sebenar</div>` : ""}
    <header class="topbar no-print">
      <div class="topbar-in">
        <a class="brand" href="#/">
          <span class="brand-badge"><img class="brand-logo" src="/logo.svg" alt="" /></span>
          <span class="brand-name">${APP_NAME} SMK Lohan</span>
        </a>
        <nav class="nav" aria-label="Navigasi utama">${NAV.map(navItem).join("")}</nav>
        <div class="topbar-user">
          <span class="who">${esc(currentEmail())}</span>
          <button id="logout" class="btn small" type="button">Log Keluar</button>
        </div>
      </div>
    </header>
    <main id="view" class="page"></main>
    <footer class="footer no-print">
      <div class="footer-in">
        <span>© ${new Date().getFullYear()} SMK Lohan, Ranau, Sabah. Hak Cipta Terpelihara.</span>
        <span>Sistem Pengurusan Pelajar dan Resit Koperasi (SPeRK)</span>
      </div>
    </footer>`;
}

// Menu lungsur navigasi: buka dengan klik (sokongan sentuh), tutup bila klik luar.
function wireNav(scope) {
  const drops = [...scope.querySelectorAll(".nav-drop")];
  const closeAll = () => {
    for (const d of drops) {
      d.classList.remove("open");
      d.querySelector("button")?.setAttribute("aria-expanded", "false");
    }
  };

  for (const d of drops) {
    const btn = d.querySelector("button");
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !d.classList.contains("open");
      closeAll();
      d.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
    });
  }

  const onDocClick = () => closeAll();
  const onKey = (e) => {
    if (!scope.isConnected) {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      return;
    }
    if (e.key === "Escape") closeAll();
  };
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
}

function render() {
  const { path, params } = currentRoute();

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
  wireNav(app);

  if (path.startsWith("/resit/")) {
    renderReceiptDetail(view, decodeURIComponent(path.slice("/resit/".length)));
  } else if (routes[path]) {
    routes[path](view, params);
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

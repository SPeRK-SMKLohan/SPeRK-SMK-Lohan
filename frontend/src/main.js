import "./style.css";
import { initAuth, isLoggedIn, signOutUser } from "./shared/auth.js";
import { applyTextSizePreference, textSizePreference, wireTextSizeControl } from "./shared/accessibility.js";
import { clearStatus } from "./shared/status.js";
import { APP_NAME, APP_LONG_NAME } from "./shared/config.js";
import { renderLogin } from "./pages/login.js";
import { renderGuide } from "./pages/guide.js";
import { renderHome } from "./pages/home.js";
import { renderRegistration } from "./features/e-daftar/page.js";
import { renderImportData } from "./features/e-daftar/import-page.js";
import { renderNewReceipt } from "./features/e-resit/page.js";
import { renderItems } from "./features/e-resit/items-page.js";
import { renderCoopReport } from "./features/e-resit/report-page.js";
import { renderReceiptDetail } from "./features/e-resit/receipt-page.js";

/* SPeRK: two features share one student database.
   Navigation is flat and visible — no dropdowns, no hover-only menus. */

const NAV = [
  { path: "/", label: "Utama", title: "Utama" },
  { path: "/pendaftaran", label: "Pendaftaran", title: "Pendaftaran murid" },
  { path: "/jana-resit", label: "Jana Resit", title: "Jana resit koperasi" },
  { path: "/laporan-koperasi", label: "Laporan", title: "Laporan koperasi" },
];

// Everything else stays reachable: home page tools, footer, and the menu.
const TOOLS = [
  { path: "/import", label: "Import Data", desc: "Muat naik senarai murid dari fail Excel" },
  { path: "/barangan", label: "Barangan", desc: "Senarai harga barangan koperasi" },
  { path: "/panduan", label: "Panduan", desc: "Arahan ringkas untuk guru" },
];

const MENU_GROUPS = [
  { title: "Kerja harian", items: NAV },
  { title: "Alat lain", items: TOOLS },
];

const routes = {
  "/": renderHome,
  "/pendaftaran": renderRegistration,
  "/import": renderImportData,
  "/jana-resit": renderNewReceipt,
  "/barangan": renderItems,
  "/laporan-koperasi": renderCoopReport,
  "/panduan": renderGuide,
};

// Old addresses, kept so existing bookmarks still work.
const REDIRECTS = {
  "/murid": "/pendaftaran",
  "/e-daftar": "/pendaftaran",
  "/e-resit": "/jana-resit",
  "/sejarah": "/laporan-koperasi",
};

const app = document.querySelector("#app");
document.title = APP_LONG_NAME;

function currentRoute() {
  const raw = location.hash.replace(/^#/, "") || "/";
  const [path, query = ""] = raw.split("?");
  return { path, params: new URLSearchParams(query) };
}

// A saved receipt belongs to the report: that is where receipts are found now.
const isActive = (path, p) =>
  p === path || (p === "/laporan-koperasi" && path.startsWith("/resit/"));

const navLink = (path, item) => {
  const active = isActive(path, item.path);
  return `<a href="#${item.path}"${active ? ' aria-current="page"' : ""}>${item.label}</a>`;
};

const menuLink = (path, item) => {
  const active = isActive(path, item.path);
  return `<li><a href="#${item.path}"${active ? ' aria-current="page"' : ""}>
    <span>${item.label}</span><span aria-hidden="true">›</span>
  </a></li>`;
};

const sizeControl = () => `
  <label class="size-control">
    <span>Saiz teks</span>
    <select id="text-size-toggle" aria-label="Saiz teks">
      <option value="normal"${textSizePreference() === "normal" ? " selected" : ""}>Biasa</option>
      <option value="large"${textSizePreference() === "large" ? " selected" : ""}>Besar</option>
      <option value="largest"${textSizePreference() === "largest" ? " selected" : ""}>Sangat besar</option>
    </select>
  </label>`;

const brand = (href) => `
  <a class="brand" href="${href}">
    <span class="brand-mark"><img src="/logo-nav.svg" alt="" /></span>
    <span class="brand-text">
      <span class="brand-name">${APP_NAME}</span>
      <span class="brand-sub">SMK Lohan, Ranau</span>
    </span>
  </a>`;

function footerHtml() {
  return `
    <footer class="site-footer no-print">
      <div class="site-footer-in">
        <nav class="footer-links" aria-label="Pautan lain">
          ${TOOLS.map((t) => `<a href="#${t.path}">${t.label}</a>`).join("")}
        </nav>
        <button class="btn-logout js-logout" type="button">Log Keluar</button>
      </div>
    </footer>`;
}

function shellHtml(path) {
  return `
    ${import.meta.env.DEV ? `<div class="devbar no-print">Mod pembangunan: disambung ke pangkalan data sebenar</div>` : ""}
    <a class="skip-link" href="#view">Langkau ke kandungan</a>

    <header class="site-header no-print">
      <div class="site-header-in">
        ${brand("#/")}
        <nav class="nav" aria-label="Navigasi utama">
          ${NAV.map((item) => navLink(path, item)).join("")}
        </nav>
        <button id="menu-toggle" class="menu-btn" type="button"
                aria-expanded="false" aria-controls="mobile-menu">
          <span class="menu-btn-icon" aria-hidden="true">☰</span>
          <span class="menu-btn-text">Menu</span>
        </button>
        <div class="header-tools">
          ${sizeControl()}
        </div>
      </div>
    </header>

    <div id="mobile-menu" class="mobile-menu no-print" hidden>
      ${MENU_GROUPS.map((group) => `
        <h2 class="menu-group">${group.title}</h2>
        <ul>${group.items.map((item) => menuLink(path, item)).join("")}</ul>`).join("")}
      <h2 class="menu-group">Akaun</h2>
      <ul><li><button class="menu-logout js-logout" type="button">
        <span>Log Keluar</span><span aria-hidden="true">›</span>
      </button></li></ul>
    </div>

    <main id="view" class="page" tabindex="-1">
      <div id="status-region" class="status-region" role="status" aria-live="polite"></div>
      <div id="page-body"></div>
    </main>

    ${footerHtml()}`;
}

/* The header can grow — at "Sangat besar" the navigation needs more room, and
   hiding controls is worse than a taller bar. Measuring it keeps every scroll
   offset (`scroll-padding-top`, the mobile menu) in step with reality. */
let measuredHeader = 0;

function syncHeaderHeight() {
  const header = document.querySelector(".site-header");
  const root = document.documentElement;

  if (!header) {
    root.style.removeProperty("--header-h");
    measuredHeader = 0;
    return;
  }

  const height = Math.round(header.getBoundingClientRect().height);
  if (height > 0 && Math.abs(height - measuredHeader) > 1) {
    measuredHeader = height;
    root.style.setProperty("--header-h", `${height}px`);
  }
}

/* Mobile menu: a full-screen list, opened by one button. Escape closes it and
   returns focus to the button; choosing a destination closes it too. */
function wireMenu(scope) {
  const toggle = scope.querySelector("#menu-toggle");
  const menu = scope.querySelector("#mobile-menu");
  if (!toggle || !menu) return;

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    toggle.querySelector(".menu-btn-icon").textContent = open ? "✕" : "☰";
    toggle.querySelector(".menu-btn-text").textContent = open ? "Tutup" : "Menu";
    document.body.style.overflow = open ? "hidden" : "";
    if (open) menu.querySelector("a, button")?.focus();
  };

  toggle.addEventListener("click", () => setOpen(menu.hidden));
  menu.addEventListener("click", (e) => {
    if (e.target.closest("a")) setOpen(false);
  });

  const onKey = (e) => {
    if (!scope.isConnected) {
      document.removeEventListener("keydown", onKey);
      return;
    }
    if (e.key === "Escape" && !menu.hidden) {
      setOpen(false);
      toggle.focus();
    }
  };
  document.addEventListener("keydown", onKey);
}

function wireLogout() {
  for (const btn of app.querySelectorAll(".js-logout")) {
    btn.addEventListener("click", async () => {
      await signOutUser();
      location.hash = "/login";
    });
  }
}

function renderPublicGuide() {
  app.innerHTML = `
    <a class="skip-link" href="#view">Langkau ke kandungan</a>
    <div class="login-public-bar">
      ${brand("#/login")}
      <span style="flex:1 1 auto"></span>
      ${sizeControl()}
      <a class="btn secondary sm" href="#/login">Log Masuk</a>
    </div>
    <main id="view" class="page" tabindex="-1">
      <div id="status-region" class="status-region" role="status" aria-live="polite"></div>
      <div id="page-body"></div>
    </main>
    ${footerHtml()}`;
  document.title = `Panduan · ${APP_NAME}`;
  syncHeaderHeight();
  renderGuide(app.querySelector("#page-body"));
  wireTextSizeControl(app);
  wireLogout();
}

function render() {
  const { path, params } = currentRoute();
  // A result banner belongs to the screen that produced it, never to the next one.
  clearStatus();
  document.body.classList.remove("has-trolley");

  // The guide is readable before signing in, including from the login page.
  if (path === "/panduan" && !isLoggedIn()) {
    renderPublicGuide();
    return;
  }

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
    document.title = `Log Masuk · ${APP_NAME}`;
    measuredHeader = 0;
    document.documentElement.style.removeProperty("--header-h");
    renderLogin(app);
    return;
  }

  app.innerHTML = shellHtml(path);
  const body = app.querySelector("#page-body");
  wireMenu(app);
  syncHeaderHeight();

  const match = NAV.find((n) => isActive(path, n.path));
  document.title = match
    ? `${match.title} · ${APP_NAME}`
    : path.startsWith("/resit/") ? `Resit · ${APP_NAME}` : APP_NAME;

  if (path.startsWith("/resit/")) {
    renderReceiptDetail(body, decodeURIComponent(path.slice("/resit/".length)));
  } else if (routes[path]) {
    routes[path](body, params);
  } else {
    body.innerHTML = `
      <div class="page-head"><h1>Halaman tidak dijumpai</h1></div>
      <div class="card">
        <p>Alamat ini tiada dalam sistem.</p>
        <p><a class="btn primary" href="#/">Kembali ke Utama</a></p>
      </div>`;
  }

  wireLogout();
  wireTextSizeControl(app);
  window.scrollTo(0, 0);
  // Re-measure after the page paints, in case a font or the content changed it.
  requestAnimationFrame(syncHeaderHeight);
}

applyTextSizePreference();

// The header height depends on the text-size preference and the viewport.
window.addEventListener("resize", syncHeaderHeight);
if ("ResizeObserver" in window) {
  new ResizeObserver(syncHeaderHeight).observe(document.body);
}

// Wait for Firebase to restore the session before starting the app.
app.innerHTML = `<p class="loading" role="status" aria-live="polite">
  <span class="spinner" aria-hidden="true"></span><span>Menyambung ke SPeRK dan memulihkan sesi…</span></p>`;

// Remove any legacy service worker that would block loading.
async function cleanupLegacySW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) await reg.unregister();
  } catch {
    /* ignore */
  }
}

/* Development-only fixture harness. `import.meta.env.DEV` is a compile-time
   constant, so this branch — and the module it imports — is dropped from a
   production build. It only activates with ?preview= in the URL. */
const previewBoot = import.meta.env.DEV && new URLSearchParams(location.search).has("preview")
  ? import("./dev/preview.js").then((m) => m.installPreview())
  : Promise.resolve();

previewBoot
  .then(() => initAuth())
  .then(() => {
    cleanupLegacySW();
    window.addEventListener("hashchange", render);
    render();
  })
  .catch((err) => {
    console.error("Gagal memulakan SPeRK:", err);
    app.innerHTML = `
      <main class="page">
        <div class="card">
          <h1>Sistem tidak dapat dimulakan</h1>
          <p class="err" role="alert">Sambungan pengesahan gagal. Semak sambungan internet dan cuba muat semula halaman.</p>
          <button id="retry-startup" class="btn primary" type="button">Cuba Lagi</button>
        </div>
      </main>`;
    app.querySelector("#retry-startup").addEventListener("click", () => location.reload());
  });

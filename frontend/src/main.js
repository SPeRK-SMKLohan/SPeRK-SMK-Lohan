import "./style.css";
import { initAuth, isLoggedIn, signOutUser } from "./shared/auth.js";
import { clearStatus } from "./shared/status.js";
import { APP_NAME, APP_LONG_NAME } from "./shared/config.js";
import { renderLogin } from "./pages/login.js";

/* SPeRK: two features share one student database.
   Navigation is flat and visible — no dropdowns, no hover-only menus. */

const NAV = [
  { path: "/", label: "Utama", title: "Utama" },
  { path: "/pendaftaran", label: "Pendaftaran", title: "Pendaftaran murid" },
  { path: "/jana-resit", label: "Resit", title: "Jana resit koperasi" },
  { path: "/laporan-koperasi", label: "Laporan", title: "Laporan koperasi" },
];

// Everything else stays reachable: home page tools, footer, and the menu.
const TOOLS = [
  { path: "/import", label: "Import senarai" },
  { path: "/barangan", label: "Harga barangan" },
  { path: "/panduan", label: "Panduan" },
];

const MENU_GROUPS = [
  { title: "Kerja harian", items: NAV },
  { title: "Lagi", items: TOOLS },
];

const routes = {
  "/": () => import("./pages/home.js").then((m) => m.renderHome),
  "/pendaftaran": () => import("./features/e-daftar/page.js").then((m) => m.renderRegistration),
  "/import": () => import("./features/e-daftar/import-page.js").then((m) => m.renderImportData),
  "/jana-resit": () => import("./features/e-resit/page.js").then((m) => m.renderNewReceipt),
  "/barangan": () => import("./features/e-resit/items-page.js").then((m) => m.renderItems),
  "/laporan-koperasi": () => import("./features/e-resit/report-page.js").then((m) => m.renderCoopReport),
  "/panduan": () => import("./pages/guide.js").then((m) => m.renderGuide),
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
let renderSequence = 0;

// Clear preferences and device-local names used by features that were removed.
try {
  localStorage.removeItem("sperk-device-staff-name");
  localStorage.removeItem("sperk-text-size");
  localStorage.removeItem("sperk-large-text");
} catch {
  /* Local storage may be unavailable. */
}

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

function showPageLoadError(container, err) {
  console.error("Gagal memuat halaman:", err);
  container.innerHTML = `
    <div class="card" role="alert">
      <h1>Halaman tidak dapat dimuatkan</h1>
      <p class="lede">Semak sambungan internet dan cuba muat semula halaman.</p>
      <button class="btn primary" type="button" data-reload-page>Cuba Lagi</button>
    </div>`;
  container.querySelector("[data-reload-page]").addEventListener("click", () => location.reload());
}

async function renderPublicGuide(sequence) {
  app.innerHTML = `
    <a class="skip-link" href="#view">Langkau ke kandungan</a>
    <div class="login-public-bar">
      ${brand("#/login")}
      <a class="btn secondary sm" href="#/login">Log Masuk</a>
    </div>
    <main id="view" class="page" tabindex="-1">
      <div id="status-region" class="status-region" role="status" aria-live="polite"></div>
      <div id="page-body"></div>
    </main>
    ${footerHtml()}`;
  document.title = `Panduan · ${APP_NAME}`;
  const body = app.querySelector("#page-body");
  try {
    const renderGuide = await routes["/panduan"]();
    if (sequence !== renderSequence) return;
    renderGuide(body);
  } catch (err) {
    if (sequence !== renderSequence) return;
    showPageLoadError(body, err);
  }
  wireLogout();
}

async function render() {
  const sequence = ++renderSequence;
  const { path, params } = currentRoute();
  // A result banner belongs to the screen that produced it, never to the next one.
  clearStatus();
  document.body.classList.remove("has-trolley");

  // The guide is readable before signing in, including from the login page.
  if (path === "/panduan" && !isLoggedIn()) {
    await renderPublicGuide(sequence);
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
    renderLogin(app);
    return;
  }

  app.innerHTML = shellHtml(path);
  const body = app.querySelector("#page-body");
  wireMenu(app);

  const match = NAV.find((n) => isActive(path, n.path));
  document.title = match
    ? `${match.title} · ${APP_NAME}`
    : path.startsWith("/resit/") ? `Resit · ${APP_NAME}` : APP_NAME;

  try {
    if (path.startsWith("/resit/")) {
      const renderReceiptDetail = await import("./features/e-resit/receipt-page.js").then((m) => m.renderReceiptDetail);
      if (sequence !== renderSequence) return;
      renderReceiptDetail(body, decodeURIComponent(path.slice("/resit/".length)));
    } else if (routes[path]) {
      const renderPage = await routes[path]();
      if (sequence !== renderSequence) return;
      renderPage(body, params);
    } else {
      body.innerHTML = `
        <div class="page-head"><h1>Halaman tidak dijumpai</h1></div>
        <div class="card">
          <p>Alamat ini tiada dalam sistem.</p>
          <p><a class="btn primary" href="#/">Kembali ke Utama</a></p>
        </div>`;
    }
  } catch (err) {
    if (sequence !== renderSequence) return;
    showPageLoadError(body, err);
  }

  wireLogout();
  window.scrollTo(0, 0);
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

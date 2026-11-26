import "./style.css";
import { initAuth, isLoggedIn, signOutUser } from "./shared/auth.js";
import { clearStatus, ensureStatusDock } from "./shared/status.js";
import { APP_NAME, APP_LONG_NAME } from "./shared/config.js";
import { esc } from "./shared/dom.js";
import { icon } from "./shared/icons.js";
import { staffName } from "./shared/staff.js";
import { renderLogin } from "./pages/login.js";

/* SPeRK: two features share one student database. */

// Every destination is visible in the rail. Nothing hides behind a menu, so a
// teacher never has to remember where a screen lives.
const NAV = [
  { path: "/", label: "Utama", icon: "home", title: "Utama" },
  { path: "/pendaftaran", label: "Pendaftaran", icon: "students", title: "Pendaftaran murid" },
  { path: "/jana-resit", label: "Koperasi", icon: "receipt", title: "Jana resit koperasi" },
  { path: "/laporan-koperasi", label: "Laporan koperasi", icon: "report", title: "Laporan koperasi" },
];

// Secondary tools sit in their own group, below the daily work.
const TOOLS = [
  { path: "/import", label: "Import senarai", icon: "import", title: "Import senarai murid" },
  { path: "/panduan", label: "Panduan", icon: "guide", title: "Panduan" },
];

const routes = {
  "/": () => import("./pages/home.js").then((m) => m.renderHome),
  "/pendaftaran": () => import("./features/e-daftar/page.js").then((m) => m.renderRegistration),
  "/import": () => import("./features/e-daftar/import-page.js").then((m) => m.renderImportData),
  "/jana-resit": () => import("./features/e-resit/page.js").then((m) => m.renderNewReceipt),
  "/laporan-koperasi": () => import("./features/e-resit/report-page.js").then((m) => m.renderCoopReport),
  "/panduan": () => import("./pages/guide.js").then((m) => m.renderGuide),
};

// Old addresses, kept so existing bookmarks still work.
const REDIRECTS = {
  "/murid": "/pendaftaran",
  "/e-daftar": "/pendaftaran",
  "/e-resit": "/jana-resit",
  "/sejarah": "/laporan-koperasi",
  "/barangan": "/laporan-koperasi?items=1",
};

const app = document.querySelector("#app");
document.title = APP_LONG_NAME;
// Mount the single ARIA live region once, before any page can write into it.
ensureStatusDock();
let renderSequence = 0;

// Clear preferences and device-local names used by features that were removed.
try {
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

/* Keep each destination to one full-width link with a persistent icon and label. */
const railLink = (path, item) => {
  const active = isActive(path, item.path);
  return `<a href="#${item.path}"${active ? ' aria-current="page"' : ""}
             aria-label="${esc(item.label)}">
    <span class="rail-ico" aria-hidden="true">${icon(item.icon)}</span>
    <span class="rail-text">${item.label}</span>
  </a>`;
};

const menuLink = (path, item) => {
  const active = isActive(path, item.path);
  return `<li><a href="#${item.path}"${active ? ' aria-current="page"' : ""}>
    <span class="menu-link-body">${icon(item.icon)}<span>${item.label}</span></span>
    <span class="menu-chevron" aria-hidden="true">›</span>
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

// The bar at the top of the work area repeats the current destination, so the
// screen still says where you are after a long table has scrolled its heading
// out of sight.
function pageLabel(path) {
  if (path.startsWith("/resit/")) return "Resit koperasi";
  const item = [...NAV, ...TOOLS].find((n) => isActive(path, n.path));
  return item ? item.label : APP_NAME;
}

function shellHtml(path) {
  const name = staffName();
  const who = name || "Guru bertugas";
  // Without a name the fallback already says what the account is, so the second
  // line carries the school instead of repeating the first.
  const role = name ? "Guru" : "SMK Lohan, Ranau";
  return `
    <a class="skip-link" href="#view">Langkau ke kandungan</a>

    <header class="rail no-print">
      <div class="rail-in">
        <div class="rail-head">${brand("#/")}</div>

        <nav id="rail-nav" class="rail-nav" aria-label="Navigasi utama">
          ${NAV.map((item) => railLink(path, item)).join("")}
          ${TOOLS.map((item) => railLink(path, item)).join("")}
        </nav>

        <div class="rail-foot">
          <div class="rail-user">
            <span class="rail-user-copy">
              <span class="rail-user-name">${esc(who)}</span>
              <span class="rail-user-role">${esc(role)}</span>
            </span>
          </div>
          <button class="rail-logout js-logout" type="button" aria-label="Log keluar">
            ${icon("logout")}<span>Log keluar</span>
          </button>
        </div>

        <button id="menu-toggle" class="rail-menu" type="button"
                aria-expanded="false" aria-controls="mobile-menu">
          <span class="rail-menu-icon" aria-hidden="true">${icon("menu")}</span>
          <span class="rail-menu-text">Menu</span>
        </button>
      </div>
    </header>

    <div class="app-main">
      <div class="topbar no-print">
        <div class="topbar-head">
          <p class="topbar-title">${esc(pageLabel(path))}</p>
          ${import.meta.env.DEV ? `<span class="devbar no-print">Mod pembangunan: disambung ke pangkalan data sebenar</span>` : ""}
        </div>
      </div>

      <main id="view" class="page" tabindex="-1">
        <div id="page-body"></div>
      </main>
    </div>

    <div id="mobile-menu" class="mobile-menu no-print" hidden>
      <div class="menu-user">
        <span class="rail-user-copy">
          <span class="rail-user-name">${esc(who)}</span>
          <span class="rail-user-role">SMK Lohan, Ranau</span>
        </span>
      </div>
      <ul>${[...NAV, ...TOOLS].map((item) => menuLink(path, item)).join("")}</ul>
      <ul><li><button class="menu-logout js-logout" type="button">
        <span class="menu-link-body">${icon("logout")}<span>Log keluar</span></span>
      </button></li></ul>
    </div>
    `;
}

/* Mobile menu: a full-screen list, opened by one button. Escape closes it and
   returns focus to the button; choosing a destination closes it too. */
function wireMenu(scope) {
  const toggle = scope.querySelector("#menu-toggle");
  const menu = scope.querySelector("#mobile-menu");
  if (!toggle || !menu) return;

  // The header is sticky, so the menu has to start below whatever actually sits
  // at the top of the page — the header alone, or the development banner too.
  const rail = scope.querySelector(".rail");
  if (rail) menu.style.top = `${Math.round(rail.getBoundingClientRect().bottom)}px`;

  const iconSlot = toggle.querySelector(".rail-menu-icon");
  const textSlot = toggle.querySelector(".rail-menu-text");

  const setOpen = (open) => {
    menu.hidden = !open;
    toggle.setAttribute("aria-expanded", String(open));
    if (iconSlot) iconSlot.innerHTML = icon(open ? "close" : "menu");
    if (textSlot) textSlot.textContent = open ? "Tutup" : "Menu";
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
  app.classList.remove("has-school-rail");
  document.body.classList.remove("has-school-rail");
  app.innerHTML = `
    <a class="skip-link" href="#view">Langkau ke kandungan</a>
    <div class="login-public-bar">
      ${brand("#/login")}
      <a class="btn secondary sm" href="#/login">Log Masuk</a>
    </div>
    <main id="view" class="page" tabindex="-1">
      <div id="page-body"></div>
    </main>
    `;
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
  // Never leave a locked page behind if a route changed while the menu was open.
  document.body.style.overflow = "";

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
    app.classList.remove("has-school-rail");
    document.body.classList.remove("has-school-rail");
    document.title = `Log Masuk · ${APP_NAME}`;
    renderLogin(app);
    return;
  }

  app.classList.add("has-school-rail");
  document.body.classList.add("has-school-rail");
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
          <p class="err" role="alert">Sesi belum dapat dipulihkan. Semak sambungan internet dan pilih Cuba Lagi. Sesi anda tidak dipadam.</p>
          <button id="retry-startup" class="btn primary" type="button">Cuba Lagi</button>
        </div>
      </main>`;
    app.querySelector("#retry-startup").addEventListener("click", () => location.reload());
  });

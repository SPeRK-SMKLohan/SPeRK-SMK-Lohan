import "./style.css";
import { initAuth, isLoggedIn, signOutUser } from "./shared/auth.js";
import { applyTextSizePreference, textSizePreference, wireTextSizeControl } from "./shared/accessibility.js";
import { APP_NAME, APP_LONG_NAME } from "./shared/config.js";
import { renderLogin } from "./pages/login.js";
import { renderGuide } from "./pages/guide.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderEDaftar } from "./features/e-daftar/page.js";
import { renderImportData } from "./features/e-daftar/import-page.js";
import { renderNewReceipt } from "./features/e-resit/page.js";
import { renderItems } from "./features/e-resit/items-page.js";
import { renderHistory } from "./features/e-resit/history-page.js";
import { renderCoopReport } from "./features/e-resit/report-page.js";
import { renderReceiptDetail } from "./features/e-resit/receipt-page.js";

/* SPeRK: dua ciri berkongsi satu pangkalan data murid.
   Navigasi dikelompokkan mengikut ciri. */
const NAV = [
  { label: "Utama", path: "/" },
  {
    label: "e-Daftar",
    links: [
      ["/pendaftaran", "Pendaftaran"],
      ["/import", "Import Data"],
    ],
  },
  {
    label: "e-Resit",
    links: [
      ["/jana-resit", "Jana Resit"],
      ["/barangan", "Barangan"],
      ["/sejarah", "Sejarah Resit"],
      ["/laporan-koperasi", "Laporan Koperasi"],
    ],
  },
  { label: "Panduan", path: "/panduan" },
];

const routes = {
  "/": renderDashboard,
  "/pendaftaran": renderEDaftar,
  "/import": renderImportData,
  "/jana-resit": renderNewReceipt,
  "/barangan": renderItems,
  "/sejarah": renderHistory,
  "/laporan-koperasi": renderCoopReport,
  "/panduan": renderGuide,
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
  const navLink = (p, label, inMenu = false) => {
    const active = isActive(path, p);
    const cls = inMenu
      ? `menu-link${active ? " active" : ""}`
      : `nav-link${active ? " active" : ""}`;
    return `<a class="${cls}" href="#${p}"${active ? ' aria-current="page"' : ""}>${label}</a>`;
  };
  const navDrop = ({ label, links }) => {
    const state = links.some(([p]) => isActive(path, p)) ? " active" : "";
    return `
      <div class="nav-drop">
        <button class="nav-link nav-drop-btn${state}" type="button" aria-haspopup="true" aria-expanded="false">${label}</button>
        <div class="nav-menu">
          ${links.map(([p, l]) => navLink(p, l, true)).join("")}
        </div>
      </div>`;
  };
  const navItem = (item) => (item.links ? navDrop(item) : navLink(item.path, item.label));

  return `
    ${import.meta.env.DEV ? `<div class="devbar no-print">Mod pembangunan: disambung ke pangkalan data sebenar</div>` : ""}
    <header class="topbar no-print">
      <div class="topbar-in">
        <a class="brand" href="#/">
          <span class="brand-badge"><img class="brand-logo" src="/logo-nav.svg" alt="" /></span>
          <span class="brand-name">${APP_NAME} SMK Lohan</span>
        </a>
        <button id="mobile-nav-toggle" class="mobile-nav-toggle" type="button"
                aria-controls="primary-nav" aria-expanded="false" aria-label="Buka menu navigasi">
          <span aria-hidden="true">☰</span><span class="mobile-nav-label">Menu</span>
        </button>
        <nav id="primary-nav" class="nav" aria-label="Navigasi utama">${NAV.map(navItem).join("")}</nav>
        <div class="topbar-user">
          <label class="text-size-control">Saiz teks
            <select id="text-size-toggle" class="input" aria-label="Saiz teks">
              <option value="normal"${textSizePreference() === "normal" ? " selected" : ""}>Biasa</option>
              <option value="large"${textSizePreference() === "large" ? " selected" : ""}>Besar</option>
              <option value="largest"${textSizePreference() === "largest" ? " selected" : ""}>Sangat besar</option>
            </select>
          </label>
          <button id="logout" class="btn small" type="button">Log Keluar</button>
        </div>
      </div>
    </header>
    <main id="view" class="page"></main>
    `;
}

// Menu lungsur navigasi: buka dengan klik (sokongan sentuh), tutup bila klik luar.
function wireNav(scope) {
  const drops = [...scope.querySelectorAll(".nav-drop")];
  const topbar = scope.querySelector(".topbar");
  const mobileToggle = scope.querySelector("#mobile-nav-toggle");
  const setMobileMenu = (open) => {
    topbar?.classList.toggle("menu-open", open);
    mobileToggle?.setAttribute("aria-expanded", String(open));
    mobileToggle?.setAttribute("aria-label", open ? "Tutup menu navigasi" : "Buka menu navigasi");
  };
  const closeAll = () => {
    for (const d of drops) {
      d.classList.remove("open");
      d.querySelector("button")?.setAttribute("aria-expanded", "false");
    }
  };

  mobileToggle?.addEventListener("click", () => {
    setMobileMenu(!topbar.classList.contains("menu-open"));
  });

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

  const onDocClick = (e) => {
    closeAll();
    if (!e.target.closest(".topbar-in")) setMobileMenu(false);
  };
  const onKey = (e) => {
    if (!scope.isConnected) {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKey);
      return;
    }
    if (e.key === "Escape") closeAll();
    if (e.key === "Escape" && topbar?.classList.contains("menu-open")) {
      setMobileMenu(false);
      mobileToggle?.focus();
    }
  };
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);
}

function render() {
  const { path, params } = currentRoute();

  // Panduan boleh dibaca sebelum log masuk, termasuk daripada halaman log masuk.
  if (path === "/panduan" && !isLoggedIn()) {
    app.innerHTML = `
      <header class="topbar no-print"><div class="topbar-in guide-public-head">
        <a class="brand" href="#/login">
          <span class="brand-badge"><img class="brand-logo" src="/logo-nav.svg" alt="" /></span>
          <span class="brand-name">${APP_NAME} SMK Lohan</span>
        </a>
        <label class="text-size-control">Saiz teks
          <select id="text-size-toggle" class="input" aria-label="Saiz teks">
            <option value="normal">Biasa</option><option value="large">Besar</option><option value="largest">Sangat besar</option>
          </select>
        </label>
        <a class="btn small" href="#/login">Log Masuk</a>
      </div></header>
      <main id="view" class="page"></main>
      `;
    renderGuide(app.querySelector("#view"));
    wireTextSizeControl(app);
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
    view.innerHTML = `<h1>Halaman tidak dijumpai</h1><p><a href="#/">Kembali ke Utama</a></p>`;
  }

  app.querySelector("#logout").addEventListener("click", async () => {
    await signOutUser();
    location.hash = "/login";
  });
  wireTextSizeControl(app);
  window.scrollTo(0, 0);
}

applyTextSizePreference();

// Tunggu Firebase memulihkan sesi dahulu, kemudian mulakan aplikasi.
app.innerHTML = `<p class="muted" style="padding:1rem">Memuatkan...</p>`;

// Bersihkan service worker lama (jika ada) supaya tidak sekat muatan.
async function cleanupLegacySW() {
  if (!("serviceWorker" in navigator)) return;
  try {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      await reg.unregister();
    }
  } catch {
    /* abaikan */
  }
}

initAuth().then(() => {
  // Jangan tahan paparan aplikasi sementara pembersihan SW berjalan.
  cleanupLegacySW();

  window.addEventListener("hashchange", render);
  render();
}).catch((err) => {
  console.error("Gagal memulakan SPeRK:", err);
  app.innerHTML = `
    <main class="page">
      <section class="card">
        <h1>Sistem tidak dapat dimulakan</h1>
        <p class="error">Sambungan pengesahan gagal. Semak sambungan internet dan cuba muat semula halaman.</p>
        <button class="btn primary" type="button" onclick="location.reload()">Cuba Lagi</button>
      </section>
    </main>`;
});

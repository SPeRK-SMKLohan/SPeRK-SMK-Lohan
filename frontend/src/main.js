import "./style.css";
import { initAuth, isLoggedIn, signOutUser, currentEmail } from "./auth.js";
import { esc } from "./utils/dom.js";
import { renderLogin } from "./pages/login.js";
import { renderDashboard } from "./pages/dashboard.js";
import { renderStudents } from "./pages/students.js";
import { renderItems } from "./pages/items.js";
import { renderNewReceipt } from "./pages/new-receipt.js";
import { renderHistory } from "./pages/history.js";
import { renderReceiptDetail } from "./pages/receipt-detail.js";

const NAV = [
  ["/", "Dashboard"],
  ["/murid", "Murid"],
  ["/barangan", "Barangan"],
  ["/jana-resit", "Jana Resit"],
  ["/sejarah", "Sejarah Resit"],
];

const routes = {
  "/": renderDashboard,
  "/murid": renderStudents,
  "/barangan": renderItems,
  "/jana-resit": renderNewReceipt,
  "/sejarah": renderHistory,
};

const app = document.querySelector("#app");

function currentPath() {
  return location.hash.replace(/^#/, "") || "/";
}

function layoutHtml(path) {
  const active = (p) =>
    path === p || (p === "/sejarah" && path.startsWith("/resit/")) ? "active" : "";
  return `
    <div class="devbar no-print">Mod pembangunan: data rekaan sahaja</div>
    <header class="topbar no-print">
      <div class="brand">Koperasi SMK Lohan</div>
      <nav>${NAV.map(([p, label]) => `<a href="#${p}" class="${active(p)}">${label}</a>`).join("")}</nav>
      <span class="who">${esc(currentEmail())}</span>
      <button id="logout" class="btn small" type="button">Log Keluar</button>
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
    view.innerHTML = `<h1>Halaman tidak dijumpai</h1><p><a href="#/">Kembali ke Dashboard</a></p>`;
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
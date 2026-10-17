import { signIn, signOutUser, loginErrorMessage } from "../shared/auth.js";
import { apiFetch } from "../shared/api.js";

export function renderLogin(root) {
  root.innerHTML = `
    <div class="login-wrap">
      <form id="login-form" class="card login-card">
        <img class="login-logo" src="/logo.svg" alt="Logo SMK Lohan" />
        <h1>Log Masuk</h1>
        <p class="muted">Sistem Pengurusan Pelajar dan Resit Koperasi (SPeRK)<br>SMK Lohan, Ranau</p>
        <label>E-mel
          <input id="email" class="input" type="email" autocomplete="username">
        </label>
        <label>Kata laluan
          <input id="password" class="input" type="password" autocomplete="current-password">
        </label>
        <p id="login-error" class="error"></p>
        <button class="btn primary block" type="submit">Log Masuk</button>
      </form>
    </div>`;

  const form = root.querySelector("#login-form");
  const errorEl = root.querySelector("#login-error");
  const button = form.querySelector("button[type=submit]");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const email = root.querySelector("#email").value.trim();
    const password = root.querySelector("#password").value;
    if (!email || !password) {
      errorEl.textContent = "Sila isi e-mel dan kata laluan.";
      return;
    }

    button.disabled = true;
    button.textContent = "Sedang log masuk...";

    try {
      await signIn(email, password);

      // Pastikan pelayan juga membenarkan akaun ini.
      try {
        await apiFetch("/api/me");
      } catch (err) {
        await signOutUser();
        throw new Error(
          err.status === 403
            ? "Akaun ini tidak dibenarkan menggunakan sistem."
            : err.status
              ? "Pengesahan akaun gagal. Sila cuba lagi."
              : err.message
        );
      }

      location.hash = "/";
    } catch (err) {
      errorEl.textContent = err.code ? loginErrorMessage(err) : err.message;
    } finally {
      button.disabled = false;
      button.textContent = "Log Masuk";
    }
  });
}
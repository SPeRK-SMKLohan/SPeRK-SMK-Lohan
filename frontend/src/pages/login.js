import { signIn, signOutUser, loginErrorMessage } from "../shared/auth.js";
import { apiFetch } from "../shared/api.js";
import { APP_NAME } from "../shared/config.js";

/* Sign in with the approved school account. Validation messages stay in Malay. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }) {
  const errors = {};
  if (!email) errors.email = "Masukkan e-mel sekolah.";
  else if (!EMAIL_RE.test(email)) errors.email = "Format e-mel tidak sah.";
  if (!password) errors.password = "Masukkan kata laluan.";
  return errors;
}

export function renderLogin(root) {
  root.innerHTML = `
    <a class="skip-link" href="#login-form">Langkau ke borang log masuk</a>

    <div class="login-public-bar">
      <a class="brand" href="#/login">
        <span class="brand-mark"><img src="/logo-web.svg" alt="" /></span>
        <span class="brand-text">
          <span class="brand-name">${APP_NAME}</span>
          <span class="brand-sub">SMK Lohan, Ranau</span>
        </span>
      </a>
    </div>

    <main class="login-page">
      <form id="login-form" class="card login-card" novalidate>
        <h1>Log masuk</h1>
        <div id="login-alert" role="alert" aria-live="assertive"></div>

        <div class="field">
          <label class="label" for="email">E-mel sekolah</label>
          <input id="email" class="input" type="email" autocomplete="username"
                 inputmode="email" autocapitalize="none" spellcheck="false"
                 aria-describedby="email-err" required>
          <span class="err" id="email-err"></span>
        </div>

        <div class="field">
          <label class="label" for="password">Kata laluan</label>
          <div class="login-password">
            <input id="password" class="input" type="password" autocomplete="current-password"
                   aria-describedby="password-err" required>
            <button id="toggle-password" class="btn secondary sm" type="button" aria-pressed="false">
              Tunjuk
            </button>
          </div>
          <span class="err" id="password-err"></span>
        </div>

        <button class="btn primary lg block" type="submit">Log masuk</button>

        <div class="login-help">
          <a href="#/panduan">Panduan</a>
          <span class="subtle tiny">Lupa kata laluan? Hubungi pentadbir.</span>
        </div>
      </form>
    </main>`;

  const form = root.querySelector("#login-form");
  const alertBox = root.querySelector("#login-alert");
  const button = form.querySelector("button[type=submit]");
  const passwordInput = root.querySelector("#password");
  const toggle = root.querySelector("#toggle-password");

  toggle.addEventListener("click", () => {
    const show = passwordInput.type === "password";
    passwordInput.type = show ? "text" : "password";
    toggle.setAttribute("aria-pressed", String(show));
    toggle.textContent = show ? "Sembunyi" : "Tunjuk";
    passwordInput.focus();
  });

  function setFieldError(id, message) {
    const input = root.querySelector(`#${id}`);
    const slot = root.querySelector(`#${id}-err`);
    if (slot) slot.textContent = message || "";
    if (input) {
      if (message) input.setAttribute("aria-invalid", "true");
      else input.removeAttribute("aria-invalid");
    }
  }

  function clearErrors() {
    alertBox.innerHTML = "";
    for (const id of ["email", "password"]) setFieldError(id, "");
  }

  for (const id of ["email", "password"]) {
    root.querySelector(`#${id}`).addEventListener("input", () => {
      if (root.querySelector(`#${id}`).getAttribute("aria-invalid") === "true") setFieldError(id, "");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = root.querySelector("#email").value.trim();
    const password = passwordInput.value;
    const errors = validate({ email, password });
    const first = ["email", "password"].find((id) => errors[id]);
    if (first) {
      for (const id of ["email", "password"]) setFieldError(id, errors[id]);
      root.querySelector(`#${first}`).focus();
      return;
    }

    button.disabled = true;
    button.textContent = "Sedang log masuk…";

    try {
      await signIn(email, password);

      // The server also checks that this account is approved for the system.
      try {
        await apiFetch("/api/me");
      } catch (err) {
        await signOutUser();
        throw new Error(
          err.status === 403
            ? "Akaun ini tidak dibenarkan menggunakan sistem. Hubungi pentadbir sekolah."
            : err.status
              ? "Pengesahan akaun gagal. Sila cuba lagi."
              : err.message
        );
      }

      location.hash = "/";
    } catch (err) {
      const message = err.code ? loginErrorMessage(err) : err.message;
      alertBox.innerHTML = `<div class="status bad" role="alert">
        <div class="status-body">
          <strong class="status-title">Tidak dapat log masuk</strong>
          <span class="status-text"></span>
        </div>
      </div>`;
      alertBox.querySelector(".status-text").textContent = message;
      passwordInput.focus();
      passwordInput.select();
    } finally {
      button.disabled = false;
      button.textContent = "Log masuk";
    }
  });
}

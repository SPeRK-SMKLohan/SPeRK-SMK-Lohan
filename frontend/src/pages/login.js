import { signIn, loginErrorMessage } from "../shared/auth.js";
import { APP_NAME } from "../shared/config.js";
import { inlineError } from "../shared/feedback.js";

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

    <main class="login-shell">
      <div class="login-column">
        <div class="login-head">
          <div class="brand">
            <span class="brand-mark"><img src="/logo-web.svg" alt="" /></span>
            <span class="brand-text">
              <span class="brand-name">${APP_NAME}</span>
              <span class="brand-sub">SMK Lohan, Ranau</span>
            </span>
          </div>
        </div>

        <form id="login-form" class="card login-card" novalidate>
          <h1>Log masuk</h1>
          <div id="login-alert"></div>

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

          <div class="field">
            <label class="label" for="teacher-name">Nama guru</label>
            <input id="teacher-name" class="input" type="text" maxlength="100" autocomplete="name"
                   aria-describedby="teacher-name-hint teacher-name-err" required>
            <span class="err" id="teacher-name-err"></span>
            <span class="hint" id="teacher-name-hint">Disimpan pada peranti ini untuk nama pada resit.</span>
          </div>

          <button class="btn primary lg block" type="submit">Log masuk</button>

          <div class="login-help">
            <a href="#/panduan">Panduan</a>
            <span class="subtle tiny">Lupa kata laluan? Hubungi pentadbir.</span>
          </div>
        </form>
      </div>
    </main>`;

  const form = root.querySelector("#login-form");
  const alertBox = root.querySelector("#login-alert");
  const button = form.querySelector("button[type=submit]");
  const passwordInput = root.querySelector("#password");
  const teacherInput = root.querySelector("#teacher-name");
  try { teacherInput.value = localStorage.getItem("sperk-device-staff-name") || ""; } catch {}
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

  // The third field's error key differs from its id ("teacherName" vs
  // "teacher-name"), so one map keeps validation, messages and focus in step.
  const FIELD_IDS = ["email", "password", "teacher-name"];
  const errorKey = (id) => (id === "teacher-name" ? "teacherName" : id);

  function clearErrors() {
    alertBox.innerHTML = "";
    for (const id of FIELD_IDS) setFieldError(id, "");
  }

  for (const id of FIELD_IDS) {
    root.querySelector(`#${id}`).addEventListener("input", () => {
      if (root.querySelector(`#${id}`).getAttribute("aria-invalid") === "true") setFieldError(id, "");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = root.querySelector("#email").value.trim();
    const password = passwordInput.value;
    const teacherName = teacherInput.value.trim();
    const errors = validate({ email, password });
    if (!teacherName) errors.teacherName = "Masukkan nama guru.";
    const first = FIELD_IDS.find((id) => errors[errorKey(id)]);
    if (first) {
      for (const id of FIELD_IDS) setFieldError(id, errors[errorKey(id)]);
      root.querySelector(`#${first}`).focus();
      return;
    }

    button.disabled = true;
    button.textContent = "Sedang log masuk…";

    try {
      await signIn(email, password);
      localStorage.setItem("sperk-device-staff-name", teacherName);
      // Terus buka skrin utama. Permintaan dashboard pertama juga mengesahkan
      // kelayakan akaun, jadi tiada perjalanan rangkaian /api/me berasingan.
      location.hash = "/";
    } catch (err) {
      const message = err.code ? loginErrorMessage(err) : err.message;
      alertBox.innerHTML = inlineError("Tidak dapat log masuk", message);
      passwordInput.focus();
      passwordInput.select();
    } finally {
      button.disabled = false;
      button.textContent = "Log masuk";
    }
  });
}

import { signIn, signOutUser, loginErrorMessage } from "../shared/auth.js";
import { apiFetch } from "../shared/api.js";
import { applyTextSizePreference, textSizePreference, wireTextSizeControl } from "../shared/accessibility.js";
import { getDeviceStaffName, isValidStaffName, setDeviceStaffName } from "../shared/staff-name.js";
import { APP_LONG_NAME } from "../shared/config.js";

/* Sign in.
   Validation is ours, in Malay, and stays on screen until corrected. The form
   is marked novalidate so the browser never replaces these messages with its
   own English bubbles. */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password, staff }) {
  const errors = {};
  if (!email) errors.email = "Sila isi e-mel sekolah anda.";
  else if (!EMAIL_RE.test(email)) errors.email = "E-mel tidak lengkap. Contoh: nama@sekolah.edu.my";
  if (!password) errors.password = "Sila isi kata laluan anda.";
  if (!isValidStaffName(staff)) errors.staff = "Sila isi nama guru, antara 2 dan 80 aksara.";
  return errors;
}

export function renderLogin(root) {
  applyTextSizePreference();

  root.innerHTML = `
    <a class="skip-link" href="#login-form">Langkau ke borang log masuk</a>

    <div class="login-public-bar">
      <a class="brand" href="#/login">
        <span class="brand-mark"><img src="/logo-web.svg" alt="" /></span>
        <span class="brand-text">
          <span class="brand-name">SPeRK</span>
          <span class="brand-sub">SMK Lohan, Ranau</span>
        </span>
      </a>
      <span style="flex:1 1 auto"></span>
      <label class="size-control">
        <span>Saiz teks</span>
        <select id="text-size-toggle" aria-label="Saiz teks" class="select" style="min-height:44px;max-width:11rem">
          <option value="normal"${textSizePreference() === "normal" ? " selected" : ""}>Biasa</option>
          <option value="large"${textSizePreference() === "large" ? " selected" : ""}>Besar</option>
          <option value="largest"${textSizePreference() === "largest" ? " selected" : ""}>Sangat besar</option>
        </select>
      </label>
    </div>

    <div class="login-page">
      <section class="login-intro">
        <p class="eyebrow">Sistem Pengurusan Pelajar dan Resit Koperasi</p>
        <h1>Selamat kembali</h1>
        <p>Log masuk untuk mendaftar murid Tingkatan 1 dan mengeluarkan resit
          koperasi. Semua urusan direkodkan atas nama anda.</p>
        <ul class="login-points">
          <li>Gunakan e-mel sekolah yang telah dibenarkan oleh pentadbir.</li>
          <li>Nama guru disimpan pada peranti ini sahaja, bukan pada akaun.</li>
          <li>Log keluar selepas menggunakan peranti yang dikongsi.</li>
        </ul>
      </section>

      <form id="login-form" class="card login-card" novalidate>
        <h2>Log Masuk</h2>
        <p class="lede">${APP_LONG_NAME}</p>
        <p class="hint" style="margin-bottom:var(--s4)">Semua ruang di bawah wajib diisi.</p>

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
          <div style="position:relative">
            <input id="password" class="input" type="password" autocomplete="current-password"
                   aria-describedby="password-err" required style="padding-right:7rem">
            <button id="toggle-password" class="btn secondary sm" type="button"
                    aria-pressed="false"
                    style="position:absolute;right:6px;top:50%;transform:translateY(-50%);min-height:44px">
              Tunjuk
            </button>
          </div>
          <span class="err" id="password-err"></span>
        </div>

        <div class="field">
          <label class="label" for="staff-name">Nama guru</label>
          <input id="staff-name" class="input" type="text" autocomplete="name"
                 maxlength="80" placeholder="Contoh: Cikgu Ahmad"
                 aria-describedby="staff-help staff-err" required>
          <p class="hint" id="staff-help">Nama ini dicetak pada resit yang anda jana.
            Ia diingati pada peranti ini sahaja.</p>
          <span class="err" id="staff-name-err"></span>
        </div>

        <button class="btn primary lg block" type="submit">Log Masuk</button>

        <div class="login-help">
          <a href="#/panduan">Buka Panduan Penggunaan</a>
          <span class="subtle tiny">Lupa kata laluan? Hubungi pentadbir sistem.</span>
        </div>
      </form>
    </div>`;

  wireTextSizeControl(root);

  const form = root.querySelector("#login-form");
  const alertBox = root.querySelector("#login-alert");
  const button = form.querySelector("button[type=submit]");
  const staffInput = root.querySelector("#staff-name");
  const passwordInput = root.querySelector("#password");
  const toggle = root.querySelector("#toggle-password");

  staffInput.value = getDeviceStaffName();

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
    for (const id of ["email", "password", "staff-name"]) setFieldError(id, "");
  }

  // Clear a field's error as soon as the user starts fixing it.
  for (const [id, key] of [["email", "email"], ["password", "password"], ["staff-name", "staff"]]) {
    root.querySelector(`#${id}`).addEventListener("input", () => {
      if (root.querySelector(`#${id}`).getAttribute("aria-invalid") === "true") setFieldError(id, "");
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearErrors();

    const email = root.querySelector("#email").value.trim();
    const password = passwordInput.value;
    const staff = staffInput.value;

    const errors = validate({ email, password, staff });
    const first = ["email", "password", "staff-name"].find((id) =>
      errors[id === "staff-name" ? "staff" : id]
    );
    if (first) {
      for (const id of ["email", "password", "staff-name"]) {
        setFieldError(id, errors[id === "staff-name" ? "staff" : id]);
      }
      root.querySelector(`#${first}`).focus();
      return;
    }

    button.disabled = true;
    button.textContent = "Sedang log masuk…";

    try {
      await signIn(email, password);

      // The server must also allow this account.
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

      if (!setDeviceStaffName(staff)) {
        // Not fatal: the name can be set on the receipt screen.
        console.warn("Nama guru tidak dapat disimpan pada peranti ini.");
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
      button.textContent = "Log Masuk";
    }
  });
}

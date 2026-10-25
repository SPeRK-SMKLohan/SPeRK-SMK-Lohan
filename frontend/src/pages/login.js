import { signIn, signOutUser, loginErrorMessage } from "../shared/auth.js";
import { apiFetch } from "../shared/api.js";
import { wireTextSizeControl } from "../shared/accessibility.js";
import { getDeviceStaffName, isValidStaffName, setDeviceStaffName } from "../shared/staff-name.js";

export function renderLogin(root) {
  root.innerHTML = `
    <a class="skip-link" href="#login-form">Langkau ke borang log masuk</a>
    <div class="login-wrap">
      <div class="login-tools"><label class="text-size-control">Saiz teks
        <select id="text-size-toggle" class="input" aria-label="Saiz teks">
          <option value="normal">Biasa</option><option value="large">Besar</option><option value="largest">Sangat besar</option>
        </select>
      </label></div>
      <form id="login-form" class="login-card">
        <span class="login-crest"><img class="login-logo" src="/logo-web.svg" alt="Logo SMK Lohan" /></span>
        <h1>Log Masuk</h1>
        <p class="muted">Sistem Pengurusan Pelajar dan Resit Koperasi (SPeRK)<br>SMK Lohan, Ranau</p>
        <label>E-mel
          <input id="email" class="input" type="email" autocomplete="username">
        </label>
        <label>Kata laluan
          <input id="password" class="input" type="password" autocomplete="current-password">
        </label>
        <label>Nama guru
          <input id="staff-name" class="input" type="text" autocomplete="name" maxlength="80" placeholder="Contoh: Cikgu Ahmad" aria-describedby="staff-help" required>
        </label>
        <p id="staff-help" class="muted staff-help">Nama ini diingati pada peranti ini. Guru pada peranti lain boleh memasukkan nama masing-masing.</p>
        <p id="login-error" class="error"></p>
        <button class="btn primary block" type="submit">Log Masuk</button>
        <p class="login-guide"><a href="#/panduan">Buka Panduan Penggunaan</a></p>
      </form>
    </div>`;

  wireTextSizeControl(root);

  const form = root.querySelector("#login-form");
  const errorEl = root.querySelector("#login-error");
  const button = form.querySelector("button[type=submit]");
  const staffNameInput = root.querySelector("#staff-name");
  staffNameInput.value = getDeviceStaffName();

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const email = root.querySelector("#email").value.trim();
    const password = root.querySelector("#password").value;
    if (!email || !password) {
      errorEl.textContent = "Sila isi e-mel dan kata laluan.";
      return;
    }
    if (!isValidStaffName(staffNameInput.value)) {
      errorEl.textContent = "Nama guru mesti 2 hingga 80 aksara.";
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
      setDeviceStaffName(staffNameInput.value);
      location.hash = "/";
    } catch (err) {
      errorEl.textContent = err.code ? loginErrorMessage(err) : err.message;
    } finally {
      button.disabled = false;
      button.textContent = "Log Masuk";
    }
  });
}

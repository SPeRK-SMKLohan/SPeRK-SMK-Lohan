import { login } from "../state.js";

export function renderLogin(root) {
  root.innerHTML = `
    <div class="login-wrap">
      <form id="login-form" class="card login-card">
        <h1>Log Masuk</h1>
        <p class="muted">Sistem Resit Koperasi SMK Lohan, Ranau</p>
        <label>E-mel
          <input id="email" class="input" type="email" autocomplete="username">
        </label>
        <label>Kata laluan
          <input id="password" class="input" type="password" autocomplete="current-password">
        </label>
        <p id="login-error" class="error"></p>
        <button class="btn primary block" type="submit">Log Masuk</button>
        <p class="notice">Log masuk palsu untuk ujian. Mana-mana e-mel dan kata laluan diterima.
        Log masuk sebenar (Firebase) ditambah pada Fasa 3.</p>
      </form>
    </div>`;

  root.querySelector("#login-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const email = root.querySelector("#email").value.trim();
    const password = root.querySelector("#password").value;
    if (!email || !password) {
      root.querySelector("#login-error").textContent = "Sila isi e-mel dan kata laluan.";
      return;
    }
    login();
    location.hash = "/";
  });
}
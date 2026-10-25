import { esc } from "./dom.js";

export function loadingState(message) {
  return `<p class="loading-state muted" role="status" aria-live="polite">
    <span class="loading-indicator" aria-hidden="true"></span><span>${esc(message)}</span>
  </p>`;
}

export function readErrorState(error, subject = "Maklumat", retryLabel = "Cuba semula") {
  const message = error?.message || "Sila cuba semula sebentar lagi.";
  const connectionIssue = !error?.status || /rangkaian|internet|terlalu lama|sambungan/i.test(message);
  const title = connectionIssue ? "Sambungan terganggu" : `${subject} belum dapat dimuatkan`;
  const guidance = connectionIssue
    ? "Semak sambungan internet anda. Maklumat yang telah dipilih dikekalkan."
    : "Cuba semula. Jika masalah berterusan, maklumkan pentadbir sistem.";

  return `<div class="load-error" role="alert">
    <strong>${title}</strong>
    <span>${esc(guidance)}</span>
    <span class="load-error-detail">${esc(message)}</span>
    <button class="btn primary" type="button" data-retry-load>${esc(retryLabel)}</button>
  </div>`;
}

export function wireReadRetry(root, retry) {
  root.querySelector("[data-retry-load]")?.addEventListener("click", retry);
}

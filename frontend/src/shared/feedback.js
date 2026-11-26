import { esc } from "./dom.js";

/* Shared loading and failure presentation. Every data page uses these so the
   same situation always looks and reads the same way. */

export function loadingState(message) {
  return `<p class="loading" role="status" aria-live="polite">
    <span class="spinner" aria-hidden="true"></span><span>${esc(message)}</span>
  </p>`;
}

export function readErrorState(error, subject = "Maklumat", retryLabel = "Cuba semula") {
  const message = error?.message || "Sila cuba semula sebentar lagi.";
  const connectionIssue = !error?.status || /rangkaian|internet|terlalu lama|sambungan/i.test(message);
  const title = connectionIssue ? "Sambungan terganggu" : `${subject} belum dapat dimuatkan`;
  const guidance = connectionIssue
    ? "Semak internet. Pilihan dikekalkan."
    : "Cuba lagi. Jika masih gagal, hubungi pentadbir.";

  return `<div class="fail" role="alert">
    <strong class="fail-title">${esc(title)}</strong>
    <span class="fail-text">${esc(guidance)}</span>
    <span class="fail-detail">${esc(message)}</span>
    <button class="btn secondary" type="button" data-retry-load>${esc(retryLabel)}</button>
  </div>`;
}

export function wireReadRetry(root, retry) {
  root.querySelector("[data-retry-load]")?.addEventListener("click", retry);
}

/* Inline error inside a form or dialog. The banner itself is the live region,
   so callers keep their wrapper as a plain container and an inserted message is
   announced once. Both strings are escaped here so raw API errors are safe. */
export function inlineError(title, message = "") {
  return `<div class="status bad" role="alert">
    <div class="status-body">
      <strong class="status-title">${esc(title)}</strong>
      <span class="status-text">${esc(message)}</span>
    </div>
  </div>`;
}

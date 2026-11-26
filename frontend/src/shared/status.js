/* Persistent status feedback.

   A toast disappears while the user is still reading it. For staff working at
   a counter that is the wrong trade-off: after "Tanda daftar" they need to know
   the action worked, and they need a visible way to undo it. This docked banner
   stays until the next action or until it is dismissed, and an undo action is
   shown as expired rather than silently vanishing. */

let timer = null;

/* The live region must be in the DOM *before* its content changes: creating it
   and inserting the banner in the same task is the classic reason a screen
   reader says nothing at all. main.js calls this once at boot; dock() keeps the
   lazy fallback for any other entry point. showStatus() switches politeness per
   message, so failures are assertive and successes polite. */
export function ensureStatusDock() {
  let el = document.querySelector("#status-dock");
  if (el) return el;
  el = document.createElement("div");
  el.id = "status-dock";
  el.className = "status-dock no-print";
  el.setAttribute("aria-live", "polite");
  el.setAttribute("aria-atomic", "true");
  document.body.append(el);
  return el;
}

function dock() {
  return ensureStatusDock();
}

export function clearStatus() {
  clearTimeout(timer);
  timer = null;
  const el = document.querySelector("#status-dock");
  if (el) el.innerHTML = "";
}

const TITLES = {
  ok: "Berjaya",
  bad: "Tidak berjaya",
  warn: "Perhatian",
  info: "Makluman",
};

export function showStatus({
  type = "ok",
  title,
  message = "",
  actionLabel,
  onAction,
  timeout = 0,
  dismissible = true,
} = {}) {
  clearTimeout(timer);
  const host = dock();
  const heading = title || TITLES[type] || TITLES.info;

  // One live region, one announcement. Errors are assertive; everything else is
  // polite. Nesting a second role="alert" inside the polite dock used to make
  // screen readers read the same failure twice.
  host.setAttribute("aria-live", type === "bad" ? "assertive" : "polite");

  host.innerHTML = `
    <div class="status ${type}">
      <div class="status-body">
        <strong class="status-title">${heading}</strong>
        <span class="status-text"></span>
        <div class="status-actions"></div>
      </div>
      ${dismissible ? `<button class="status-close" type="button" aria-label="Tutup makluman">✕</button>` : ""}
    </div>`;

  // Text is set through the DOM, never interpolated into HTML.
  host.querySelector(".status-text").textContent = message;
  const actions = host.querySelector(".status-actions");

  if (actionLabel && onAction) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn secondary sm";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      clearStatus();
      onAction();
    });
    actions.append(btn);

    if (timeout) {
      // State the window in words instead of counting down, so a screen reader
      // hears two announcements rather than one per second.
      const note = document.createElement("span");
      note.className = "status-text";
      note.textContent = `Boleh dibatalkan dalam ${Math.round(timeout / 1000)} saat.`;
      actions.append(note);

      timer = setTimeout(() => {
        btn.disabled = true;
        btn.textContent = `${actionLabel} — tamat`;
        note.textContent = "Pilihan ini tidak lagi tersedia. Gunakan butang pada baris murid.";
        timer = setTimeout(clearStatus, 2500);
      }, timeout);
    }
  } else if (timeout) {
    timer = setTimeout(clearStatus, timeout);
  }

  host.querySelector(".status-close")?.addEventListener("click", clearStatus);
}

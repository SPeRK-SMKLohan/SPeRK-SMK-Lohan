// Mesej maklum balas pantas di bawah skrin, dengan pilihan "Batal" (undo).
export function showToast(message, { actionLabel, onAction, type = "ok", timeout = 8000 } = {}) {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap no-print";
    wrap.setAttribute("role", "status");
    wrap.setAttribute("aria-live", "polite");
    document.body.append(wrap);
  }

  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  const text = document.createElement("span");
  text.textContent = message;
  toast.append(text);

  let timer;
  const close = () => toast.remove();

  if (actionLabel && onAction) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "toast-action";
    btn.textContent = actionLabel;
    btn.addEventListener("click", () => {
      clearTimeout(timer);
      close();
      onAction();
    });
    toast.append(btn);
  }

  wrap.append(toast);
  timer = setTimeout(close, timeout);
}

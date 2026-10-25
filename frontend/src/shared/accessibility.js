const TEXT_SIZE_KEY = "sperk-large-text";

export function largeTextEnabled() {
  try { return localStorage.getItem(TEXT_SIZE_KEY) === "true"; }
  catch { return false; }
}

export function applyTextSizePreference() {
  document.documentElement.classList.toggle("large-text", largeTextEnabled());
}

export function wireTextSizeControl(root) {
  const button = root.querySelector("#text-size-toggle");
  if (!button) return;
  const sync = () => {
    const enabled = document.documentElement.classList.contains("large-text");
    button.setAttribute("aria-pressed", String(enabled));
    if (button.classList.contains("text-size-toggle")) {
      button.textContent = enabled ? "A−" : "A+";
      button.setAttribute("aria-label", enabled ? "Kembalikan saiz teks biasa" : "Besarkan saiz teks");
      button.title = enabled ? "Kembalikan saiz teks biasa" : "Besarkan saiz teks";
    } else {
      button.textContent = enabled ? "A− Saiz teks biasa" : "A+ Saiz teks besar";
    }
  };
  sync();
  button.addEventListener("click", () => {
    const enabled = !document.documentElement.classList.contains("large-text");
    document.documentElement.classList.toggle("large-text", enabled);
    try { localStorage.setItem(TEXT_SIZE_KEY, String(enabled)); }
    catch { /* Tetapan masih terpakai untuk tab ini. */ }
    sync();
  });
}

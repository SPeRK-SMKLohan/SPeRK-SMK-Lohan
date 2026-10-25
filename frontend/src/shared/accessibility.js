const TEXT_SIZE_KEY = "sperk-text-size";

export function textSizePreference() {
  try {
    const saved = localStorage.getItem(TEXT_SIZE_KEY);
    if (["normal", "large", "largest"].includes(saved)) return saved;
    // Kekalkan pilihan A+ daripada versi terdahulu.
    if (localStorage.getItem("sperk-large-text") === "true") return "large";
  } catch { /* Gunakan tetapan lalai jika simpanan tidak tersedia. */ }
  return "normal";
}

export function applyTextSizePreference() {
  document.documentElement.classList.remove("text-size-large", "text-size-largest");
  const preference = textSizePreference();
  if (preference !== "normal") document.documentElement.classList.add(`text-size-${preference}`);
}

export function wireTextSizeControl(root) {
  const select = root.querySelector("#text-size-toggle");
  if (!select) return;
  const plus = root.querySelector("#text-size-plus");
  const levels = ["normal", "large", "largest"];
  const save = (preference) => {
    select.value = preference;
    try {
      localStorage.setItem(TEXT_SIZE_KEY, preference);
      localStorage.removeItem("sperk-large-text");
    } catch { /* Tetapan masih terpakai untuk tab ini. */ }
    applyTextSizePreference();
    if (plus) {
      plus.setAttribute("aria-pressed", String(preference !== "normal"));
      plus.title = preference === "largest" ? "Saiz teks paling besar" : "Besarkan teks";
    }
  };
  save(textSizePreference());
  select.addEventListener("change", () => {
    save(levels.includes(select.value) ? select.value : "normal");
  });
  plus?.addEventListener("click", () => {
    save(textSizePreference() === "normal" ? "large" : "normal");
  });
}

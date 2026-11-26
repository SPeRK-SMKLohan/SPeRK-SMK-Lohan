/* Icons in one place: 24×24 stroke paths, drawn with the text colour.
   Inline SVG means no icon font, no extra request and no build step — the
   whole set costs about 1.5 KB and there is exactly one file to edit. */

const PATHS = {
  home: '<path d="M3.7 10.4 12 3.9l8.3 6.5V20a.9.9 0 0 1-.9.9h-4.9v-5.6H9.5V20.9H4.6a.9.9 0 0 1-.9-.9z"/>',
  students: '<circle cx="9.4" cy="8" r="3.2"/><path d="M3.6 20c0-3.1 2.6-5.1 5.8-5.1s5.8 2 5.8 5.1"/><path d="M18.4 8.4v5M15.9 10.9h5"/>',
  receipt: '<path d="M6 3.6h12v16.8l-2-1.3-2 1.3-2-1.3-2 1.3-2-1.3-2 1.3z"/><path d="M9 8.4h6M9 11.7h6M9 15h3.2"/>',
  report: '<path d="M4 20.2V11.5M10 20.2V4.2M16 20.2v-5.6"/><path d="M2.6 20.2h18.8"/>',
  import: '<path d="M12 3.6v10.2m0 0 4.1-4.1M12 13.8 7.9 9.7"/><path d="M4.2 16.8v3.4h15.6v-3.4"/>',
  guide: '<path d="M4 4.6h5.6a2.4 2.4 0 0 1 2.4 2.4v13.4a1.8 1.8 0 0 0-1.8-1.8H4z"/><path d="M20 4.6h-5.6A2.4 2.4 0 0 0 12 7v13.4a1.8 1.8 0 0 1 1.8-1.8H20z"/>',
  plus: '<path d="M12 5.2v13.6M5.2 12h13.6"/>',
  arrow: '<path d="M4.2 12h15.2m0 0-5.4-5.4M19.4 12l-5.4 5.4"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6"/>',
  logout: '<path d="M9.4 4.2H5.6A1.6 1.6 0 0 0 4 5.8v12.4a1.6 1.6 0 0 0 1.6 1.6h3.8"/><path d="M15.2 8.2 19 12l-3.8 3.8M18.6 12H9.4"/>',
};

export function icon(name, className = "") {
  const path = PATHS[name];
  if (!path) return "";
  return `<svg class="ico${className ? ` ${className}` : ""}" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"
    aria-hidden="true" focusable="false">${path}</svg>`;
}

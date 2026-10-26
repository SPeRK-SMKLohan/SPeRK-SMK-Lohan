# Design system v2 — Corporate

The system introduced by the Phase 2 reconstruction and refined in the follow-up
UI revision. It replaces both the previous institutional navy/terracotta system
and the later "Tenang" warm-paper variant; the old ones are documented in
[design-system.md](design-system.md) and remain the "before" references.

Everything below is defined in `frontend/src/style.css` and verified in a browser
with `after-capture.mjs` (which computes per-element WCAG 2.x contrast on every
captured screen).

---

## 1. Why this direction

The audience is school staff at a counter: older users, shared devices, bright
rooms, and a task that must be completed correctly in one pass. The previous
interface was already high-contrast and large-typed, which was right. What it
lacked was **calm and hierarchy** — deep navy panels, terracotta accents and
heavy shadows gave every element a similar visual weight, so the one action that
mattered did not stand out from the twelve that did not.

"Corporate" keeps the large type and high contrast, and changes the atmosphere:
a single corporate blue for action and links, cool neutral surfaces instead of
warm paper, and no beige anywhere. Shadows are restrained. Borders carry
structure.

| Decision | Reason |
|---|---|
| Corporate blue `#0F4C81` instead of navy `#17324F` or pine `#0E4A40` | One unambiguous brand colour for action and links; ~8.9:1 white text on it. |
| Cool neutral page `#F4F6F9` instead of warm paper `#F4F1EA` | No glare under fluorescent light; removes every beige/warm tone from the interface. |
| Atkinson Hyperlegible for body, Lexend Deca for headings | Atkinson was designed for low vision with deliberately dissimilar letterforms (I/l/1, O/0, b/d); Lexend is a clean, open display face for the wordmark and titles. |
| 18 px body, 1.6 line height (was 1.55) | Longer line height helps slow readers track lines. |
| No thick coloured left edge on cards | The earlier status banner and cards carried a 6 px coloured left rule; it read as a severity signal that was not always meaningful, so it was removed. Status is now conveyed by word, colour and an icon inside a plain bordered panel. |
| No shadows on lists and rows | Depth was doing no work; borders are cheaper to read. |

---

## 2. Colour tokens

```css
--brand: #0F4C81;        --brand-deep: #0A3A63;   --brand-soft: #DCE9F6;
--accent: #0F4C81;       --accent-deep: #0A3A63;  --accent-soft: #DCE9F6;
--bg: #F4F6F9;           --surface: #FFFFFF;      --surface-2: #FAFBFD;
--ink: #101828;          --ink-2: #344054;        --ink-3: #5D6B7F;
--line: #E1E6ED;         --line-2: #CDD5E0;       --line-strong: #7A8798;
--ok: #1B6B44;           --warn: #7A5100;         --bad: #A32626;   --info: #14568C;
--focus: #0B57D0;
```

### Measured contrast (computed against the WCAG 2.x relative-luminance formula)

| Pair | Ratio | Requirement | Result |
|---|---:|---:|---|
| Body ink on page background | ~16.4:1 | 4.5:1 | Pass |
| Secondary ink on white | ~9.7:1 | 4.5:1 | Pass |
| Muted ink on white | ~5.4:1 | 4.5:1 | Pass |
| White on brand (primary button, header) | ~8.9:1 | 4.5:1 | Pass |
| Link (accent) on white | ~8.9:1 | 4.5:1 | Pass |
| **Control border on white** | **~3.6:1** | 3:1 | **Pass** (was 1.81:1) |
| Focus ring on white | 6.3:1 | 3:1 | Pass |
| Focus ring on brand header | separated by a 3 px white halo | 3:1 | Pass |
| Success / warning / danger text on their soft fills | 6.1 / 6.4 / 6.2:1 | 4.5:1 | Pass |

The control boundary was the one non-text failure in the old system (1.81:1).
`--line-strong` is now `#7A8798`, giving ~3.6:1 against white and against the
page background, so an empty field is visible before it is focused.

The full per-screen sweep (every text node vs its effective background) is run
by `after-capture.mjs` and recorded in `after-report.json`; **0 contrast
failures** were found across the captured set, with the lowest combination well
above the 4.5:1 threshold.

---

## 3. Typography

| Role | Family | Size | Weight | Line height |
|---|---|---|---:|---:|
| Root | — | 18 px (112.5%) | — | — |
| Display / h1 | Lexend Deca | 38 px (34 px ≤640) | 700 | 1.22 |
| Section / h2 | Lexend Deca | 27 px | 650 | 1.22 |
| Subsection / h3 | Lexend Deca | 21.4 px | 650 | 1.22 |
| Body | Atkinson Hyperlegible | 18 px | 400 | 1.6 |
| Lead paragraph | Atkinson Hyperlegible | 19 px | 400 | 1.55 |
| Label | Atkinson Hyperlegible | 18 px | 650 | 1.4 |
| Hint / meta | Atkinson Hyperlegible | 16.9 px | 400 | 1.45 |
| Table | Atkinson Hyperlegible | 16.9 px | 400 | 1.5 |
| Money, IC, receipt numbers | Atkinson Hyperlegible, tabular figures | inherited | 400–700 | tabular |

Two self-hosted font families, each in latin + latin-ext subsets, all SIL Open
Font License (see `/fonts/OFL-*.txt`). Nothing new is downloaded at runtime.

**Text size preference** — three steps that actually differ:

| Option | Root | Effect on body |
|---|---:|---|
| Biasa | 112.5% (18 px) | baseline |
| Besar | 131.25% (21 px) | +17% |
| Sangat besar | 150% (24 px) | +33% |

Percentages are used rather than fixed pixels, so a user who has already set a
larger default in their browser keeps that advantage.

---

## 4. Spacing and shape

| Token | Value | Use |
|---|---|---|
| `--s1` … `--s7` | 0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 / 3 rem | All internal spacing |
| `--gutter` | `clamp(14px, 4vw, 32px)` | Page padding; in px so it does not balloon at large text |
| `--page-max` | 1160 px | Content column |
| `--r-sm` / `--r-md` / `--r-lg` | 8 / 12 / 18 px | Controls / rows and panels / cards and dialogs |
| `--shadow-1/2/3` | 2 px, 30 px, 60 px blur | Cards, dock, dialogs only |

Spacing is in `rem`, so the whole layout scales with the text-size preference
rather than only the type. The page gutter is the exception, deliberately in
`px`, so a 320 px screen does not lose half its width to padding at 24 px text.

---

## 5. Components

| Component | Spec | Notes |
|---|---|---|
| `.btn` | min-height 54 px, radius 12 px, 18 px/650 | `primary` (brand), `secondary` (white + 3.6:1 border), `quiet` (link-style), `danger`, `ok` |
| `.btn.sm` | 46 px | Table and toolbar actions |
| `.btn.lg` | 64 px | The one action on a screen (sign in, save receipt) |
| `.input` | min-height 56 px, 1.5 px border, radius 12 px, 19 px text | White fill on white card, identified by the border alone — hence the 3.6:1 border |
| `.select` | As input, with an inline SVG chevron | No custom JS listbox |
| `.choice` | 60 px row, 26 px radio/checkbox, tinted when checked | Used for OKU, status, payment method, confirmations |
| `.seg` | Segmented control, 48 px buttons, `aria-pressed` | Status filter |
| `.chip` | 56 px, used for school selection | Selected state inverts to brand |
| `.card` | 18 px radius, 1 px border, 24 px padding, minimal shadow | |
| `.record` | Two-column grid, 18 px name, quiet meta line, right-aligned actions | Replaces the six-column table |
| `.status` | Plain 1 px border, soft fill, title + text + actions | Success / warning / danger / info. **No thick coloured left rule** — colour and icon live inside the panel. |
| `.status-dock` | Fixed bottom, dismissible, max 760 px | Persistent action feedback |
| `.trolley` | Fixed bottom bar with running total and primary action | Receipt screen |
| `.modal` | Native `<dialog>`, 720 px max, sticky footer | |
| `.steps` / `.step-block` | Numbered circles, one block per section | Receipt and import |
| `.meter` | 14 px bar | Registration progress. The fill is now brand blue, not green. |
| `.table` | 16.9 px, uppercase headers, 28 px minimum link target | Report and import preview |

---

## 6. Navigation

| Surface | Behaviour |
|---|---|
| Desktop header (≥1081 px) | Brand, four flat links, text-size select, no Log Keluar in the header. **No dropdowns.** |
| Tablet/phone (≤1080 px) | Brand, one **Menu** button, then the tools row |
| Small phone (≤560 px) | Header stays on **one row** (brand + Menu + text-size), so the bar is 60 px instead of 112 px. It grows to a second row only when the *Sangat besar* text size genuinely needs more room — nothing is hidden and no type is shrunk to force a fit. **Log Keluar lives in the footer**, so it is never squeezed into the header. |
| Mobile menu | Full-screen list of 64 px rows grouped Kerja harian / Alat lain, with a **Log Keluar** row at the bottom. Label changes to **Tutup**; Escape closes and returns focus to the button. |
| Footer | Import, Barangan and Panduan plus the **Log Keluar** button. On phones (≤560 px) the three tool links drop out — they are already in the menu — leaving a single 54 px row with Log Keluar. |

The four header links cover the daily work (Utama, Pendaftaran, Jana Resit,
Laporan). The three tools live on the home screen and in the footer, so nothing
is hidden behind a hover or a nested menu.

The "Sejarah Resit" page was removed; its receipts are now reached through the
**Laporan** page, which gained a search field (`#report-q`) so staff can find a
receipt by number or by student name directly from the report.

---

## 7. Layout constants that removed whole classes of bug

| Constant | Value | Bug it prevents |
|---|---|---|
| `--header-h` | 76 / 64 / 60 px by breakpoint, **and re-measured at runtime** | The old `scroll-margin-top: 84px` against a 64–194 px header hid guide headings. `scroll-padding-top: calc(var(--header-h) + 1rem)` now derives from the same token the header uses, and `syncHeaderHeight()` updates it after fonts load and at every resize, so it stays correct even at the largest text size. |
| `.guide-body > section { scroll-margin-top: … }` | Same expression | Belt and braces for programmatic scrolling. |
| `min-height` on every control | 44–64 px | Sub-24 px targets. |
| `overflow-wrap: anywhere` on record names | — | Long names pushing rows wider than the screen. |

---

## 8. Motion and preferences

- `prefers-reduced-motion: reduce` disables smooth scrolling and every transition.
- `forced-colors: active` restores borders and system highlight colours.
- Focus is always visible: 3 px `#0B57D0` with a 5 px white halo, which survives
  on the dark header, on primary buttons and on tinted rows.
- Print: header, footer, toolbar, dock and trolley are removed; the receipt
  document prints on its own.

---

## 9. What was carried over from the old system

- The school crest and the three logo files.
- Two self-hosted font families (Atkinson Hyperlegible, Lexend Deca).
- 18 px base type and the `sperk-text-size` storage key (including the legacy
  `sperk-large-text` migration).
- Masked ICs, uppercase student names, and the Malay task vocabulary
  (`Tanda daftar`, `Jana Resit`, `Laporan Koperasi`).
- The formal receipt document and its print rules.
- Status as word + symbol, never colour alone.

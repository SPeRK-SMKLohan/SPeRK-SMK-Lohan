# Existing design system

> **Phase 1 record.** This document describes the interface *before* the
> reconstruction and is kept as the baseline. The current system is documented in
> [design-system-v2.md](design-system-v2.md) and the measured results in
> [after-verification.md](after-verification.md).

Everything below is measured from the running application (`main` @ `6c347c7`,
Vite dev server, 1440 × 900 unless stated) or read directly from
`frontend/src/style.css`. Computed values are given where they differ from the
declared tokens.

The system is deliberate and internally coherent: an "institutional" palette of
deep navy and terracotta, self-hosted variable fonts, and a large-type, large-target
baseline. It is not an off-the-shelf theme, and it should not be replaced
wholesale.

---

## 1. Colour

### Declared tokens (`:root`)

| Token | Value | Role |
|---|---|---|
| `--primary` | `#17324F` | Primary buttons, active nav, skip link |
| `--primary-deep` | `#10263D` | Headings |
| `--accent` | `#853128` | Links, terracotta accent |
| `--accent-hover` | `#64231D` | Link hover |
| `--accent-soft` / `--accent-soft-ink` | `#FFDAD5` / `#76221B` | "Sudah daftar" badge |
| `--green` / `--green-soft` | `#195331` / `#E8F3EC` | Success, confirmed payment |
| `--indigo-soft` / `--indigo-soft-ink` | `#D7E3F9` / `#101C2C` | Tingkatan label, bank transfer |
| `--gold-soft` / `--gold-soft-ink` | `#FFDEA6` / `#271900` | OKU label |
| `--amber` / `--amber-soft` | `#8C6505` / `#FEF7E6` | Warnings, duplicates, inactive |
| `--danger` / `--danger-soft` | `#A31919` / `#FFDAD6` | Errors, destructive actions |
| `--background` | `#F3F5F7` | Page background |
| `--surface` | `#FFFFFF` | Cards |
| `--surface-low` … `--surface-highest` | `#F3F3F4` … `#E2E2E2` | Neutral fills, inputs, chips |
| `--text-primary` / `--text-secondary` / `--text-muted` | `#1A1C1C` / `#343C46` / `#4B5561` | Text ramp |
| `--border` / `--border-strong` | `#D7DDE4` / `#AEB8C4` | Card border / control border |
| `--focus` | `#005FCC` | Focus ring |

### Measured contrast

| Pair | Ratio | Requirement | Result |
|---|---:|---:|---|
| Body text `#1A1C1C` on page `#F3F5F7` | 15.4:1 | 4.5:1 | Pass |
| Secondary text `#343C46` on white | 10.1:1 | 4.5:1 | Pass |
| Link `#853128` on white | 8.51:1 | 4.5:1 | Pass |
| White on primary button `#17324F` | 13.08:1 | 4.5:1 | Pass |
| Focus ring `#005FCC` on white card | 5.98:1 | 3:1 | Pass |
| Focus ring on page background | 5.48:1 | 3:1 | Pass |
| Green badge `#195331` on `#E8F3EC` | 7.95:1 | 4.5:1 | Pass |
| Amber badge `#8C6505` on `#FEF7E6` | 4.94:1 | 4.5:1 | Pass |
| Accent-soft badge `#76221B` on `#FFDAD5` | 8.06:1 | 4.5:1 | Pass |
| Indigo badge `#101C2C` on `#D7E3F9` | 13.27:1 | 4.5:1 | Pass |
| **Input border `#AEB8C4` on input fill `#F3F3F4`** | **1.81:1** | 3:1 | **Fail (1.4.11)** |
| **Input fill `#F3F3F4` on white card** | **1.07:1** | 3:1 | **Fail (1.4.11)** |
| Card border `#D7DDE4` on white | 1.37:1 | — (decorative) | Not required |

A sweep of every distinct foreground/background/font-size combination on
`#/login` and `#/panduan` at 375 px and 1440 px found **no text contrast failure**;
the lowest ratio observed on any text was 7.68:1. The only non-text failures are
the input boundary pairs above.

---

## 2. Typography

| Element | Family | Size | Weight | Line height | Colour |
|---|---|---|---:|---:|---|
| Root | — | **18 px** (112.5%) | — | — | — |
| Body | Inter | 18 px | 400 | 27.9 px (1.55) | `#1A1C1C` |
| h1 | Plus Jakarta Sans | 36 px desktop / 27 px ≤640 px | 650 | 1.3 | `#10263D` |
| h2 (guide) | Plus Jakarta Sans | 24.3 px | 650 | 1.3 | `#10263D` |
| h3 | Plus Jakarta Sans | 20.25 px | 650 | 1.3 | `#10263D` |
| Brand name | Plus Jakarta Sans | 24.75 px (1440) / 18.9 px (320) | 600 | — | `#10263D` |
| Form label | Inter | 18 px | 600 | — | `#343C46` |
| Helper text | Inter | 18 px | 400 | 27.9 px | `#343C46` |
| `.muted` | Inter | 16.875 px (0.9375 rem) | 400 | — | `#343C46` |
| `.notice` | Inter | 16.875 px | 400 | 1.5 | `#343C46` |
| Guide body copy | Inter | 18 px | 400 | 29.7 px (1.65) | `#1A1C1C` |
| Mono (numbers, receipt) | Roboto Mono | inherited | — | — | — |

Fonts are self-hosted WOFF2 variable fonts (`Inter-Variable.woff2`,
`PlusJakartaSans-Variable.woff2`, `RobotoMono-Variable.woff2`) with
`font-display: swap` and `<link rel=preload>` in `index.html`. This matters on a
school network and should be preserved.

**Text size preference.** Three options — Biasa / Besar / Sangat besar — set the
root to 112.5% / 125% / 137.5%, i.e. **18 / 20 / 22 px** at a 16 px browser
default. Verified: at 320 px with "Sangat besar", root measured 22 px and
horizontal overflow remained 0 px.

---

## 3. Spacing and layout

| Property | Value |
|---|---|
| Page max width | 1120 px |
| Page padding | 40 px top / 24 px sides / 64 px bottom; 20 / 14 / 40 px at ≤640 px |
| Card padding | 24 px (`.card`); login card 56 px top / 40 px sides / 32 px bottom |
| Card radius | **16 px** (`.card`) vs **12 px** (`--radius-card`, used by `.cards`, `.selected`, `.receipt-toolbar`) |
| Control radius | 8 px (`--radius-control`) |
| Notice radius | 10 px |
| Grid gap | 8–16 px in flex groups; 16 px between cards |
| Shadows | `--shadow-card: 0 1px 2px rgba(9,21,37,.06)`; modal `0 24px 48px -12px` |
| Focus ring | 4 px solid `#005FCC`, offset 2–3 px |

---

## 4. Controls (measured, 1440 px)

| Control | Size | Type | Fill | Border | Radius |
|---|---|---|---|---|---|
| Text input (`.input`) | 340 × **52 px** | 18 px | `#F3F3F4` | 1 px `#AEB8C4` | 8 px |
| Primary submit (`.btn.primary.block`) | 340 × **56 px** | 18 px / 600 | `#17324F` | none | 8 px |
| Secondary button (`.btn`) | 194 × **52 px** | 18 px / 600 | `#EEEEEE` | none | 8 px |
| Small button (`.btn.small`) | ≥ **48 px** tall | 18 px | `#EEEEEE` | none | 8 px |
| Text-size select | 154 × **48 px** | 16.875 px | `#F3F3F4` | 1 px `#AEB8C4` | 8 px |
| Guide index button | 136–175 × **48 px** | 18 px | `#EEEEEE` | none | 8 px |
| Skip link | 290 × **52 px** | 18 px / 700 | `#17324F` | none | 8 px |
| Checkbox / radio | 24 px base | — | — | — | — |

Buttons use `white-space: normal` and wrap, so long Malay labels do not clip.

---

## 5. Components

| Component | Treatment | Notes |
|---|---|---|
| Top bar | Sticky, page-coloured with blur and a 1 px shadow. **Measured height: 194 px @320, 106 px @375–600, 64 px @768–1024, 72 px @1280+** | The height varies by 3× because the brand, size selector and login link wrap onto separate rows on narrow screens. |
| Brand | 42 px crest + wordmark, links to `#/` | SVG logos for nav, web and favicon |
| Navigation | Grouped links; two dropdowns (e-Daftar, e-Resit) with click/hover/focus open states and `aria-expanded`; hamburger toggle ≤1080 px | Protected pages only |
| Card | White, 1 px `#D7DDE4`, 16 px radius, 24 px padding, subtle shadow | Login card overrides to a heavier modal-like shadow |
| Stat card group | `.cards` grid, `auto-fit minmax(170px, 1fr)`, 12 px radius, single shared surface | Dashboard only |
| Notice | 10 px radius, `#F3F3F4` fill, 16.875 px text; `.notice.ok` switches to green-soft | No left accent bar |
| Badge / tag | Pill, 4 badge colour families (done / warn / indigo / oku) | Status is always **word + symbol**, never colour alone |
| Chip filter | Toggle buttons with `aria-pressed` | Registration status filter |
| Table | 14 × 16 px cells (8 × 10 px compact), `<caption class="sr-only">`, `scope="col"` | Becomes labelled cards ≤640 px via `data-label` |
| Dialog | Native `<dialog>` + `showModal()`, 16 px radius, `88dvh` max height on mobile | Form dialog and destructive confirm dialog |
| Toast | Fixed bottom, `role="status"`, optional action button, 8 s default / 12 s for undo | The only undo mechanism in the app |
| Receipt | Separate formal document style (Times/Helvetica in PDF, own print rules) | Deliberately excluded from the design system |
| Loading | `.loading-state` with spinner + `role="status"` | Shared helper `loadingState()` |
| Load error | `.load-error` block with title, guidance, detail and retry button | Shared helper `readErrorState()` |

---

## 6. Interaction states

| State | Treatment |
|---|---|
| Hover (link) | `#64231D`, underline retained |
| Hover (button) | Background shift to `--primary-deep` / accent |
| Focus | `:focus-visible` → 4 px `#005FCC`, offset 3 px (2 px on inputs). **Verified visible and passing 3:1.** |
| Disabled | `opacity: .5`, `cursor: not-allowed` |
| Active nav | `#17324F` fill, white text, `aria-current="page"` |
| Invalid | `.error` text `#A31919`, 600 weight; **plus native browser bubbles** (see A-02) |
| Reduced motion | `@media (prefers-reduced-motion: reduce)` disables transitions/scroll animation |
| Forced colours | `@media (forced-colors: active)` block present |
| Print | `@media print` hides `.no-print`, receipt and report have dedicated print layouts |

---

## 7. Breakpoints

Declared in `style.css`, evaluated in this order:

| Query | Effect | Measured header height |
|---|---|---:|
| `max-width: 1080px` | Top bar wraps; hamburger + vertical menu | — |
| `max-width: 1020px` | Receipt layout stacks; summary unsticks; import/report stack | — |
| `max-width: 900px` | Report filters and totals reduce columns | — |
| `max-width: 640px` | Smaller page padding; tables become cards; form grids stack | 106 px (375–600) |
| `min-width: 360px and max-width: 640px` | Extra compact-label rules | — |
| — | 320 px | **194 px** |
| — | 768–1024 px | **64 px** |
| — | 1280 px+ | **72 px** |

The 194 px figure at 320 px is the tallest state and the one that breaks
in-page anchors (A-01).

---

## 8. Inconsistencies (probable defects, not stylistic choices)

| ID | Observation | Assessment |
|---|---|---|
| D-01 | Control heights 48 / 52 / 56 px coexist on the same screen (select 48, secondary button 52, primary submit 56). | Minor visual rhythm defect. Harms alignment, not comprehension. |
| D-02 | Four corner radii in use: 8 px (controls), 10 px (notice), 12 px (`--radius-card`), 16 px (`.card`, dialogs). | `--radius-card` is declared 12 px but `.card` hard-codes 16 px, so the token does not describe the primary surface. |
| D-03 | `--muted` is aliased to `--text-secondary` (`#343C46`), not `--text-muted` (`#4B5561`). | `--text-muted` is effectively unused; "muted" text renders at secondary strength. Harmless today, misleading for future work. |
| D-04 | `.notice` sets `border-color` without a border width, so no accent rule renders. | Dead declaration; cosmetic. |
| D-05 | The primary-school list is duplicated in `frontend/src/features/e-daftar/constants.js` and `worker/src/features/e-daftar/schools.js`. | Maintainability risk: a school added in one place and not the other is silently rejected by the API. |

These are P3. None justifies a redesign; they are clean-up items for whoever
next touches the stylesheet.

---

## 9. What to preserve

- The **navy + terracotta institutional palette** and its measured contrast.
- **Self-hosted variable fonts** and the type scale (18 px base is correct for
  this audience — do not "modernise" it down to 14–16 px).
- **Large controls** (48–56 px) and generous hit areas.
- **Word-plus-symbol status labels** (never colour alone).
- **Skip links, visible 4 px focus ring, three-step text-size preference** and
  their `localStorage` keys (`sperk-text-size`, `sperk-large-text` migration).
- **The formal receipt document** and its print/PDF rules, kept separate from
  application chrome.
- **Masked ICs**, uppercase student names, and the plain Malay task vocabulary.

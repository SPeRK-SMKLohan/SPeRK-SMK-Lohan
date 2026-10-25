# Before and after

Comparison of the interface audited in Phase 1 (`before/`) with the
reconstruction implemented in Phase 2 (`after/`).

**How to read the images.** `before/` holds two baselines: `before/production/`
is the live site, `before/repo/` is the repository at `6c347c7`. `after/` holds
the reconstruction. All three sets were captured the same way: headless
Chromium, device scale factor 1, CSS viewport emulation, `locale=en-US`,
`Asia/Kuching`, full page unless the filename says otherwise.

**What "after" proves.** The staff screens were rendered against a synthetic
fixture server, not the live backend — no authorised account was available. See
[after-verification.md](after-verification.md) §3 for exactly what that does and
does not establish.

---

## 1. Information hierarchy

**Before.** The home screen led with four statistic cards and then two module
links. A teacher arriving to register a child had to read numbers first and find
the way in second. The header carried two dropdown menus whose contents were
invisible until opened.

**After.** The two things staff actually come to do occupy the first screen at
full width: *Daftar murid Tingkatan 1* and *Jana resit bayaran*. Numbers sit
below them, framed as "how far through registration day are we" rather than as a
dashboard. Tools that are used rarely (Import, Barangan, Panduan) moved to a
separate list and to the footer.

| | Before | After |
|---|---|---|
| First screen | 4 stat cards, 2 links | 2 task cards |
| Navigation | 5 items, 2 of them dropdowns | 4 flat links, no dropdowns |
| Rare tools | Inside dropdowns | Home list + footer + phone menu |

Evidence: `before/repo/home-1440.png` → `after/home-1440.png`,
`after/home-320.png`.

---

## 2. Navigation and discoverability

| Aspect | Before | After |
|---|---|---|
| Desktop destinations visible without interaction | 3 of 7 | 5 of 8 (all 8 via footer) |
| Dropdown menus | 2 | 0 |
| Hover required to reveal a destination | Yes | No |
| Phone menu | Hamburger opening a nested list | Full-screen list of 64 px rows in 3 groups |
| Menu state | `aria-expanded` only | `aria-expanded` + label changes to **Tutup** + Escape + focus return |
| Current page | Colour on the top-level item | `aria-current="page"` on the exact link |

The Phase 1 audit flagged that a hover-only dropdown is hostile to users who do
not discover hover. That entire interaction class is gone.

Evidence: `before/repo/guide-375.png` (header) → `after/menu-open-375.png`.

---

## 3. Task completion flows

### Registration

**Before:** dropdown → search (disabled until a school was chosen) → six-column
table → small action button in the last column.

**After:** ten school buttons → full-width search → status filter as one
segmented control → record rows where the status action is the largest element.

| Step | Before | After |
|---|---|---|
| Choose school | `<select>` with 11 options, one visible | 10 named buttons, all visible |
| Find the child | Search field, disabled until school chosen | Search field, revealed with the list |
| Read the row | 6 columns, 15 px text | Name at 20 px, metadata at 17 px |
| Act | Small button in column 6 | Full-height button, right-aligned on desktop, full width on phones |
| Confirm | Toast, gone in 8 s | Persistent banner naming the child and time |
| Undo | Toast action, vanishes silently | Banner states the 12-second window, then says it expired |
| Reverse | Native `confirm()` | Styled dialog with the child's name |

Evidence: `before/repo/registration-1440.png`,
`after/registration-1440.png`, `after/registration-375.png`,
`after/registration-marked-375.png`.

### Receipt entry

**Before:** four sections down the page, with the summary in a sidebar that
became a block below on narrow screens. The total was only visible where the
summary was.

**After:** four sections on one page and a bar pinned to the bottom carrying the
running total, the item count and the save action. The total is never off screen,
on any device.

Evidence: `before/repo/receipt-1440.png`, `after/receipt-ready-1440.png`,
`after/receipt-ready-375.png`, `after/receipt-saved-1440.png`.

---

## 4. Readability and accessibility

| Measure | Before | After |
|---|---:|---:|
| Text contrast failures on measured screens | 0 (public pages) | **0** across 69 screens |
| Lowest measured contrast | 7.68:1 | **4.53:1** (still above 4.5:1) |
| Input boundary contrast | **1.81:1** (fails 1.4.11) | **3.4:1** (passes) |
| Body line height | 1.55 | 1.60 |
| Largest text setting | 22 px root | **24 px root** |
| Targets below 24 px | 1 (217 × 20 link) | **0** |
| Header height at 320 px | 194 px | **112 px** |
| Guide heading obscured after an index jump | **93 px hidden** | **37 px clear** |
| Validation language | English (native bubbles) | Malay, inline, persistent |
| Validation persistence | Bubble disappears on next click | Message stays until corrected |

The contrast floor moved from 7.68:1 to 4.53:1. The corporate palette uses cool
neutral surfaces rather than warm paper; every combination still passes AA, and
the floor is recorded here so it can be watched.

Evidence: `before/repo/login-validation-email-375.png` →
`after/login-validation-375.png`, `after/login-error-fields-375.png`,
`before/repo/guide-anchor-after-click-320.png` → `after/guide-320.png`.

---

## 5. Form usability

| Aspect | Before | After |
|---|---|---|
| Required state | Only the teacher name was `required` | All three fields required, stated once at the top |
| Native browser validation | Active — English bubbles | Disabled (`novalidate`); our own rules |
| Error placement | One shared line under the form | One message per field, under that field |
| Error lifetime | Until next submit | Until the field is corrected |
| Field association | Implicit | `aria-invalid` + `aria-describedby` |
| Password visibility | No control | Show / hide toggle |
| Focus on failure | Stayed on the submit button | Moves to the first invalid field |
| Helper text | Below the field, 18 px | Below the field, 17 px, with the "why" stated |

Evidence: `before/repo/login-375.png` → `after/login-375.png`,
`after/login-validation-375.png`, `after/login-error-fields-375.png`.

---

## 6. Record management

| Aspect | Before | After |
|---|---|---|
| Student list | Six-column table, horizontal scroll under 640 px | Rows: name, IC, school, transfer, status, actions |
| Row height | ~56 px | 72–96 px |
| Status | Badge with time appended | Badge plus a separate time label, so the row can wrap |
| Selection for deletion | Always-visible checkboxes in column 1 | Hidden until an administrator opens "Tetapan pentadbir" |
| Destructive action | Visible in the main toolbar | Behind a disclosure, then a password dialog |
| Receipt search | Six-column table (history page removed) | Now in Laporan: a searchable table by receipt no. or name |
| Catalogue | Table | Rows with price and quantity rule |

Moving selection and deletion out of the default view removes two controls that
a counter user never needs and can mis-tap. The capability is unchanged.

Evidence: `before/repo/registration-1440.png` →
`after/registration-1440.png`, `after/registration-select-375.png`,
`before/repo/history-1440.png` → `after/report-1440.png` (the `/sejarah` page was removed; receipts are searched from Laporan).

---

## 7. Mobile and tablet behaviour

| Width | Before | After |
|---:|---|---|
| 320 | 194 px header (28% of the screen), 1-column school list, table collapses into tall cards | 112 px header, 2-column school grid, rows with full-width actions |
| 375 | 106 px header | 112 px header, same layout |
| 430–600 | 106 px header | 112 px header |
| 768 | 64 px header | 64 px header, desktop navigation appears at 1081 px |
| 1024+ | 72 px header | 76 px header |

Horizontal overflow was 0 px in the audit and remains 0 px after the rebuild, at
every width and at 24 px root text.

The one structural change on phones is the header: rather than dropping the
text-size control or the sign-out button, it wraps to two rows and the
`--header-h` token grows to match. Nothing is hidden and nothing overlaps.

Evidence: `after/registration-320.png`, `after/home-320.png`,
`after/receipt-375.png`, `after/guide-320.png`.

---

## 8. What did not change

- The school crest, the Malay task vocabulary, and the three self-hosted fonts.
- Tingkatan 1 only; the ten-school list; 12-digit IC; masked IC everywhere.
- Server-side pricing, one `requestId` per receipt, per-year numbering.
- Permanent deletion behind password re-entry.
- Device-local teacher name.
- The formal receipt document, its print rules and the PDF output.
- Every API route, request shape and Firestore field.

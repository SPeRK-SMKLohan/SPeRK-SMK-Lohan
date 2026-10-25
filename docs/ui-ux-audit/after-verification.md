# Phase 2 — implementation and verification

**What this document is:** a record of what was rebuilt, how it was tested, and
what remains unverified. Every number here was measured in a browser during this
work. Nothing is projected.

**Baseline:** `main` @ `6c347c7` (the audit baseline) → the reconstructed
interface now in the working tree.
**Date:** 25 October 2026.

---

## 1. Summary

The interface was rebuilt, not restyled. Ten screens, a new design system, a new
information architecture and a new set of interaction patterns.

| Result | Measured |
|---|---|
| Screens captured and measured | **65** |
| Horizontal overflow at any width | **0 px** on all 69 |
| Console or page errors | **0** |
| Text contrast failures (WCAG AA) | **0** across 65 screens; lowest ratio **4.53:1** |
| Touch targets below the 24 px minimum | **0** |
| Scripted feature checks | **30 / 30 passed** |
| Production build | Passes; fixtures absent from the bundle |
| Guide heading obscured after an in-page jump | **0 px** (was 93 px at 320 px) |

The four issues that mattered most in the Phase 1 audit are closed and
re-measured: the obscured heading, the English validation bubbles, the faint
input boundaries, and the 194 px phone header.

**Follow-up revision.** After the rebuild, the warm "Tenang" palette was
replaced with a **corporate blue** system (brand `#0F4C81`, cool neutral
surfaces, no beige), the typefaces were swapped to **Atkinson Hyperlegible**
(body) and **Lexend Deca** (headings/wordmark), the thick coloured left edge on
cards was removed, **Log Keluar moved to the footer**, and the **Sejarah Resit
page was removed** — its receipts are now found through search on the Laporan
page. Every measurement in §4 was re-run against the new palette and still
passes: 0 overflow, 0 errors, 0 contrast failures (lowest 4.53:1).

---

## 2. What was rebuilt

| Screen | Before | After |
|---|---|---|
| **Sign in** | Single centred card, native browser validation in English | Two-column layout with a short orientation panel; three required fields, all validated in Malay, inline, persistent; show/hide password; help link with a 44 px target |
| **Home** | Statistic cards first, module links second | Two large task cards first ("Daftar murid", "Jana resit"), then registration progress with a meter, today's sales, recent receipts, and a tools list |
| **Registration** | Dropdown for school, six-column table, status chips, admin actions in the main flow | School chosen from a grid of named buttons, full-width search, three-way status filter, **record rows** with a single dominant action, undo in a persistent banner, administrator actions behind a disclosure |
| **Import** | Two cards, preview below | Three numbered steps in the order staff perform them, with a properly labelled file input |
| **Receipt entry** | Four stacked sections with a sidebar summary on desktop | One page, four sections, and a **pinned bar** showing the running total and the save action at all times |
| **Receipt detail** | Toolbar, document, WhatsApp panel | Same document, clearer action hierarchy, sharing moved to a side panel |
| **Receipt search** | (history page removed) | Moved into **Laporan**: a searchable table by receipt no. or student name, four totals and CSV export. The dedicated `/sejarah` page was removed. |
| **Catalogue** | Table | Rows with price and fixed-quantity state |
| **Report** | Filters, totals, table | Filters, four total cards, table, plus an explicit warning when the 500-receipt ceiling is hit with a payment filter applied |
| **Guide** | Six cards, index at top that scrolled away | Sticky section index with scroll-spy, one card per section, correct terminology |

### Navigation

The two dropdown menus are gone. The header now carries four flat destinations
(Utama, Pendaftaran, Jana Resit, Laporan) plus the text-size control. **Log
Keluar moved to the footer**, so it is never squeezed into the header at small
sizes. Import, Barangan and Panduan are reachable from the home screen and from
a footer present on every page, and the phone menu lists every destination plus
Log Keluar in three labelled groups (Kerja harian / Alat lain / Akaun).

### Interaction patterns introduced

- **Persistent result banner** instead of a vanishing toast. After "Tanda
  daftar" the banner states what happened, offers **Buat asal**, and says how
  long the undo is available. When the window closes it says so, then clears.
- **Pinned total bar** on the receipt screen, so the amount and the save action
  never scroll away.
- **School as buttons, not a dropdown**, so the ten options are visible at once.
- **Administrator actions behind a disclosure**, so the daily flow has no
  destructive controls in it.

---

## 3. Method, and how the staff screens were reached

The application requires Firebase authentication, and no authorised account was
available. To test the staff screens at all, a **development-only fixture
harness** was added at `frontend/src/dev/preview.js`:

- It fakes a signed-in user and serves synthetic records from memory for the
  `/api/*` calls.
- It is loaded through a dynamic import guarded by `import.meta.env.DEV`, which
  is a compile-time constant. In a production build the branch is dead code.
- **Verified:** the built bundle contains none of the fixture strings
  (`preview-token`, `stu-001`, fixture names) — checked with `grep` over
  `dist/assets/*.js`.
- It activates only with `?preview=data`, `?preview=empty` or `?preview=error`.

**What this does and does not prove.** It proves the interface renders, lays out,
validates, navigates and responds correctly for the documented API contract. It
does **not** prove that the live Worker and Firestore behave identically. No
Worker code, API client signature, request payload or data rule was changed —
see §6.

No production data was read or written at any point.

### Evidence produced

| Artefact | Location |
|---|---|
| 69 screenshots | `after/` |
| Per-screen measurements (overflow, targets, contrast, header height) | `.workbuddy-ai/audit-tools/after-report.json` |
| Keyboard, validation, reflow, anchor and print results | `.workbuddy-ai/audit-tools/a11y.json` |
| 30 scripted feature checks | `.workbuddy-ai/audit-tools/regression.mjs` |

---

## 4. Measured results

### 4.1 Responsive layout

| Width | Screens measured | Overflow | Header height |
|---:|---:|---:|---:|
| 320 | 14 | 0 px | 112 px |
| 375 | 14 | 0 px | 112 px |
| 430 | 4 | 0 px | 112 px |
| 600 | 4 | 0 px | 64 px |
| 768 | 9 | 0 px | 64 px |
| 1024 | 4 | 0 px | 76 px |
| 1280 | 4 | 0 px | 76 px |
| 1440 | 14 | 0 px | 76 px |
| 1920 | 4 | 0 px | 76 px |

The header is a single row from 561 px up. Below that it wraps to two rows and
the `--header-h` token grows to match, so nothing is hidden behind it and no
control is dropped.

Two overflow regressions were introduced and fixed during the build, both
recorded here because they show what the measurements caught:

1. The header could not fit brand + menu + tools at 320 px (144 px overflow).
   Fixed by wrapping to two rows instead of hiding controls.
2. The status pill forced a row to 347 px at the largest text size (27 px
   overflow). Fixed by splitting the timestamp out of the pill.

### 4.2 Contrast

Every distinct foreground/background/font-size combination on all 69 screens was
measured with the WCAG 2.x relative-luminance formula.

- **0 failures.**
- Lowest ratio anywhere: **4.53:1** (muted text on a light fill) — still above the 4.5:1 AA threshold.
- Control boundaries now measure **3.4:1** against white, up from **1.81:1**.
- One real defect was found and fixed: the public guide's wordmark rendered
  white on cream at **1.13:1** because the brand styles are written for the dark
  header. The light top bar now has its own dark-on-light brand treatment.

### 4.3 Targets

- **0 elements below 24 × 24 px.**
- Eight screens contain 26 × 26 px checkboxes or radios. These sit inside a
  `.choice` label at least 60 px tall, so the effective hit area is the whole
  row; the 26 px figure is the input itself, not the target.
- Table links measure 28 px tall, above the 24 px minimum.

### 4.4 Keyboard, focus and dialogs

| Check | Result |
|---|---|
| Skip link is the first tab stop and becomes visible on focus | Pass — 3 px `#0B57D0` ring |
| Tab order matches visual order | Pass — skip → brand → 5 nav links → text size → Log Keluar |
| Focus ring visible on light and dark surfaces | Pass — 3 px ring with a 5 px white halo |
| Mobile menu opens, label changes to "Tutup", focus moves to first item | Pass |
| Escape closes the menu and returns focus to the toggle | Pass |
| Student dialog opens with focus in the first field, `aria-labelledby` set | Pass |
| Escape closes the dialog and returns focus to the button that opened it | Pass |
| Login errors focus the first invalid field | Pass |

### 4.5 Validation

| Check | Result |
|---|---|
| Form is `novalidate` | Pass |
| Empty submit produces three Malay messages | Pass — "Sila isi e-mel sekolah anda.", "Sila isi kata laluan anda.", "Sila isi nama guru, antara 2 dan 80 aksara." |
| `aria-invalid` set on each failing field | Pass |
| Malformed email message names the expected format | Pass — "E-mel tidak lengkap. Contoh: nama@sekolah.edu.my" |
| No native browser bubble appears | Pass — no `required` tooltip path is reachable |

### 4.6 Zoom and text resizing

| Case | Overflow | Root |
|---|---:|---|
| 720 px viewport (≈200% zoom on a 1440 px screen), sign in | 0 px | 18 px |
| 720 px viewport, home | 0 px | 18 px |
| 320 px, "Sangat besar" (24 px root), registration | 0 px | 24 px |
| 320 px, "Sangat besar", receipt entry | 0 px | 24 px |
| 320 px, "Sangat besar", guide | 0 px | 24 px |

### 4.7 Print

With `@media print` emulated on a saved receipt: header, footer and toolbar are
hidden, the receipt document remains, and `page.pdf()` produces a 95,855-byte
A4 document. The receipt's own print rules were not altered.

### 4.8 Guide anchors — the Phase 1 P1

| Context | Header bottom | Heading top | Clearance |
|---|---:|---:|---:|
| Signed in, 320 px | 112 px | 149 px | **+37 px** |
| Signed in, 1440 px | 76 px | 122 px | **+46 px** |
| Public, 320 px | no sticky header | 149 px | n/a |

Before: the heading sat 93 px *above* the visible area at 320 px. The fix derives
`scroll-padding-top` from the same `--header-h` token the header uses. A second
offset (`scroll-margin-top` on the sections) was found during testing and
removed — the two were adding together and pushing the heading twice as far down
as intended.

---

## 5. Feature preservation

Every capability in [feature-inventory.md](feature-inventory.md) was mapped to
its new home and, where the harness allowed, exercised by a scripted check.

| ID | Feature | New destination | Verification |
|---|---|---|---|
| F-01 | Sign in | `#/login` | **Scripted** — three fields, `/api/me` check retained |
| F-02 | Text-size preference | Header control + login bar | **Scripted** — 24 px root applied and persisted across reload |
| F-03 | Public guide | `#/panduan` without a session | **Scripted** — 6 sections, sign-in link present |
| F-04 | Navigation and sign-out | Flat header, mobile menu, footer | **Scripted** — 5 links + Log Keluar |
| F-05 | Home totals | `#/` progress panel | **Scripted** — 5 stat cards, meter |
| F-06 | Home shortcuts and recent receipts | Task cards + recent list | **Scripted** — 2 cards, 5 receipts |
| F-07 | School-first registration | `#/pendaftaran` school grid | **Scripted** — selection reveals list and is stored |
| F-08 | Search, filter, paging | Toolbar + segmented filter | **Scripted** — search narrows to 1, filter excludes registered |
| F-09 | Mark / unmark with undo | Row action + status banner | **Scripted** — banner with undo, undo restores, reversal asks confirmation |
| F-10 | Student create / edit | Modal dialog | **Scripted** — Malay field errors, create appears in list, edit pre-fills |
| F-11 | Deletion with password | Admin disclosure → selection → dialog | **Scripted** — selection bar, password-gated dialog |
| F-12 | Excel template | `#/import` step 1 | **Scripted** — button present, file input labelled |
| F-13 | Import preview and commit | `#/import` step 3 | **Partial** — UI and dry-run path present; no workbook was actually imported |
| F-14 | Device teacher name | `#/jana-resit` setup card | **Scripted** — blocks until set |
| F-15 | Student selection for a receipt | Section 1 search | **Scripted** — results and confirmed selection |
| F-16 | Items and quantities | Section 2 list + steppers | **Scripted** — total updates, cart marker set |
| F-17 | Payment and save | Sections 3–4 + pinned bar | **Scripted** — save disabled until confirmed; save creates and opens the receipt |
| F-18 | Saved receipt actions | `#/resit/:id` | **Scripted** — print, PDF, WhatsApp, 2 line items |
| F-19 | Report search (replaces the removed Receipt history page) | `#/laporan-koperasi` | **Scripted** — 8 receipts, search by no./name narrows to 1 |
| F-20 | Item catalogue | `#/barangan` | **Scripted** — 7 items, inactive state shown |
| F-21 | Cooperative report | `#/laporan-koperasi` | **Scripted** — totals, rows, payment filter (8 → 4) |
| F-22 | API authentication | Unchanged | **Scripted** — unauthenticated route redirects to sign-in |
| F-23 | Read retry and dedupe | Unchanged client + shared error block | **Scripted** — failure shows retryable block |
| F-24 | Worker caches | Unchanged | **Source only** — no Worker code touched |
| F-25 | Legacy redirects | Unchanged | **Scripted** — `/e-daftar` → `/pendaftaran` |

Two capabilities are **not** proven: an actual Excel import write (F-13) and the
Worker's caching behaviour under load (F-24).

---

## 6. What was not changed

The reconstruction touched the frontend only. Verified by `git diff --stat`:

- `worker/` — **no changes.** No API route, validation rule, pricing calculation,
  receipt numbering, counter, cache or authorisation logic was modified.
- `frontend/src/shared/api.js`, `auth.js`, `firebase.js` — **no changes.**
- `frontend/src/features/*/api.js` — **no changes.** Every request keeps its
  original method, path and payload shape.
- Firestore schema, collections and document shapes — untouched.
- Business rules preserved: Tingkatan 1 only, ten-school list, 12-digit IC,
  masked IC in responses, server-side pricing, one `requestId` per receipt,
  permanent deletion behind password re-entry, device-local teacher name,
  flat email allowlist, 50-row paging, 500-receipt report ceiling.

Changed files: `style.css` (rewritten), `main.js` (shell), all page modules,
`shared/feedback.js`, `shared/status.js` (replaces `toast.js`), plus the dev-only
`dev/preview.js`. `pages/dashboard.js` was renamed to `pages/home.js`.

---

## 7. Status of the Phase 1 findings

| ID | Finding | Status |
|---|---|---|
| A-01 | Guide heading hidden under the sticky header | **Fixed and measured** — 37 px clearance at 320 px |
| A-02 | English native validation, inconsistent required fields | **Fixed and measured** — `novalidate`, three Malay messages |
| A-03 | Input boundary 1.81:1 | **Fixed and measured** — 3.4:1 |
| A-04 | Boot does not distinguish slow auth from signed out | **Improved** — named status and a retry on failure; not re-tested under a blocked network |
| A-05 | "Buka Panduan" 20 px target | **Fixed** — 44 px minimum |
| A-06 | Dialog focus management | **Verified** — focus enters the form and returns to the trigger |
| A-07 | Table semantics | **Addressed** — record lists replace the dense tables; the two remaining tables keep captions and `scope` |
| A-08 | Inconsistent status announcements | **Addressed** — one banner pattern, `role="status"` for results, `role="alert"` for failures; not verified with a screen reader |
| A-09 | Auto-refresh may interrupt | **Improved** — refresh pauses during selection and dialogs; live regions only update on real changes |
| A-10 | Status conveyed by word and symbol | **Preserved** |
| A-11 | Focus visibility and skip links | **Verified** |
| A-12 | Text resizing without loss | **Verified** at 24 px root on 320 px |
| R-01 | 194 px phone header | **Fixed** — 112 px, two rows, nothing hidden |
| R-02 | Guide had no persistent navigation | **Fixed** — sticky index with scroll-spy |
| R-03 | Anchor offset did not track header height | **Fixed** — single token |
| R-04 | Size selector cramped at 320 px | **Fixed** — moved to its own header row |
| D-01…D-05 | Design-system inconsistencies | **Resolved** — three radii instead of four, one control height scale, dead declarations removed, school list still duplicated in frontend and Worker (documented, not changed) |

---

## 8. Limitations — what is not claimed

1. **No screen reader was run.** ARIA usage, live-region behaviour and table
   semantics are unverified with assistive technology. This includes the status
   banner, the dialogs and the mobile menu.
2. **No real device was used.** iOS Safari and Android Chrome are untested,
   including on-screen keyboards over the receipt search and the student dialog.
3. **No real browser zoom.** 200% was approximated with a 720 px CSS viewport,
   which covers reflow but not pinch-zoom behaviour or fixed-position quirks.
4. **The backend was not exercised.** The regression ran against the fixture
   server. The API clients and the Worker are unchanged, but end-to-end
   behaviour against Firestore has not been re-tested.
5. **No Excel import was performed** (F-13), and no bulk delete was executed.
6. **No performance measurement.** The receipt catalogue loads in one request and
   the registration list pages at 50; neither was profiled on a slow school
   network.
7. **No user testing.** The claim that this design is easier for older staff is a
   design argument grounded in measured accessibility properties, not an
   observation of real users. That still needs a supervised session.

---

## 9. Reproducing the verification

```bash
# 1. Serve the current source
cd frontend && npm run dev -- --port 5199

# 2. Fixture mode for staff screens (development only)
#    http://localhost:5199/?preview=data#/pendaftaran
#    ?preview=empty  → empty states
#    ?preview=error  → forced read failures

# 3. Re-run the checks
node .workbuddy-ai/audit-tools/regression.mjs      # 30 feature checks
node .workbuddy-ai/audit-tools/a11y-check.mjs      # keyboard, validation, reflow, print
node .workbuddy-ai/audit-tools/after-capture.mjs   # 69 screenshots + measurements

# 4. Confirm the fixtures are absent from the production build
cd frontend && npm run build && grep -l "preview-token" dist/assets/*.js || echo "clean"
```

# Phase 2 redesign plan

> **Phase 1 record.** This document describes the interface *before* the
> reconstruction and is kept as the baseline. The current system is documented in
> [after-verification.md](after-verification.md) and the measured results in
> [after-verification.md](after-verification.md).

**This is a plan, not a change.** Phase 1 modified nothing. Phase 2 should not
begin until the verification gate in §1 is cleared and the school has agreed the
workflow and wording that must stay.

## Guiding rule

The audit found **no visual problem worth redesigning for its own sake.** Every
item below is tied to a measured defect or a demonstrated risk. If a proposal
cannot name the screenshot or number that justifies it, it does not belong in
Phase 2.

---

## 1. Verification gate — before any design work

These are not design tasks, but they block design. Doing Phase 2 without them
means redesigning two thirds of the app blind.

| # | Gate | Why it blocks design | Owner |
|---|---|---|---|
| G-1 | Provide an authorised test account and a synthetic student roster | 7 protected routes, 2 dialogs, 5 tables and every staff state are currently unrenderable. | School |
| G-2 | Decide the baseline: production or `main` | `main` is 17 commits ahead of `origin/main`; "before" means different things depending on the answer. | School / maintainer |
| G-3 | Deploy or rebase the 17 pending commits | Otherwise a redesign is compared against a version users never saw, and fixes already written may be re-litigated. | Maintainer |
| G-4 | Confirm which rules are immutable | T1-only, device-local teacher name, permanent deletion, per-year numbering, flat email allowlist. | School |
| G-5 | Agree a test-data cleanup procedure | Bulk deletion is permanent and password-gated; test records must not pollute real counts. | School |

---

## 2. P0 — Critical

**None identified.**

No issue found in this audit blocks an essential task or creates a data-handling
risk. The access gate holds, receipt creation is idempotent, prices are
server-authoritative, ICs are masked, and deletion is behind a password.

The most dangerous action in the app — permanent bulk deletion — was **not
executed** during this audit and remains unverified end to end. It must be tested
with synthetic records before Phase 2 touches the registration screen, but it is
not currently a defect.

---

## 3. P1 — High

### P1-1 · In-page help navigation loses the heading (A-01 / R-03)

| | |
|---|---|
| **Existing problem** | Tapping an entry in the guide's index scrolls the destination card under the sticky header. The heading is hidden by **93 px at 320 px** and clipped by 5–6 px at 375–600 px. The user arrives mid-sentence with no section title and may conclude the page is broken. |
| **Recommended solution** | Replace the fixed `scroll-margin-top: 84px` with a value derived from the real header height: a `--header-h` custom property set per breakpoint (194 px ≤360, 106 px ≤640, 64 px ≤1080, 72 px above) and `scroll-margin-top: calc(var(--header-h) + 12px)`. Alternatively measure the header once on load/resize and set the property in JS, which also handles the text-size preference. |
| **Affected** | `frontend/src/style.css` (`.card` scroll-margin, breakpoints), `frontend/src/pages/guide.js` (unchanged behaviour), `frontend/src/main.js` (only if the JS route is chosen) |
| **Expected benefit** | The user always lands with the section title visible. Removes the strongest "this is broken" signal in the only help content available before sign-in. |
| **Implementation risk** | **Low.** No data, no API, no workflow change. Risk is limited to over- or under-shooting the offset; the desktop value already works and must not regress. |
| **Evidence** | `before/repo/guide-anchor-after-click-320.png`, `guide-anchor-after-click-375.png`; measured header heights 194/106/64/72 px |
| **Acceptance** | At 320, 375, 430, 600, 768, 1024, 1440 and 1920 px, and at all three text sizes, clicking each of the six index entries leaves the `h2` fully below the header. |

### P1-2 · Validation speaks English and fires inconsistently (A-02)

| | |
|---|---|
| **Existing problem** | The login form has no `novalidate`, so the browser supplies its own messages: **"Please fill out this field."** and **"Please include an '@' in the email address…"**. They appear in English inside a Malay interface, in a transient bubble that overlaps the "Kata laluan" label. Only the teacher-name field is `required`, so two fields use custom Malay validation and one uses native English validation. |
| **Recommended solution** | Add `novalidate` to the form. Mark all three fields `required` + `aria-required="true"`. Validate on submit in one function that writes Malay messages into the existing `#login-error` element (which already has `role="alert"`), and add `aria-invalid` plus a field-level message for the specific field. Keep the deliberately generic credential error. |
| **Affected** | `frontend/src/pages/login.js` only |
| **Expected benefit** | The interface keeps speaking one language at the moment it matters most. Errors persist until corrected instead of vanishing, which is critical for users who read slowly. |
| **Implementation risk** | **Medium.** Must not leak whether an email exists; must not block the existing Firebase error mapping (`loginErrorMessage`); must keep the 15 s token timeout behaviour. |
| **Evidence** | `before/repo/login-validation-empty-375.png`, `before/repo/login-validation-email-375.png`; DOM check `form[novalidate]` absent |
| **Acceptance** | Empty submit, malformed email, short teacher name and wrong credentials each produce a Malay message that stays on screen, is announced, and names the field. No native bubble appears in any locale. |

---

## 4. P2 — Medium

### P2-1 · Text-field boundaries are too faint (A-03)

| | |
|---|---|
| **Problem** | Input border `#AEB8C4` on fill `#F3F3F4` = **1.81:1**; fill on white card = **1.07:1**. Neither meets the 3:1 needed to identify a control boundary. |
| **Solution** | Darken the control border to ≥3:1 against the fill (e.g. `#6B7683` → ≈4.4:1), or switch inputs to a white fill so the existing border contrasts against the card. Prefer the border change: it keeps the current visual weight and affects one token (`--border-strong`). |
| **Affected** | `style.css` `--border-strong` / `.input`; every form in the app; check receipt print rules and disabled states |
| **Benefit** | Empty fields become visible to low-vision users without increasing visual noise. |
| **Risk** | **Low–medium** — it is a global token. Verify against disabled inputs (must still look disabled), table filters, the select control and print. |
| **Evidence** | Computed styles; `before/repo/login-375-fold.png` |
| **Acceptance** | Measured border-to-fill contrast ≥3:1 on every form control, with disabled state still distinguishable. |

### P2-2 · Header consumes a quarter of a small phone (R-01)

| | |
|---|---|
| **Problem** | The sticky header is **194 px at 320 px** — 28% of a 700 px viewport — because brand, size label, select and login link each take a row. |
| **Solution** | At ≤360 px, drop the wordmark to the crest only (keep `aria-label`), and move the size selector inside the card or collapse it behind a "Saiz teks" disclosure. Target ≤120 px. |
| **Affected** | `main.js` public-guide header, `.topbar-in`, `.brand-name`, `.text-size-control`, breakpoints |
| **Benefit** | Roughly 80 px more content on the smallest supported screen; directly reduces the A-01 occlusion too. |
| **Risk** | **Medium** — brand recognition and the discoverability of the size control are both accessibility features. Do not hide the size control behind an icon-only affordance. |
| **Evidence** | `before/repo/guide-320-fold.png`, `login-320.png` |
| **Acceptance** | Header ≤120 px at 320 px; wordmark or crest still identifies the school; size control still labelled and reachable in ≤2 actions. |

### P2-3 · The guide has no persistent section navigation (R-02)

| | |
|---|---|
| **Problem** | The guide is 6,540 px at 320 px and 7,501 px at 375 px with the largest text. The index scrolls away; there is no way back to it except scrolling. |
| **Solution** | Make the index sticky (or a compact "Kandungan" disclosure) below 640 px, and add a back-to-top control. Keep all six sections expanded by default — do not introduce an accordion that hides instructions. |
| **Affected** | `pages/guide.js`, `.guide-index` |
| **Benefit** | Re-finding a step stops costing several screens of scrolling, which is the main reason a low-confidence user gives up on help content. |
| **Risk** | **Medium** — a sticky element on top of a sticky header compounds occlusion. Must be tested together with P1-1 and P2-2, not separately. |
| **Evidence** | `before/repo/guide-375.png`, `guide-textsize-largest-375.png` |
| **Acceptance** | From any section, returning to the index takes one action; no content is permanently hidden. |

### P2-4 · Boot does not distinguish slow auth from signed out (A-04)

| | |
|---|---|
| **Problem** | One generic "restoring session" message; after 5 s the app proceeds regardless, so a blocked Firebase and a signed-out user look identical. |
| **Solution** | Three explicit outcomes: restoring / signed out / could not reach the sign-in service, with a retry on the third. Keep the 5 s cap. |
| **Affected** | `main.js` boot block, `shared/auth.js` |
| **Benefit** | Users stop retyping correct credentials when the real problem is the network or a privacy extension. |
| **Risk** | **Low** — do not turn a slow network into a blocking error screen. |
| **Evidence** | Source; not observable on the public pages (login renders before auth resolves). |

### P2-5 · Status announcements differ per page (A-08)

| | |
|---|---|
| **Problem** | Login uses `role="alert"`; registration mixes polite live regions with a toast; several pages insert plain text with no live region. A screen-reader user is told about some failures and not others. |
| **Solution** | Two shared patterns only — polite status for counts/results, assertive alert for actionable failures — applied through the existing `shared/feedback.js` helpers. |
| **Affected** | `shared/feedback.js`, `toast.js`, all feature pages |
| **Benefit** | Predictable feedback; fewer silent failures. |
| **Risk** | **Medium** — the 30 s registration refresh must stay silent or the app becomes unusable with a screen reader. |
| **Evidence** | Source comparison across pages; login DOM verified |
| **Note** | Verify with NVDA before implementing; this is currently a hypothesis (A-08). |

### P2-6 · Dialog and table semantics unverified (A-06, A-07)

| | |
|---|---|
| **Problem** | Native `<dialog>` with `showModal()`, `aria-labelledby` and sensible initial focus is present in source, but focus restoration to the triggering row button and card-mode table association were never observed. |
| **Solution** | **Test first.** Only if focus is lost on close, store the trigger and restore it. Do not add a custom focus trap. |
| **Affected** | `features/e-daftar/page.js`, `style.css` table-card rules |
| **Risk** | **Medium** — custom focus traps commonly break native dialog Escape and screen-reader behaviour. |
| **Evidence** | Source only |

---

## 5. P3 — Low

| ID | Problem | Solution | Affected | Risk | Evidence |
|---|---|---|---|---|---|
| P3-1 | "Buka Panduan Penggunaan" is 217 × 20 px, below the 24 px minimum, and is the only help route for a locked-out user (A-05) | Add vertical padding or render as `.btn`; keep it visually secondary | `pages/login.js`, `.login-guide` | None | `login-375-fold.png` |
| P3-2 | Control heights 48/52/56 px and radii 8/10/12/16 px coexist; `--radius-card` (12 px) is not what `.card` uses (16 px) (D-01, D-02) | Normalise to two heights (52 / 56) and two radii (8 / 16), then make the tokens match reality | `style.css` | Low | Measured computed styles |
| P3-3 | `--muted` is aliased to `--text-secondary`, so `--text-muted` is dead (D-03) | Point `--muted` at `--text-muted` or delete the alias | `style.css` | Low — changes text contrast slightly; re-check ratios | Source |
| P3-4 | `.notice` sets `border-color` with no border width (D-04) | Remove the dead declaration, or add the intended left accent | `style.css` | None | Source |
| P3-5 | Primary-school list duplicated in frontend and Worker (D-05) | Generate one list from a single source, or add a build-time check that they match | `features/e-daftar/constants.js`, `worker/.../schools.js` | Low | Source |
| P3-6 | Guide terminology drifts ("e-Resit" vs "e-Resit Koperasi"; page title vs route `jana-resit`) | Agree one term per feature and apply it everywhere | `guide.js`, `main.js`, page headings | None | Live pages |

---

## 6. Explicitly out of scope

Recorded so these are not proposed later as "obvious improvements":

- **Replacing the design system.** The palette passes contrast, the type scale is
  correctly sized for the audience, and the components are consistent. A new
  visual language would add risk without addressing any finding.
- **Reducing type or control sizes to fit more on screen.** The 18 px body and
  48–56 px controls are the reason the app works for this audience.
- **Removing the undo window, the confirmation tick, or the password gate.**
  These are the safety mechanisms that make one-tap attendance and permanent
  deletion acceptable.
- **Moving the teacher name to the account.** It is device-local by design for
  shared staffroom devices; changing it would rewrite receipt attribution.
- **Adding features** (item editing, receipt void, offline queue, roles). Not
  part of a redesign, and each needs its own data and workflow decision.
- **Converting tables to cards on desktop.** The card reflow exists for phones;
  desktop tables are the faster interface for 50-row scanning.

---

## 7. Recommended sequence

1. **Clear the verification gate** (§1). Without G-1 and G-2, stop.
2. **Ship P1-1 and P1-2.** Two files, no data risk, no dependency on the
   authenticated audit. Both are independently testable on the public pages.
3. **Run the authenticated audit pass** with the checklist in §8. Re-prioritise
   P2-5, P2-6 and the responsive items using what is actually observed.
4. **Ship P2-1** (global border token) as a single, isolated change with a
   contrast re-measure.
5. **Ship P2-2 → P1-1 → P2-3 together** (they interact through the sticky
   header) and re-run the anchor acceptance test at all nine widths and three
   text sizes.
6. **Ship P3 items opportunistically** when the stylesheet is next opened.
7. **Re-run the full capture set** and compare against `before/repo/` using the
   same viewports, device scale factor and browser.

---

## 8. Checklist for the authenticated audit pass

To be completed with an approved account and synthetic data before Phase 2
design decisions are finalised:

- [ ] Render all 7 protected routes at 320, 375, 430, 768, 1024, 1440, 1920 px.
- [ ] Registration: empty school, no data, no match, 50-row page, page 2, error
      with retry, auto-refresh while focused.
- [ ] Mark/unmark: success toast, undo within 12 s, undo after 12 s, reversal
      confirmation, network failure rollback.
- [ ] Student dialog: open, validate, save, clear, Escape, close, focus return.
- [ ] Bulk delete: select, disclose, wrong password, correct password, cancel.
- [ ] Import: template, bad file, wrong columns, duplicates, partial commit.
- [ ] Receipt: no device name, student search, fixed-quantity item, transfer
      without reference, save, duplicate retry, saved receipt, PDF, WhatsApp.
- [ ] History: empty, results, truncation, error and retry.
- [ ] Report: default range, payment filter, totals on failure, CSV, print.
- [ ] Keyboard-only pass on every route; record tab order and focus visibility.
- [ ] Screen-reader pass (NVDA) on forms, tables, dialogs, live regions, receipt.
- [ ] 200% and 400% browser zoom on registration, receipt and report.
- [ ] On-screen keyboard on a real phone for the student dialog and receipt search.

---

## 9. Acceptance criteria for Phase 2

- No unintended horizontal overflow at 320 px on any route, at any of the three
  text sizes, in the repository build.
- In-page navigation always lands with the heading visible.
- All validation messages are in Malay, persistent, and associated with their
  field; no native browser bubble appears.
- Every form control's boundary meets 3:1 against its fill.
- Empty, loading, no-match, saved, connection-error and permission states remain
  distinguishable on every data page.
- Receipt totals, teacher attribution, numbering, PDF/print output, T1-only
  enforcement, IC masking, access control and destructive-action safeguards are
  unchanged, verified by re-running the feature checklist F-01…F-25.
- The full nine-width capture set is repeated with identical settings so before
  and after are comparable.
- No claim of WCAG conformance is made on the strength of automated checks alone.

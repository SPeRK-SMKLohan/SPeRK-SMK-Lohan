# Accessibility audit (WCAG 2.2 Level AA reference)

> **Phase 1 record.** This document describes the interface *before* the
> reconstruction and is kept as the baseline. The current system is documented in
> [after-verification.md](after-verification.md) and the measured results in
> [after-verification.md](after-verification.md).

This is a **measured, source-and-browser audit — not a conformance certification**.
Every finding below is marked **Verified** (reproduced in a real browser or read
from live DOM) or **Hypothesis** (inferred from source, not yet observed in a
session). No screen reader was used. No authenticated page was rendered.

**Scope covered by verification:** `#/login` and `#/panduan` on the live site and
the repository build, at nine widths, plus focus, validation, skip-link and
text-size states.
**Scope not covered:** every protected route (dashboard, registration, import,
receipt entry, history, catalogue, report), both dialogs, all tables, toasts,
undo, and all loading/empty/error states.

---

## 1. Issue register

### A-01 — In-page guide links hide the destination heading · **P1** · Verified

| | |
|---|---|
| **Page** | Public guide `#/panduan`, index buttons (`.guide-index button[data-guide-target]`) |
| **Description** | Tapping an index entry calls `scrollIntoView({block:"start"})`. The sticky header then covers the top of the destination card. Measured: at 320 px the **heading is hidden by 93 px** and the section by 110 px; at 375–600 px the heading is clipped by 5–6 px. The user lands mid-sentence with no visible section title. |
| **Evidence** | `before/repo/guide-anchor-after-click-320.png` (heading entirely absent from view), `guide-anchor-after-click-375.png`; measured `scroll-margin-top: 84px` vs header 194/106/64/72 px |
| **WCAG** | 2.4.11 Focus Not Obscured (Minimum); 2.4.3 Focus Order (context); 3.2.3 Consistent Navigation (orientation) |
| **Fix** | Drive `scroll-margin-top` from the real header height per breakpoint, or measure the header once and set a CSS variable on resize. |
| **Regression risk** | Low. The desktop value (84 px against a 64 px header) already works; the change must not reduce that clearance. Do not hard-code a new single value — the header height varies with text-size preference too. |

### A-02 — Validation messages appear in English, and only one field triggers them · **P1** · Verified

| | |
|---|---|
| **Page** | Login `#/login` |
| **Description** | The form has no `novalidate`, so native browser validation runs. An empty submit produces the native bubble **"Please fill out this field."**; a malformed email produces **"Please include an '@' in the email address. 'not-an-email' is missing an '@'."** — English text in a Malay interface, in a transient bubble that overlaps the "Kata laluan" label. Only `#staff-name` carries `required`, so the trigger is inconsistent: native validation for one field, the custom Malay message for the others. The bubble disappears on the next interaction and is not associated with the field. |
| **Evidence** | `before/repo/login-validation-empty-375.png`, `before/repo/login-validation-email-375.png`; DOM: `form[novalidate]` absent, `#email.required = false`, `#staff-name.required = true` |
| **WCAG** | 3.3.1 Error Identification; 3.3.3 Error Suggestion; 3.3.2 Labels or Instructions; 3.1.1 Language of Page (the page declares `lang="ms"` but speaks English here) |
| **Fix** | Add `novalidate` to the form, mark all three fields `required` with `aria-required`, validate in one place, and write each message in Malay into a persistent inline element with `role="alert"` that stays until corrected. Keep the deliberately generic credential error. |
| **Regression risk** | Medium. The existing Malay messages are good; preserve their wording and their intentional non-disclosure of whether an email exists. Do not add per-field "account not found" hints. |

### A-03 — Text-field boundaries are too faint to perceive · **P2** · Verified

| | |
|---|---|
| **Page** | Login `#/login`; the same `.input` class is used on every form in the app |
| **Description** | Input border `#AEB8C4` against the input fill `#F3F3F4` is **1.81:1**; the fill against the white card is **1.07:1**. Neither reaches the 3:1 required to identify a control's boundary. For a low-vision or elderly user, an empty field reads as a slightly grey rectangle with almost no edge. The visible label above each field mitigates but does not remove this. |
| **Evidence** | Computed styles (`border: 1px solid #AEB8C4`, `background: #F3F3F4` on a white card); contrast computed per WCAG 2.x formula |
| **WCAG** | 1.4.11 Non-text Contrast; 1.4.3 Contrast (Minimum) for the label-to-field association |
| **Fix** | Darken the control border to at least 3:1 against the fill (e.g. `#6B7683` against `#F3F3F4` ≈ 4.4:1) while keeping the subtle institutional look; or give inputs a white fill with the current border, which raises border-vs-card contrast instead. |
| **Regression risk** | Low–medium. The darker border affects every form, table filter and select in the app; verify against the receipt print styles and disabled states, where the border must remain distinguishable from an enabled field. |

### A-04 — Boot state does not distinguish slow auth from signed-out · **P2** · Verified (source + timing)

| | |
|---|---|
| **Page** | App shell, all routes |
| **Description** | `main.js` renders a single generic status ("Menyambung ke SPeRK dan memulihkan sesi…"). `initAuth()` resolves after **5 s** whether or not Firebase reported an auth state, so a slow network and a signed-out user reach the same next state with no explanation. If Firebase is blocked (e.g. by a privacy extension), the user sees the login screen with no hint that the check was inconclusive. The status text has `role="status"`/`aria-live="polite"`, which is correct, but it is replaced by a route change rather than by an outcome. |
| **Evidence** | `frontend/src/main.js` boot block; `frontend/src/shared/auth.js` `initAuth()` timeout |
| **WCAG** | 4.1.3 Status Messages; 2.2.1 Timing Adjustable (contextual) |
| **Fix** | Give the three outcomes distinct text — restoring / signed out / could not reach the sign-in service — and offer a retry on the third. Keep the 5 s cap. |
| **Regression risk** | Low. Must not turn a working sign-in into a blocking error screen when the network is merely slow. |

### A-05 — "Buka Panduan Penggunaan" is below the minimum target height · **P3** · Verified

| | |
|---|---|
| **Page** | Login `#/login`, below the submit button |
| **Description** | The link measures **217 × 20 px**. WCAG 2.2 requires 24 × 24 px unless the target is inline within a sentence; this one is a standalone paragraph link, so the exception does not apply. It is also the only route to help for a user who cannot sign in. |
| **Evidence** | Measured bounding box; `before/repo/login-375-fold.png` |
| **WCAG** | 2.5.8 Target Size (Minimum) |
| **Fix** | Give it vertical padding (or render it as `.btn`) so the hit area is ≥44 px tall, consistent with every other control in the app. |
| **Regression risk** | None to data; must not visually compete with the primary "Log Masuk" button. |

### A-06 — Dialog focus management is unverified · **P2** · Hypothesis

| | |
|---|---|
| **Component** | `#form-dialog` (student create/edit) and `#bulk-delete-dialog` in `features/e-daftar/page.js` |
| **Description** | Both use native `<dialog>` + `showModal()`, which gives correct focus containment and Escape behaviour in modern browsers. Both have `aria-labelledby` pointing at their `<h2>`. However: `openForm()` calls `.focus()` on the first field immediately after `showModal()`, and the dialog's `close` event calls `resetForm()`, which resets fields while the dialog is animating out. Whether focus returns to the triggering row button — rather than to `<body>` — was not observed. The bulk-delete dialog focuses the password field, which is good. |
| **Evidence** | Source only; no authenticated session |
| **WCAG** | 2.4.3 Focus Order; 2.4.11 Focus Not Obscured; 4.1.2 Name, Role, Value |
| **Fix (after verification)** | Test open → tab cycle → Escape → close, on desktop and phone. If focus is lost, store the trigger element and restore it on `close`. |
| **Regression risk** | Medium — do not layer a custom focus trap on top of native `<dialog>`; that commonly breaks Escape and screen-reader virtual cursor behaviour. |

### A-07 — Table semantics on staff pages are unverified · **P2** · Hypothesis

| | |
|---|---|
| **Component** | Registration list, receipt history, item catalogue, import preview, cooperative report |
| **Description** | Source shows `<caption class="sr-only">` and `scope="col"` on header cells, and `data-label` attributes used when tables reflow into cards at ≤640 px. This is a sound pattern. It is unverified whether the card transformation preserves row/column association for a screen reader, and whether `aria-label` on row checkboxes (e.g. "Pilih {name}") remains unique when two students share a name. |
| **Evidence** | `features/e-daftar/page.js`, `features/e-resit/*.js` |
| **WCAG** | 1.3.1 Info and Relationships |
| **Fix (after verification)** | Confirm caption/scope in the accessibility tree; if duplicate names occur, disambiguate checkbox labels with the masked IC. |
| **Regression risk** | Low, but the mobile card CSS must not be changed without re-testing association. |

### A-08 — Status announcements are inconsistent across pages · **P2** · Hypothesis

| | |
|---|---|
| **Component** | All data pages |
| **Description** | The login error has `role="alert"` + `aria-live="assertive"` (verified). Registration uses `aria-live="polite"` for counts and `role="alert"` for errors, plus a toast with `role="status"`. Other pages insert plain text with no live region. A user of a screen reader will therefore be told about some failures and not others. Note also that `role="alert"` already implies assertive, so adding `aria-live="assertive"` is redundant (harmless, but worth tidying). |
| **Evidence** | Source across `pages/` and `features/`; live DOM for login |
| **WCAG** | 4.1.3 Status Messages |
| **Fix (after verification)** | Standardise on two shared patterns — polite status for results and counts, assertive alert for failures that need action — and apply them everywhere a read or write can fail. |
| **Regression risk** | Medium: over-announcing during the 30 s auto-refresh would make the app unusable with a screen reader. Registration's refresh must stay silent. |

### A-09 — Registration auto-refresh may interrupt assistive users · **P2** · Hypothesis

| | |
|---|---|
| **Component** | `#/pendaftaran`, 30 s jittered refresh |
| **Description** | `scheduleAutoRefresh` reloads the list every 30 s when the tab is visible and no dialog is open. The count line and school summary are `aria-live="polite"`, so each refresh can re-announce counts. Whether this actually fires during keyboard navigation, and how noisy it is, was not observed. |
| **Evidence** | `features/e-daftar/page.js` (`scheduleAutoRefresh`, `load({silent:true})`) |
| **WCAG** | 4.1.3; 2.2.2 Pause, Stop, Hide (contextual) |
| **Fix (after verification)** | Only update live regions when the value actually changes, and never while focus is inside the table. |
| **Regression risk** | Low; the refresh is a deliberate design for 30–40 concurrent devices and must not be removed. |

### A-10 — Status is conveyed by word plus symbol (positive, verified) · **No action**

| | |
|---|---|
| **Description** | Registration status renders as `✓ Sudah daftar` / `○ Belum daftar`, and payment method as a text badge. Colour is never the sole carrier of meaning. |
| **Evidence** | `features/e-daftar/page.js` `rowHtml()`; `features/e-resit/constants.js` |
| **WCAG** | 1.4.1 Use of Color — satisfied |

### A-11 — Focus visibility, skip links and tab order (positive, verified) · **No action**

| | |
|---|---|
| **Description** | `:focus-visible` renders a **4 px `#005FCC` ring** (5.98:1 against the card). The skip link is the first tab stop, measures 290 × 52 px and becomes visible on first Tab. Tab order on the login page is `email → password → staff-name → submit → guide link`, matching visual order. |
| **Evidence** | `before/repo/login-skip-link-focus-375.png`, `login-email-focus-375.png`, `login-password-focus-375.png`; measured tab order |
| **WCAG** | 2.4.7 Focus Visible; 2.4.1 Bypass Blocks; 2.4.3 Focus Order |

### A-12 — Text resizing works without loss (positive, verified) · **No action**

| | |
|---|---|
| **Description** | The three-step size control scales the root to 18 / 20 / 22 px. At 320 px with the largest setting the page still has **0 px horizontal overflow** and all controls remain reachable. No text was found below 14 px on the public pages. |
| **Evidence** | `before/repo/login-textsize-largest-320.png`, `guide-textsize-largest-375.png`; measured root 22 px, overflow 0 |
| **WCAG** | 1.4.4 Resize Text; 1.4.10 Reflow |

---

## 2. Summary by severity

| Severity | Count | Items |
|---|---:|---|
| P0 | 0 | — |
| P1 | 2 | A-01, A-02 |
| P2 | 6 | A-03, A-04, A-06, A-07, A-08, A-09 |
| P3 | 1 | A-05 |
| Positive (no action) | 3 | A-10, A-11, A-12 |

No P0 issue was found. The two P1 issues are both **localised and cheap to fix**:
one CSS custom property, and one `novalidate` plus a validation function.

---

## 3. Cognitive and plain-language review

Assessed by reading all interface copy on the public pages and every string in
the source.

**Strengths**

- Navigation uses plain task nouns in Malay (`Pendaftaran`, `Jana Resit`,
  `Sejarah Resit`, `Laporan Koperasi`) with no abbreviations.
- Instructions are written as numbered steps with the action verb first.
- The receipt flow is numbered 1–4 and states progress in words
  ("Langkah 2 daripada 4: pilih barangan yang dibeli.").
- Destructive actions are separated behind a "Tindakan pentadbir" disclosure and
  a password re-entry.
- Error copy is specific where it exists ("No. IC mesti 12 digit.").

**Weaknesses**

- **A-02** is the significant one: at the moment of failure the interface stops
  speaking Malay.
- The login page asks for a third field — "Nama guru" — without explaining *why*
  until a helper line below it. A first-time user may think it is another
  credential. The helper text is good but sits after the field.
- The guide's index gives no indication of length or where the user is within
  it; combined with A-01, a user who taps a section may believe the page broke.
- Terminology is mostly consistent, but the guide says "e-Resit Koperasi" in one
  place and the navigation says "e-Resit"; the page heading says "e-Resit
  Koperasi" while the route is `jana-resit`. Minor, but this audience notices.

---

## 4. What would be needed to claim WCAG 2.2 AA status

Do not state or imply conformance until all of the following are done:

1. Authorised session; render every protected route with synthetic data.
2. Manual keyboard-only pass on all routes, including dropdowns, dialogs,
   Escape, focus restoration and the undo toast.
3. Screen-reader pass (NVDA on Windows, VoiceOver on iOS) covering forms,
   tables, live regions, dialogs and the receipt.
4. Rendered-state contrast audit including disabled controls, hover, focus,
   badges, chart-free tables, and all three text sizes.
5. Real 200% and 400% browser zoom, and 320 px reflow, on every route.
6. Real devices with on-screen keyboards, including dialog input visibility.
7. Re-test of every fixed issue, with the browser and assistive-technology
   versions recorded.

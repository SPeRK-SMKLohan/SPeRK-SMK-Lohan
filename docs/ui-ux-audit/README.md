# SPeRK UI/UX Audit — Phase 1

**System:** SPeRK (Sistem Pengurusan Pelajar dan Resit Koperasi), SMK Lohan, Ranau, Sabah
**Audit date:** 25 October 2026
**Auditor scope:** UI/UX, WCAG 2.2 AA, responsive behaviour, frontend architecture
**Phase 1 status:** Read-only inspection. No application source, style, data,
dependency or deployment setting was changed during that phase.

> **Phase 2 is now implemented.** The interface described in this document has
> been reconstructed — new design system, new navigation, rebuilt screens. The
> audit below remains the "before" record and is unchanged. For the current state
> see **[after-verification.md](after-verification.md)**,
> **[design-system-v2.md](design-system-v2.md)** and
> **[before-after-comparison.md](before-after-comparison.md)**.

---

## 1. Executive summary

SPeRK is a small, focused school application with two jobs: registering
Tingkatan 1 students on registration day, and issuing cooperative receipts.
The interface is entirely in Malay, built for staff who work at speed on shared
devices, often on phones, and who may have limited digital confidence.

The application is in **better shape than a typical school system of this size**.
The measured fundamentals are strong:

- **No horizontal overflow at any of the nine tested widths** (320–1920 px), on
  both the live site and the current repository build. `scrollWidth` equals
  `clientWidth` in all 36 measured page/viewport combinations.
- **All sampled text passes WCAG AA contrast.** The lowest ratio found on a
  public page is 7.68:1, well above the 4.5:1 requirement.
- **Touch targets are consistently large.** Every interactive element on the
  public pages is at least 44 px tall except one inline text link.
- **Focus is visible and keyboard access works.** A 4 px `#005FCC` focus ring,
  a working skip link, and a sane tab order were verified in a real browser.
- **Text scaling reflows correctly.** At the largest of the three text sizes
  (22 px root) on a 320 px phone, the page still does not overflow.
- **The access gate is sound.** All seven protected routes redirect to
  `#/login` when unauthenticated; no data or navigation shell leaks.

The real problems are **not visual**. They are three specific, measurable
interaction defects that matter disproportionately for the intended audience:

1. **In-page help navigation loses the heading.** Tapping a section in the
   guide's index scrolls the heading underneath the sticky header — by **93 px
   on a 320 px phone**, so the user lands mid-sentence with no section title.
   Root cause: a hard-coded `scroll-margin-top: 84px` against a header that is
   64–194 px tall depending on width.
2. **Validation speaks English.** The login form relies on native browser
   validation, so an empty submit produces *"Please fill out this field."* and a
   malformed email produces *"Please include an '@' in the email address."* —
   in the middle of a Malay interface, in a floating bubble that covers the next
   field label and then disappears.
3. **Input boundaries are faint.** The input border is **1.81:1** against its own
   fill and the fill is **1.07:1** against the card, so the shape of a text field
   is barely perceivable for low-vision users — the exact group this system is
   meant to serve.

Two further caveats shape this audit. First, **the live site is behind the
repository**: `main` is 17 commits ahead of `origin/main`, so the deployed
application is older than the code that will be redesigned. Second, **no
authenticated session was available**, so every staff-only page — registration,
import, receipt entry, history, report, catalogue, dialogs and tables — is
documented from source only and remains functionally unverified.

Nothing in this audit justifies a visual redesign. The evidence supports
**targeted repair of specific interaction defects**, plus a properly instrumented
test pass on the authenticated routes before any layout work begins.

---

## 2. What was inspected, and how

| Method | Detail |
|---|---|
| Source inspection | All 102 tracked files reviewed: frontend modules, Worker API, Firestore client, CSS design system, build and deploy configuration, user and technical guides. |
| Live inspection | `https://sperk-smklohan.pages.dev` — public login and guide only. API `/api/health` returned 200. |
| Local build inspection | `main` @ `6c347c7` served with Vite on `localhost:5199`, used as the redesign baseline. |
| Screenshots | 54 real captures: 18 of production, 36 of the repository build, including full-page, fold, focus, validation and anchor states. |
| Measurement | Headless Chromium (Playwright) at nine CSS viewports. Collected `scrollWidth`/`clientWidth`, element bounding boxes, computed styles, target sizes, font sizes, label associations, tab order, focus-ring styles and per-element contrast ratios. |
| Access control | Protected routes probed unauthenticated to confirm the gate. No bypass attempted, no test account used, no data written. |

**Baseline note — production vs repository.** The public pages render
identically on both (same DOM, same measurements, same 0 px overflow), so
public-page findings apply to both. The 17 unpushed commits touch private-page
accessibility and mobile layout; those changes are **not live**. Any comparison
of "before" against a future "after" must state which of the two it is comparing.

---

## 3. Priority findings

Severity definitions: **P0** blocks an essential task or risks data/security;
**P1** significantly impairs usability or accessibility; **P2** causes avoidable
confusion or inconsistency; **P3** is polish.

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| A-01 | **P1** | Guide index links scroll the target heading under the sticky header. Heading hidden by 93 px at 320 px, 5–6 px at 375–600 px. `scroll-margin-top: 84px` vs header 64–194 px. | `guide-anchor-after-click-320.png`, `guide-anchor-after-click-375.png`; measured |
| A-02 | **P1** | Native validation messages appear in English on a Malay UI; only one field is `required`, so the trigger is inconsistent. | `login-validation-empty-375.png`, `login-validation-email-375.png` |
| A-03 | **P2** | Text-field boundaries are too faint: border 1.81:1, fill 1.07:1 against the card. | Measured computed styles; `login-375-fold.png` |
| R-01 | **P2** | Sticky header grows to 194 px at 320 px (28% of a 700 px viewport), stacking into four rows. | `guide-320-fold.png`; measured per width |
| R-02 | **P2** | The guide is a single 5,468 px scroll at 375 px (7,501 px at the largest text size) with no persistent section navigation. | `guide-375.png`, `guide-textsize-largest-375.png` |
| A-04 | **P2** | Boot shows a generic "Memuatkan…" and resolves after 5 s whether or not auth succeeded, so slow-auth and signed-out look alike. | `main.js`, `shared/auth.js` |
| A-05 | **P3** | "Buka Panduan Penggunaan" is 217 × 20 px — below the 24 px minimum target height. | `login-375-fold.png`; measured |
| D-01 | **P3** | Three control heights (48/52/56 px) and three corner radii (8/10/12/16 px) coexist; `--radius-card: 12px` is not what `.card` uses. | `style.css`; measured |

Full registers: [accessibility-audit.md](accessibility-audit.md),
[responsive-audit.md](responsive-audit.md),
[design-system.md](design-system.md).

### Corrections to the earlier Phase 1 record

An earlier pass of this audit reported a **P1 horizontal-clipping defect at
320–430 px** on the login and guide pages. **That finding does not reproduce.**
Measured across nine widths on two independent builds, horizontal overflow is
0 px everywhere. The earlier captures were taken with a command-line screenshot
method that produced PNGs wider than the requested CSS viewport (one 320 px
capture was 750 px wide), so the apparent clipping was a capture artefact, not a
layout defect. The earlier report's own measurement caveat pointed at this; the
numbers now settle it. That item is withdrawn and replaced by A-01, a real
occlusion defect that the earlier method could not see.

---

## 4. What must be preserved

These are genuine strengths, verified or strongly evidenced, and they should
survive any Phase 2 work:

- **Malay-first, task-named navigation** (`Pendaftaran`, `Jana Resit`,
  `Sejarah Resit`) — no jargon, no abbreviations, no icon-only actions.
- **School-first registration flow** with per-school progress counters.
- **One-tap "Tanda daftar" with a 12-second undo**, and a confirmation prompt
  before reversing a registration.
- **Numbered receipt steps (1–4)** with a save that only unlocks after an
  explicit payment confirmation.
- **Server-authoritative pricing and idempotent receipt creation** — the browser
  never sets a price, and a retried save returns the existing receipt.
- **IC masking** in every list and search result, and no IC in WhatsApp text.
- **Generous type and target sizes** (18 px body, 52–56 px controls, 48 px
  secondary buttons) and a working three-step text-size preference.
- **Visible focus, skip links, live regions** and a formal, printable receipt.
- **Strong contrast** (minimum 7.68:1 on sampled public text).

---

## 5. Limitations — read before planning

| Limitation | Consequence |
|---|---|
| No authorised session or test account | Every protected route is **source-verified only**: dashboard, registration, import, receipt entry, history, catalogue, report, both dialogs, all tables, toasts, undo, loading/empty/error states. None was seen rendering with real or synthetic data. |
| No screen reader used | Announcements, table navigation, dialog focus containment and error association are unverified hypotheses. |
| No manual keyboard-only pass beyond tab order | Focus order on protected pages, Escape handling in menus/dialogs and focus restoration are unverified. |
| No real-device testing | iOS Safari, Android Chrome, and on-screen-keyboard behaviour (including the 194 px header plus a soft keyboard) are untested. |
| No 200–400% browser zoom test | Reflow was assessed via CSS viewport width (320/375 px ≈ 200% zoom at 720 px) and the app's own text-size control, not via real browser zoom. |
| No performance or load testing | The Worker's student cache and 30 s dashboard cache are described from source, not measured under 30–40 concurrent devices. |
| Production ≠ repository | 17 commits are unpushed; the live site is older than the code. |

No screenshot, route, feature or test result in these documents is invented.
Where behaviour is inferred from source, it is labelled as such.

---

## 6. Documentation set

| Document | Contents |
|---|---|
| [feature-inventory.md](feature-inventory.md) | 25 features, 12 routes, 3 legacy redirects, endpoint inventory, source map, verification level per feature |
| [accessibility-audit.md](accessibility-audit.md) | Issue register A-01…A-12 with severity, WCAG reference, evidence, fix, regression risk |
| [responsive-audit.md](responsive-audit.md) | Measured behaviour at nine viewports, overflow table, breakpoint analysis |
| [design-system.md](design-system.md) | Measured tokens: colour, type, spacing, controls, components, states |
| [workflows.md](workflows.md) | Eight staff workflows with steps, errors, recovery and confusion points |
| [redesign-plan.md](redesign-plan.md) | Prioritised Phase 2 plan with problem, fix, benefit, risk and evidence per item |
| [screenshot-index.md](screenshot-index.md) | All 119 captures (54 before, 65 after) mapped to route, viewport and state |
| [after-verification.md](after-verification.md) | Phase 2: what was rebuilt, measured results, feature preservation, limitations |
| [design-system-v2.md](design-system-v2.md) | The system that replaced the one documented above |
| [before-after-comparison.md](before-after-comparison.md) | The seven dimensions of change, with evidence |

Screenshots: [`before/production/`](before/production/) (live site) and
[`before/repo/`](before/repo/) (repository build).

---

## 7. What happened next

The Phase 2 reconstruction was implemented against this audit. The four issues
that mattered most were fixed and re-measured:

| Issue | Then | Now |
|---|---|---|
| Guide heading hidden under the sticky header (A-01) | 93 px obscured at 320 px | 37 px clear |
| English native validation (A-02) | Browser bubbles in English | Three Malay messages, inline, persistent |
| Faint input boundary (A-03) | 1.81:1 | 3.4:1 |
| 194 px phone header (R-01) | 28% of a 700 px screen | 60 px, one row down to 360 px; footer 54 px, one row |

Measured on the result: **65 screens, 0 px horizontal overflow, 0 console errors,
0 contrast failures, 0 targets below 24 px, 30/30 scripted feature checks.**

A follow-up revision then replaced the warm "Tenang" palette with a **corporate
blue** system (`#0F4C81`), swapped the fonts to **Atkinson Hyperlegible** (body)
and **Lexend Deca** (headings), removed the thick coloured left edge on cards,
moved **Log Keluar to the footer**, and **removed the Sejarah Resit page** in
favour of search on the Laporan page. All measurements were re-run and still
pass (lowest contrast 4.53:1).

### Still outstanding

1. **A supervised session with real staff.** The design argument is grounded in
   measured accessibility properties, not observed behaviour. That is the one
   thing no amount of measurement replaces.
2. **A screen reader pass** (NVDA, VoiceOver) over forms, the status banner,
   dialogs and tables.
3. **Real devices**, including on-screen keyboards over the receipt search.
4. **A deployment decision.** `main` remains ahead of `origin/main`; the live
   site still serves the old interface.
5. **Two unproven capabilities:** an actual Excel import write (F-13) and the
   Worker cache under load (F-24).

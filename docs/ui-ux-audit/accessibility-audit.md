# Accessibility audit (WCAG 2.2 AA reference)

This is a source-and-screenshot audit, not a compliance certification. Findings
are prioritized by likely impact on the school’s essential tasks. Staff-only
issues have not been verified with a screen reader or authorised account.

| ID | Page/component | Finding and evidence | Priority | WCAG reference | Recommended improvement | Regression risk |
|---|---|---|---|---|---|---|
| A-01 | Public login and guide, narrow viewport | Right-edge content is clipped in captured 320, 375 and 430 px screenshots. On login, the text-size selector, inputs and form extend beyond the visible right edge. On guide, the intro copy and header actions are cut. See `before/login-mobile-375.png`, `guide-mobile-375.png`, `guide-viewport-320.png`, `guide-viewport-430.png`. | P1 | 1.4.10 Reflow; 1.4.4 Resize text | Reproduce with measured `scrollWidth`/`clientWidth`; constrain flex/grid min-width, wrap content and controls; rerun at all phone widths and 200–400% zoom. | Fixing overflow must not truncate school branding, controls, or receipt content. |
| A-02 | Registration, receipt history, item list | Several GET failures render only an error string without a local retry control: history catch, item-list catch, and receipt-detail failure. Dashboard, registration, receipt student search, and cooperative report provide retries. Source comparison: `history-page.js`, `items-page.js`, `receipt-page.js`, versus `dashboard.js`, `page.js`, `report-page.js`. | P1 | 3.3.1 Error Identification; 3.3.3 Error Suggestion; 4.1.3 Status Messages | Standardize connection/server error title, retain filters/search, add an explicit retry button, and announce result in a polite live region. | Retry must not duplicate writes; keep retries limited to safe reads. |
| A-03 | Import Data file chooser | The `.xlsx` file input is rendered without a visible `<label>`, `aria-label` or `aria-labelledby`; “Fail murid” is a heading, not programmatically associated with the input. See `features/e-daftar/import-page.js`. | P1 | 1.3.1 Info and Relationships; 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value | Add a visible label associated with the input and describe accepted file/size/row limits with `aria-describedby`. | Keep native file-picker keyboard behavior and existing import preview. |
| A-04 | Receipt history search | Search input relies on placeholder text as its only accessible name. See `features/e-resit/history-page.js`. | P1 | 3.3.2 Labels or Instructions; 4.1.2 Name, Role, Value | Add a persistent visible label or accessible name; retain the useful placeholder as an example. | Avoid adding a label that crowds filters on small screens. |
| A-05 | Receipt-history load failure | Catch state clears the count and replaces rows with an error, but provides no retry button and has no explicit live-region/alert semantics. Source: `history-page.js`. | P1 | 3.3.1; 4.1.3 | Keep an announced result state and explicit retry action; do not erase search/date filters. | Ensure an empty history remains distinct from a failed read. |
| A-06 | Initial app/auth boot | The global app says only “Memuatkan...” while Firebase restores auth; after five seconds, `initAuth()` resolves even if auth state has not arrived. Visual or assistive users may see a route change without knowing whether sign-in is still loading or failed. Sources: `main.js`, `shared/auth.js`. | P2 | 2.2.1 Timing Adjustable (contextual); 4.1.3 Status Messages | Validate the timeout behavior under slow/offline conditions. Give boot a named status, distinguish auth initialization failure from signed-out state, and offer a retry without an endless spinner. | Preserve the existing short timeout that avoids indefinite loading when Google/Firebase is blocked. |
| A-07 | Login form feedback | `#login-error` receives text but has no `role="alert"`/live-region semantics. Input labels are implicit via wrapping `<label>` (valid association), but email/password are not marked required in HTML and validation is custom. Source: `pages/login.js`. | P2 | 3.3.1; 3.3.2; 4.1.3 | Confirm screen-reader announcement on submit; use consistent field-required semantics and connect errors/help to controls. | Do not reveal whether an email account exists; preserve generic credential error. |
| A-08 | Student management dialogs | Native `<dialog>` is used for create/edit and destructive confirmation, but source markup should be checked for explicit accessible naming, focus placement/restoration, and focus containment on supported mobile/screen-reader combinations. No dialog was opened in live tests. | P2 | 2.4.3 Focus Order; 2.4.11 Focus Not Obscured; 4.1.2 | Test keyboard/screen-reader entry, Escape/cancel, validation, and return-focus target; add stable title association if needed. | Native dialog behavior varies by browser; avoid layering custom traps that conflict with it. |
| A-09 | Tables and status text | Registration status includes text and a symbol, not colour alone. Report rows have mobile `data-label` text. Table headers are visual `<th>` but explicit `scope` is inconsistent/not evident in all tables. No screen-reader table navigation was tested. | P2 | 1.3.1; 1.4.1 Use of Color | Preserve labels plus symbols; add/verify header scope and card semantics after mobile table transformations. | CSS card reflow must not make row/cell associations worse. |
| A-10 | Touch controls and small typography | Most base buttons/inputs are 48–52px and checkboxes 24px, but mobile overrides reduce some small buttons/nav/guide controls to 44px; several metadata/helper text rules remain `.7–.875rem` (roughly 12.6–15.75px at the root 18px). These sizes are not automatically failures, but can burden low vision and older staff. | P2 | 1.4.4; 2.5.8 Target Size (Minimum) | Check actual computed size, spacing and readable text at 200% zoom, particularly dense tables, login tools, chips, receiver labels and compact actions. | Larger text can change table widths and workflow density; test both size preferences. |
| A-11 | Keyboard navigation and mobile menu | Source provides 4px `:focus-visible`, skip links and Escape handling. Main dropdown is click-operable; mobile toggle exposes `aria-expanded`. Keyboard order, focus visibility against every surface, dropdown focus restoration, and touch behavior were not manually tested. | P2 | 2.1.1 Keyboard; 2.4.3; 2.4.7 Focus Visible; 2.4.11 | Verify tab/shift-tab and Escape through the complete nav; ensure focus is not hidden by sticky topbar when jumping to guide sections. | Do not regress compact mobile nav or pointer/touch activation. |
| A-12 | Error/success feedback consistency | Registration uses undo toast, report has `role=status`, and some failures use `role=alert`; other pages insert plain text. Announcement behavior is inconsistent by page. | P2 | 4.1.3 Status Messages | Define shared status patterns: loading, success, empty, retryable error and action-confirmation, with appropriate polite/assertive announcements. | Avoid announcing every auto-refresh or keystroke noisily. |
| A-13 | Colour contrast (token-level estimate) | Indicative sRGB calculations from CSS tokens: primary text/background 15.66:1, secondary/background 10.22:1, accent/background 7.79:1, white/primary button 13.08:1, done badge text/background 8.06:1, green badge 7.95:1, amber badge 4.94:1. Selected pairs meet 4.5:1, but this does not cover all real component pairs, opacity, hover/disabled states, charts or focus rings. | P2 (verify) | 1.4.3 Contrast; 1.4.11 Non-text Contrast | Run a rendered-state contrast audit across all foreground/background combinations, disabled controls, focus indicators, text-size settings and status badges. | Keep institutional palette and distinguish status without relying on color. |
| A-14 | Zoom, reflow and text resizing | Text size selector persists Biasa/Besar/Sangat besar; root scales 100/125/137.5% from an 18px default. No 200–400% browser zoom or content reflow tests were run. | P2 | 1.4.4; 1.4.10 | Test all critical routes at 200% zoom and 320 CSS-pixel width; ensure no loss of function/content and no two-dimensional scrolling except necessary data tables. | Table data may need controlled horizontal scroll while surrounding page reflows. |
| A-15 | Live regions in registration | School summary and count updates use `aria-live="polite"`; loading row has role status; network error uses alert and retry. These are promising patterns but were not confirmed with assistive technology. | P3 (verify) | 4.1.3 | Keep concise announcements and test update frequency during polling, search and status changes. | Excessive announcements during periodic refresh can interrupt staff. |

## Positive patterns to preserve

- Malay copy describes primary actions; text labels accompany status symbols.
- Registration starts with primary-school choice and shows school totals.
- Search can be cleared; errors preserve selected school/search and expose a
  retry action in registration.
- Registration marking can be undone; reversal asks for confirmation.
- Receipt entry is presented as numbered steps and saves only after explicit
  payment confirmation.
- Three text-size choices persist in local storage; focus outlines and skip
  links exist in the current source.
- Student IC is masked in list/search results and excluded from WhatsApp text.

## Verification needed before declaring WCAG status

Use automated axe-style checks as a supplement, not a score-based verdict. Test
with keyboard only, NVDA or another screen reader, 200–400% zoom, high contrast
settings, mobile browser with on-screen keyboard, and the real approved test
account. Include empty data, delayed reads, network errors, form validation,
dialog open/close, success and undo states. Record actual browser/assistive
technology versions and retest fixed issues.

## Phase 2 implementation status

The login error, import file input, history filters, tables, loading/error
states, retry actions, navigation dropdown naming, and native dialog naming
received source-level improvements. Public responsive pages were inspected at
the documented CSS viewport widths. Keyboard-only operation, screen reader
announcements, contrast for every rendered state, dialog focus management,
and zoom/reflow remain unverified. These changes do not establish WCAG 2.2 AA
conformance; see `phase2-implementation-status.md`.

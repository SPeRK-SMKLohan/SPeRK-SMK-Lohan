# Phase 2 redesign plan (prioritized)

This is a plan only. Phase 1 did not modify the app. Fix priorities after school
staff validate findings and the authenticated pages are inspected in a
permitted test session.

| Priority | Problem and evidence | Recommendation | Affected pages/components | Benefit | Risk / regression checks | Screenshot evidence |
|---|---|---|---|---|---|---|
| P0 | No critical data-loss defect was verified in this access-limited audit. Permanent deletion exists in source, but has password confirmation and was not executed. | Do not redesign destructive actions until confirmation, password gate, backup/recovery expectation and permissions are validated with the school. | Registration delete dialogs; API student delete endpoints; backup process | Avoids changing a high-impact school data rule without evidence | Permanent deletion remains permanent; use synthetic data in tests | Staff dialog screenshot unavailable; see inventory F-11 |
| P1 | Public login and guide content overflow at 320–430px; content/action labels are clipped. | Measure actual overflow; repair narrow layouts and validate 320/375/430 widths plus 200–400% zoom. Keep page content and controls within viewport. | `main.js`, `.guide-public-head`, login layout, page/card min-width CSS | Makes core access and help reachable on common phones | Brand, size selector, login, buttons and page text must not collide or shrink illegibly | `before/login-mobile-375.png`; `guide-mobile-375.png`; guide 320/430 captures |
| P1 | Read failures have inconsistent recovery; history, catalogue and receipt detail do not expose page-local retry controls. | Standardize error panels with useful distinction, retry button and announced status; preserve form/filter context. | Dashboard, registration, import, history, items, receipt detail, report; shared feedback patterns | Less uncertainty and fewer repeated reloads during registration day | Retry only safe GETs; receipt writes must remain single/idempotent; empty state remains separate | Staff states unavailable; code evidence at `history-page.js`, `items-page.js`, `receipt-page.js` |
| P1 | Import file chooser and receipt-history search have weak/missing programmatic labels. | Add visible and programmatic labels/help text. Verify name, role, value and required state using a screen reader. | `import-page.js`, `history-page.js` | Clearer for low vision, cognitive and screen-reader users | Keep filters compact; ensure label-to-control IDs unique | Staff pages unavailable; source evidence in A-03/A-04 |
| P1 | No authenticated end-to-end observation was possible, leaving high-value counter tasks unvalidated. | Schedule a permitted test account or supervised authorized session. Observe a teacher completing register, import, receipt, report, retry and undo tasks with representative devices. | All protected routes | Design around actual staff task success and confusion rather than assumptions | Protect records; use synthetic/student-free test data and agreed cleanup | No authenticated screenshots captured |
| P2 | Initial auth/data loading, empty results and failure messages vary; `Memuatkan...` can be ambiguous. | Use consistent named status patterns (loading, empty, no matches, connection error, permission error, success), duration/retry guidance and live announcements. | `main.js`, auth boot, dashboard, list pages, import, history, items, receipts | Reduces repeated refreshes and confusion about blank/empty datasets | Avoid verbose announcements and incorrect “no data” on network failure | Public-only captures; staff loading states unavailable |
| P2 | Keyboard and dialog focus behavior is only inferred from markup. | Conduct keyboard and screen-reader checks; verify focus entry, containment, validation, close/Escape and restoration; fix only demonstrated defects. | Navigation, student form, bulk delete, receipt flow | More predictable operation for keyboard users and assistive tech | Native `<dialog>` behavior differs across browsers; preserve focus order | No interaction screenshots |
| P2 | Some compact/muted labels remain small while root text scaling can alter dense layouts. | Verify actual rendered text/contrast at all three text settings, browser zoom, dark/high contrast settings and on phone. Increase only labels that fail readability checks. | Shared CSS, tables, badges, form helpers, receipt screen | Supports low vision without blindly enlarging every element | Avoid clipping and excessive scrolling; preserve formal receipt print layout | Current desktop/mobile public captures establish baseline only |
| P2 | Responsive behavior at staff-page breakpoints is unverified; CSS has 640/900/1020/1080px transitions. | Test 320, 375, 430, 600, 768, 1024, 1280, 1440 and 1920 widths for all critical tasks; include orientation, on-screen keyboard, long names and large text. | Nav, registration, import, receipt, history, report, dialogs | Prevents breakpoint-specific task blockers | Keep data table associations and receipt/print fidelity | Guide captures available; staff captures must be added after access |
| P3 | Public guide index wraps on tablet/desktop at intermediate widths, although it stays readable in captures. | Consider compacting/organizing section links only if usability observation shows repeated scanning difficulty. | `pages/guide.js`, `.guide-index` | Easier help navigation if users struggle to scan | Keep links visible, labelled, keyboard focusable and avoid hidden content | `guide-viewport-768.png`, `guide-viewport-1024.png`, `guide-viewport-1280.png` |

## Recommended sequence

1. Obtain school agreement on test scenarios and an authorised test account or
   supervised session. Confirm all workflows and wording that must stay.
2. Reproduce P1 phone overflow, log exact overflowing nodes and capture focused
   screenshots of the worst cases.
3. Run task walkthroughs and accessibility checks on every protected route;
   update issue priorities with observed evidence.
4. Implement the smallest changes that fix verified P1 issues, then retest
   feature-preservation checklist (feature inventory IDs F-01–F-25).
5. Address P2/P3 findings in validated groups. Recheck data rules, receipts,
   privacy and all breakpoints before production deployment.

## Acceptance criteria for Phase 2

- No unintended horizontal page overflow at 320 CSS px; all content/actions
  remain available at 200% browser zoom and text settings.
- Staff can complete attendance, import, receipt, history and report tasks with
  representative users/devices; outcomes and undo/error recovery are clear.
- Empty data is distinguishable from load failure; retry is available for
  safe reads without losing selected school, search or filters.
- Keyboard and screen-reader checks pass for navigation, labels, status
  feedback, dialogs, tables and forms; automated scans are supplemented by
  manual review.
- Receipt totals, audit trail/teacher name, PDF/print, payment rules, T1-only
  enforcement, student privacy, data permissions and destructive safeguards
  remain unchanged unless the school explicitly approves a rule change.

## Phase 2 implementation status

The frontend shared feedback, semantics and responsive adjustments are now
implemented in the working tree. A source-based feature checklist and the
available test results are in `feature-preservation-checklist.md` and
`phase2-implementation-status.md`. The original priorities and evidence above
remain as the Phase 1 plan; authenticated workflow, manual accessibility, and
staff-page responsive verification still need an authorized test session.

# Phase 2 implementation status

> **Status note (25 Oct 2026).** Historical record of an earlier Phase 2 attempt.
> Its screenshot references (`before/`, `after/`) are no longer present in the
> working tree. The current Phase 1 audit re-verified the source claims below
> against `main` @ `6c347c7` and re-captured both baselines into
> `before/production/` and `before/repo/`. Two items changed materially:
> the "no horizontal overflow" result is now **confirmed by measurement at nine
> widths on two builds**, and the previously reported clipping defect has been
> **withdrawn as a capture artefact**. See [README](README.md).

## Implemented

- Unified loading and retryable read-error presentation across the dashboard,
  receipt history, catalogue, saved receipt and cooperative report.
- Error messages distinguish connection problems from other server failures;
  the safe read retry does not alter or retry a write.
- Registration no longer shows “Memuatkan” before a school has been selected.
  On a failed request it keeps the selected school and search controls available
  and avoids showing an extra, duplicate school-summary error.
- Login, import, history filters, import preview and report feedback have
  clearer labels or accessible status/error announcements.
- Protected receipt pages now announce student search results, use a clearer
  no-match message, show a persistent label for the WhatsApp phone field, and
  use the shared loading message while the cooperative catalogue loads.
- Import completion is announced, file processing uses the shared loading
  pattern, and template-generation failure has a retry action.
- Tables have captions and explicit column-header associations, including
  receipt totals.
- Navigation menus identify their controlled menu; Escape closes a dropdown
  and returns focus to its trigger.
- Mobile layout rules constrain the login, public guide, modal, menu, table
  cards and toast feedback; touch targets and compact labels are larger.
- Reduced-motion and forced-colors treatments are included.
- Report totals display as unavailable (rather than zero) after a failed read,
  and CSV export is disabled until fresh report data loads.
- Feature-preservation review: [checklist](feature-preservation-checklist.md).
- Public before/after evidence: [comparison](before-after-comparison.md).

The protected-page work is source-level only: it was not exercised in a
signed-in browser and has no fabricated screenshots.

## Verification results

| Check | Result |
|---|---|
| Production frontend build (`npm run build`) | Passed |
| `git diff --check` | Passed; only line-ending notices from Git on Windows |
| Public guide responsive captures at 320, 375, 430, 600, 768, 1024, 1280, 1440 and 1920 CSS px | Captured; no horizontal overflow detected |
| Public login captures at 375 × 812, 812 × 375 and 1440 × 900 | Captured; no horizontal overflow detected |
| Functional feature-by-feature regression | Not performed; protected routes require an authorized staff session and safe test records |
| Keyboard and screen-reader checks | Not performed manually |
| Contrast audit across rendered states | Not performed; Phase 1 token estimates are not a compliance result |
| 200–400% zoom, phone keyboard, touch and offline/slow-network workflow tests | Not performed |
| Automated browser/a11y tests | Not available in the repository's declared scripts/dependencies |

The documented public responsive captures and build are useful checks, but they
do not establish WCAG 2.2 AA conformance or production readiness for protected
workflows. Use the feature checklist and complete the outstanding checks with
school-authorized test access before release.

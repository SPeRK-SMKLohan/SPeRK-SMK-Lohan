# SPeRK UI/UX Audit — Phase 1

## Executive summary

This audit records the current SPeRK application before any redesign. It is
based on the checked-in frontend, Worker API and technical configuration, plus
unauthenticated screenshots of the production login and public guide. No
application code, styles, settings or data were changed during the audit.

**Priority finding:** the public guide and login screenshots show content
clipped beyond the right edge at narrow phone widths (320, 375 and 430 px).
The cause is not yet isolated, so Phase 2 should reproduce it with browser
measurements before changing layout rules. The public guide is readable and
well-structured at the captured 600 px and wider widths. Authenticated staff
pages could not be exercised because no authorised browser session or test
account was provided; their controls and workflows below are identified from
source code and explicitly marked as such.

## Scope and method

- Inspected the route table, shared shell, styles, page/feature modules, API
  client, Firebase authentication, Worker routes, Firestore access helpers,
  caching, validation and package manifests.
- Opened the live public site in a fresh headless Edge profile. Captured the
  public login and guide without signing in or accessing student data.
- Captured guide screenshots at all nine requested viewport sizes. Visually
  reviewed the 320, 375, 430, 600, 768, 1024, 1280, 1440 and 1920 px guide
  captures. Captured login at 375 and 1440 px.
- Calculated indicative contrast ratios from the CSS palette for selected
  foreground/background token pairs. These are not a WCAG conformance result;
  actual component combinations and rendered states still need manual and
  automated verification.
- Searched for a test setup. Frontend `package.json` exposes `dev`, `build` and
  `preview`; no test, browser automation or accessibility test dependency was
  found in the repository.

## Access and evidence limitations

- The local browser-control surface reported that browser use is disabled.
  Headless Edge was available and used for public routes only.
- Production requires authentication for dashboard, registration, imports,
  receipt operations, inventory and reports. No authorised session was
  available. No attempt was made to bypass sign-in.
- The public site could be reached by Edge. The web page reader could not
  retrieve it, so live findings use the actual Edge screenshots. App-specific
  staff-page findings are source-inspected, not live-verified.
- Edge command-line captures are viewport screenshots, not full-page captures.
  The long guide is therefore only partially visible in each image. There are
  no authenticated navigation, dialog, validation, loading, success or error
  screenshots. No test/student/staff records were used.
- No screen-reader, keyboard-only, zoom/reflow, touch-device or slow-network
  session was run. WCAG findings are audit hypotheses grounded in code or
  screenshots and must not be read as a certification.

## Audit re-check — 25 Oct 2026

- Rechecked that the application source still matches the inventory and source
  findings. No application files, styles, settings, dependencies or data were
  changed for this audit re-check.
- A Brave window showing SPeRK is present, but the available browser inspection
  connection timed out twice while reading its page. A direct HTTPS request to
  the public Pages host returned HTTP 200; this confirms availability only and
  is not a visual or interaction inspection.
- No new screenshots were captured during this re-check. The original
  screenshots below remain the evidence from the earlier public-page capture;
  the authenticated routes and their states remain unverified in a live
  session. Do not treat the open browser window or HTTP response as proof that
  staff workflows were tested.
- Source changes made briefly before this read-only audit were reverted. The
  working tree has no tracked application-source diff.

## Documents

- [Feature inventory](feature-inventory.md) — routes, features, flows, APIs,
  verification level and redesign constraints.
- [Accessibility audit](accessibility-audit.md) — prioritised issues and
  evidence.
- [Responsive audit](responsive-audit.md) — viewport observations and limits.
- [Design system](design-system.md) — current tokens, controls, breakpoints and
  patterns.
- [Workflows](workflows.md) — staff tasks, prerequisites, success and recovery.
- [Phase 2 redesign plan](redesign-plan.md) — prioritised work and regression
  risks.
- [Screenshot index](screenshot-index.md) — capture dimensions, routes and
  observations. Images are in `before/`.

## Main Phase 2 priorities

1. Resolve and fix narrow-screen horizontal clipping; verify at 320–430 px and
   browser text zoom before release.
2. Run authenticated task-based checks with representative staff and safe test
   data across registration, receipt and reporting workflows.
3. Make loading, empty, error, retry and saved states consistent and
   screen-reader perceivable across all data pages.
4. Complete keyboard, dialog, accessible-name, contrast and zoom/reflow checks;
   repair defects while preserving existing data rules and receipt behaviour.
5. Re-test all preserved routes and tasks at phone, tablet and desktop widths.

See each report for evidence, confidence and limitations. Do not begin the
redesign until the school confirms the workflow and copy requirements for
Phase 2.

## Phase 2 implementation update

Phase 2 frontend work has now been applied to the local working tree. The
original audit findings and screenshots above remain intact. Public-page
captures, implementation notes, the feature-preservation checklist and
verification limits are recorded in:

- [Phase 2 implementation status](phase2-implementation-status.md)
- [Feature-preservation checklist](feature-preservation-checklist.md)
- [Before-and-after comparison](before-after-comparison.md)
- [Screenshot index](screenshot-index.md) (`after/` section)

The public login and guide have been checked at responsive CSS viewport sizes.
Staff-only workflows still require an authorized account and safe test data
before functional, keyboard, screen-reader and full responsive regression can
be completed. The build passes; this does not certify WCAG conformance or
production readiness.

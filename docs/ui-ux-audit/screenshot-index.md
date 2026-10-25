# Original screenshot index

All images are real viewport screenshots captured from the live public site
`https://sperk-smklohan.pages.dev` using a fresh, unauthenticated headless Edge
profile on 25 Oct 2026. No real student or staff records were accessed. Browser
window size was requested to match the table; the generated PNG dimensions
were checked. Each capture shows only the viewport, not the entire long page.

| File | Page/route | Viewport | State / observation |
|---|---|---:|---|
| [`login-mobile-375.png`](before/login-mobile-375.png) | Public login `#/login` | 375 × 812 | Empty sign-in form; visible right-edge clipping of form/header content. |
| [`login-desktop-1440.png`](before/login-desktop-1440.png) | Public login `#/login` | 1440 × 900 | Empty sign-in form, desktop baseline. |
| [`guide-mobile-375.png`](before/guide-mobile-375.png) | Public guide `#/panduan` | 375 × 812 | Top of guide; text/header overflow at right. |
| [`guide-viewport-320.png`](before/guide-viewport-320.png) | Public guide `#/panduan` | 320 × 700 | Small-mobile clipping. |
| [`guide-viewport-430.png`](before/guide-viewport-430.png) | Public guide `#/panduan` | 430 × 932 | Large-mobile clipping remains. |
| [`guide-viewport-600.png`](before/guide-viewport-600.png) | Public guide `#/panduan` | 600 × 900 | Text wraps; content appears within screen in reviewed capture. |
| [`guide-viewport-768.png`](before/guide-viewport-768.png) | Public guide `#/panduan` | 768 × 1024 | Tablet baseline; index wraps to second line. |
| [`guide-viewport-1024.png`](before/guide-viewport-1024.png) | Public guide `#/panduan` | 1024 × 768 | Tablet baseline; index wraps. |
| [`guide-viewport-1280.png`](before/guide-viewport-1280.png) | Public guide `#/panduan` | 1280 × 800 | Desktop baseline; index wraps last link. |
| [`guide-desktop-1440.png`](before/guide-desktop-1440.png) | Public guide `#/panduan` | 1440 × 900 | Desktop baseline; first sections visible; guide continues below viewport. |
| [`guide-viewport-1920.png`](before/guide-viewport-1920.png) | Public guide `#/panduan` | 1920 × 1080 | Large-desktop baseline; content column remains centered/constrained. |

## Not captured

All authenticated pages and their navigation/menu, empty/error/loading/success
states, forms, dialogs, search results, table records, undo toast, receipt,
print/PDF and report filters. These require an authorised session/test account;
none was available. No screenshots were fabricated or created from mock UI.

Full-page screenshots and interactive states were not captured because the
available Edge command-line capture takes a viewport screenshot and no browser
automation session was available. Add these after obtaining a permitted test
session. The `before/` directory is the original baseline and should not be
overwritten by Phase 2 captures; use a separate `after/` directory for
comparison.

## Re-check on 25 Oct 2026

No additional image was captured. Although a Brave window was open, the
available browser inspection connection timed out twice before it could expose
the page. The public Pages host returned HTTP 200 to a plain request, which
does not establish visual correctness or verify any interaction. Existing
`before/` images are retained unchanged; authenticated pages and states listed
above still need an authorised, functioning browser session.

## Phase 2 after screenshots

These screenshots were captured from the local production build with a fresh
public browser context. Device metrics were emulated as CSS viewport sizes.
They contain no student or staff information. The original screenshots remain
in `before/`.

| File | Page/route | Viewport | State / observation |
|---|---|---:|---|
| [`login-mobile-375.png`](after/login-mobile-375.png) | Public login `#/login` | 375 × 812 | Empty form; card and size control reflow vertically without horizontal overflow. |
| [`login-landscape-812.png`](after/login-landscape-812.png) | Public login `#/login` | 812 × 375 | Landscape form; page can scroll vertically and content remains within width. |
| [`login-desktop-1440.png`](after/login-desktop-1440.png) | Public login `#/login` | 1440 × 900 | Empty sign-in form, desktop layout. |
| [`guide-viewport-320.png`](after/guide-viewport-320.png) | Public guide `#/panduan` | 320 × 700 | Small phone layout; header, index and content wrap within viewport. |
| [`guide-mobile-375.png`](after/guide-mobile-375.png) | Public guide `#/panduan` | 375 × 812 | Standard mobile layout; full-width accessible header controls. |
| [`guide-viewport-430.png`](after/guide-viewport-430.png) | Public guide `#/panduan` | 430 × 932 | Large mobile layout; no horizontal overflow detected. |
| [`guide-viewport-600.png`](after/guide-viewport-600.png) | Public guide `#/panduan` | 600 × 900 | Small tablet/intermediate width. |
| [`guide-viewport-768.png`](after/guide-viewport-768.png) | Public guide `#/panduan` | 768 × 1024 | Tablet layout. |
| [`guide-viewport-1024.png`](after/guide-viewport-1024.png) | Public guide `#/panduan` | 1024 × 768 | Large tablet layout. |
| [`guide-viewport-1280.png`](after/guide-viewport-1280.png) | Public guide `#/panduan` | 1280 × 800 | Laptop layout. |
| [`guide-desktop-1440.png`](after/guide-desktop-1440.png) | Public guide `#/panduan` | 1440 × 900 | Desktop layout. |
| [`guide-viewport-1920.png`](after/guide-viewport-1920.png) | Public guide `#/panduan` | 1920 × 1080 | Large desktop layout. |

The screenshots cover viewport states only, not full-page content or
interaction states. The previously generated `login-mobile-320.png` had a
750-pixel image width and did not represent a 320 CSS-pixel capture, so it was
removed and is not included. See
[`before-after-comparison.md`](before-after-comparison.md) for the measurement
caveat and authenticated-page limitations.

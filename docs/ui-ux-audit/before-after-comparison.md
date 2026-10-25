# Phase 2 before-and-after comparison

Phase 1 screenshots in `before/` are retained unchanged. The screenshots in
`after/` were captured from the local production build using a fresh public
session, browser CSS viewport emulation, and no student or staff records.
Authenticated pages are not represented by invented or mock screenshots.

## Public login

| Original | Redesigned | Problem and change | Expected benefit | Remaining limitation |
|---|---|---|---|---|
| [`before/login-mobile-375.png`](before/login-mobile-375.png) | [`after/login-mobile-375.png`](after/login-mobile-375.png) | The original report described right-edge clipping. The login layout now constrains the card and tools to the viewport, allows vertical scrolling, and gives the form usable widths and touch targets. Login errors now announce as alerts. | The sign-in fields and actions fit a phone layout and errors are easier to notice. | No sign-in was attempted; keyboard, screen-reader, and zoom checks are outstanding. |
| [`before/login-desktop-1440.png`](before/login-desktop-1440.png) | [`after/login-desktop-1440.png`](after/login-desktop-1440.png) | Keeps the centered sign-in form while aligning tools and card to a bounded content width. | More predictable sizing without changing authentication. | No authenticated transition was tested. |

## Public Panduan

| Original | Redesigned | Problem and change | Expected benefit | Remaining limitation |
|---|---|---|---|---|
| [`before/guide-viewport-320.png`](before/guide-viewport-320.png) | [`after/guide-viewport-320.png`](after/guide-viewport-320.png) | The original screenshot was reported clipped. The public header, guide content, section index, and buttons now use constrained, wrapping layouts at narrow widths. | Content remains readable and controls stay within a small phone viewport. | Long-page sections were not all photographed at each width. |
| [`before/guide-mobile-375.png`](before/guide-mobile-375.png) | [`after/guide-mobile-375.png`](after/guide-mobile-375.png) | The header stacks, text-size choice remains labelled, and the guide index uses full-width targets. | Easier touch navigation and less crowded text on mobile. | Screen-reader and enlarged-text interaction were not tested. |
| [`before/guide-viewport-430.png`](before/guide-viewport-430.png) | [`after/guide-viewport-430.png`](after/guide-viewport-430.png) | Responsive wrapping and minimum-width constraints. | Prevents narrow-column overflow while preserving all guide links. | Full-page capture unavailable. |
| [`before/guide-viewport-600.png`](before/guide-viewport-600.png) | [`after/guide-viewport-600.png`](after/guide-viewport-600.png) | Responsive layout remains usable at an intermediate width. | Less abrupt behavior between phone and tablet sizes. | Interaction testing unavailable. |
| [`before/guide-viewport-768.png`](before/guide-viewport-768.png) | [`after/guide-viewport-768.png`](after/guide-viewport-768.png) | Content width and wrapping reviewed at tablet width. | Preserves readable reflow at tablet widths. | Interaction testing unavailable. |
| [`before/guide-viewport-1024.png`](before/guide-viewport-1024.png) | [`after/guide-viewport-1024.png`](after/guide-viewport-1024.png) | Content width and wrapping reviewed at large tablet width. | Avoids stretching text lines unnecessarily. | Interaction testing unavailable. |
| [`before/guide-viewport-1280.png`](before/guide-viewport-1280.png) | [`after/guide-viewport-1280.png`](after/guide-viewport-1280.png) | Desktop guide layout and content width reviewed. | Maintains a consistent reading measure. | Interaction testing unavailable. |
| [`before/guide-desktop-1440.png`](before/guide-desktop-1440.png) | [`after/guide-desktop-1440.png`](after/guide-desktop-1440.png) | Desktop guide baseline retained with updated shared sizing and focus behavior. | Consistent presentation between desktop and mobile. | Long-page/anchor keyboard behavior not manually tested. |
| [`before/guide-viewport-1920.png`](before/guide-viewport-1920.png) | [`after/guide-viewport-1920.png`](after/guide-viewport-1920.png) | Constrained content remains centered on large displays. | Keeps text readable instead of using the full screen width. | Interaction testing unavailable. |

### Screenshot measurement caveat

The original screenshot index records requested image dimensions but not the
browser's CSS viewport. A re-check found that a previous headless Edge capture
could produce a 320-pixel PNG while the page layout viewport was 504 CSS pixels.
Therefore, the original screenshots document what was captured but do not
prove the page was laid out at the labelled CSS width. Phase 2 screenshots use
browser viewport emulation; the public login and guide were checked at actual
CSS widths, and no horizontal overflow was detected from 320 through 1920 px.
This means the earlier clipping is not claimed as a verified defect fixed by
this work; the new captures establish a more reliable responsive baseline.

## Shared application and data pages

The implementation adds consistent, announced loading states, a distinct
retryable network/server error panel for safe reads, explicit retry actions,
accessible table captions/column headers, and persistent form/filter labels.
These changes touch the dashboard, registration, import, receipt creation,
receipt detail, history, catalogue, and cooperative report modules. There are
no authenticated before/after screenshots because a permitted staff session
was not available. Source changes can be reviewed, but visual layout and real
workflow outcomes on these pages remain unverified.

The later protected-page pass also adds a live region for receipt student
search results, a more useful no-match message, a persistent label for the
WhatsApp number field, and retryable template-generation feedback on the import
page. These have not been visually captured or interactively tested while
signed in.

## Evidence files

- Public login: `after/login-mobile-375.png`, `after/login-landscape-812.png`,
  `after/login-desktop-1440.png`.
- Public guide: `after/guide-viewport-320.png`, `guide-mobile-375.png`,
  `guide-viewport-430.png`, `guide-viewport-600.png`,
  `guide-viewport-768.png`, `guide-viewport-1024.png`,
  `guide-viewport-1280.png`, `guide-desktop-1440.png`,
  `guide-viewport-1920.png`.
- Staff routes, dialogs, validation, tables, retry states and saved receipts:
  not captured; requires authorized access and safe test records.

# Responsive audit

> **Phase 1 record.** This document describes the interface *before* the
> reconstruction and is kept as the baseline. The current system is documented in
> [after-verification.md](after-verification.md) and the measured results in
> [after-verification.md](after-verification.md).

## Method

Measured in headless Chromium with real CSS viewport emulation (not a resized
window): `Emulation.setDeviceMetricsOverride` via Playwright, device scale
factor 1, mobile/touch flags set for widths ≤430 px. For each of nine widths,
both public routes were loaded on **two builds** — the live site
(`sperk-smklohan.pages.dev`) and the repository build (`main` @ `6c347c7`,
`localhost:5199`) — and measured, not merely photographed.

For each combination the audit recorded `documentElement.scrollWidth` vs
`clientWidth`, the bounding box of every element extending past the viewport,
every interactive element's size, every rendered font size, and the computed
style of the sticky header.

**Not tested:** authenticated layouts (no session), real devices, on-screen
keyboards, and real browser zoom (see §7).

---

## 1. Horizontal overflow — none

`scrollWidth − clientWidth`, in CSS pixels:

| Width | Guide (prod) | Guide (repo) | Login (prod) | Login (repo) |
|---:|---:|---:|---:|---:|
| 320 | 0 | 0 | 0 | 0 |
| 375 | 0 | 0 | 0 | 0 |
| 430 | 0 | 0 | 0 | 0 |
| 600 | 0 | 0 | 0 | 0 |
| 768 | 0 | 0 | 0 | 0 |
| 1024 | 0 | 0 | 0 | 0 |
| 1280 | 0 | 0 | 0 | 0 |
| 1440 | 0 | 0 | 0 | 0 |
| 1920 | 0 | 0 | 0 | 0 |

**Result: 0 px overflow in all 36 combinations.** No element was found extending
beyond the viewport at any width. The layout reflows correctly, including at
320 px and at the largest text size.

This directly contradicts the earlier audit's P1 "narrow-screen clipping"
finding. That finding came from a command-line capture method that produced
images wider than the requested CSS viewport (a nominal 320 px capture was
750 px wide), so the "clipping" was an artefact of the screenshot, not the
layout. See [README §3](README.md#corrections-to-the-earlier-phase-1-record).

---

## 2. Document height — the pages are long

| Width | Guide height | Login height |
|---:|---:|---:|
| 320 | 6,540 px | 905 px |
| 375 | 5,468 px | 877 px |
| 430 | 4,817 px | 932 px |
| 600 | 3,959 px | 900 px |
| 768 | 3,312 px | 1,024 px |
| 1024 | 2,989 px | 855 px |
| 1280–1920 | 2,851 px | 855–1,080 px |

The guide is a single continuous document: **6.5 screens tall at 320 px**, and
**7,501 px at 375 px with the largest text size**. Its only navigation is the
in-page index at the top, which is 154 px tall at 1440 px but wraps to several
rows on phones and scrolls away immediately. See R-02 and A-01.

---

## 3. Sticky header height — the key responsive variable

| Width | Header height | Rows occupied |
|---:|---:|---|
| 320 | **194 px** | 4 (brand / "Saiz teks" label / select / "Log Masuk") |
| 375–600 | **106 px** | 3 |
| 768–1024 | **64 px** | 1 |
| 1280–1920 | **72 px** | 1 |

At 320 px the header consumes **28% of a 700 px viewport** before any content is
shown (`guide-320-fold.png`). At 375 px it is 106 px — 13% of an 812 px viewport.

This is the root cause of the anchor defect: `style.css` sets
`scroll-margin-top: 84px` on cards, a value that is correct at 768–1024 px
(64 px header) and too small everywhere else.

### Anchor occlusion, measured after tapping a guide index entry

| Width | Header bottom | Section top | Section hidden | Heading hidden |
|---:|---:|---:|---:|---:|
| 320 | 194 px | 84 px | **110 px** | **93 px** |
| 375 | 106 px | 84 px | 22 px | 5 px |
| 430 | 106 px | 84 px | 22 px | 5 px |
| 600 | 106 px | 84 px | 22 px | 6 px |
| 768–1920 | 64–72 px | 84 px | 0 px | 0 px |

At 320 px the user taps "Resit koperasi" and arrives at a page position where
the heading is **completely hidden** and the visible text begins mid-sentence
("Jana Resit dan cari murid Tingkatan 1 menggunakan…"). Evidence:
`before/repo/guide-anchor-after-click-320.png`,
`before/repo/guide-anchor-after-click-375.png`.

---

## 4. Per-viewport observations

All screenshots are full-page unless marked "fold".

| Viewport | Files | Observation |
|---|---|---|
| **320 × 700** | `guide-320.png`, `guide-320-fold.png`, `login-320.png` | No overflow. Header stacks to 194 px. Brand wordmark, size control and login link each take a row. Content is readable; the size selector ends ~2 px from the right edge at the largest text size (`login-textsize-largest-320.png`). |
| **375 × 812** | `guide-375.png`, `guide-375-fold.png`, `login-375.png` | No overflow. Header 106 px. Login card fills the width with 14 px page margins. Guide is 5,468 px tall. |
| **430 × 932** | `guide-430.png`, `login-430.png` | No overflow. Header 106 px. Comfortable line lengths. |
| **600 × 900** | `guide-600.png`, `login-600.png` | No overflow. Still in the mobile header branch (106 px) because the 1080 px rule governs wrapping, not 640 px. |
| **768 × 1024** | `guide-768.png`, `login-768.png` | No overflow. Header drops to 64 px — a sudden 42 px jump from 600 px. |
| **1024 × 768** | `guide-1024.png`, `login-1024.png` | No overflow. Desktop header. |
| **1280 × 800** | `guide-1280.png`, `login-1280.png` | No overflow. Content column capped at 1120 px, centred. |
| **1440 × 900** | `guide-1440.png`, `guide-1440-fold.png`, `login-1440.png`, `login-1440-fold.png` | No overflow. Login card 420 × 765 px, centred, with wide empty margins. |
| **1920 × 1080** | `guide-1920.png`, `login-1920.png` | No overflow. Content remains 1120 px; margins grow to 400 px each side. |

Additional states captured: `login-landscape-812x375.png` (landscape phone — no
overflow, page scrolls), `guide-textsize-largest-375.png` (largest text,
0 px overflow, 7,501 px tall), `login-textsize-largest-320.png` (largest text at
smallest width, 0 px overflow).

---

## 5. Findings

### R-01 — Header height triples on small phones · **P2**
The sticky header is 194 px at 320 px, 106 px at 375–600 px and 64 px at 768 px.
At the smallest size it stacks brand, size label, select and login link into four
rows, leaving 506 px of a 700 px viewport for content and consuming 28% of the
screen before the first line of help text.
**Source:** `.topbar-in { flex-wrap: nowrap }` at base, overridden to wrap at
≤1080 px, combined with a 42 px crest + 18.9 px wordmark + 150 px-min select that
cannot share a row below ~360 px.
**Recommendation:** at ≤360 px, collapse the wordmark to the crest, or move the
size selector into the card rather than the header.
**Risk:** brand recognition on the login screen; the size control must stay
reachable and labelled.

### R-02 — The guide has no persistent section navigation · **P2**
The document is 6.5 screens tall at 320 px. The index is at the top and scrolls
away; there is no back-to-top, no sticky sub-navigation and no collapse.
For a user with low digital confidence reading step-by-step instructions, the
cost of re-finding a section is high.
**Recommendation:** make the index sticky/collapsible on ≤640 px, or add
`<details>` sections that default to open on desktop and collapsed on phones.
**Risk:** collapsing content can hide the very instructions users came for; any
accordion must be open by default or clearly labelled.

### R-03 — Anchor offset does not track header height · **P1**
See §3. `scroll-margin-top: 84px` is a fixed value against a 64–194 px header.
**Recommendation:** set `scroll-margin-top` from a CSS custom property per
breakpoint (`--header-h: 194px` at ≤360 px, `106px` at ≤640 px, `64px` at
≤1080 px, `72px` above), or compute it once in JS from
`topbar.getBoundingClientRect().height` on resize.
**Risk:** none to data; must not break the desktop value that currently works.

### R-04 — Size selector is cramped at 320 px with the largest text · **P3**
At 320 px + "Sangat besar" the select ends ~2 px from the right edge
(`login-textsize-largest-320.png`). No overflow, but the control has no breathing
room and the chevron sits against the edge.
**Recommendation:** allow the select to shrink below its 150 px `min-width` at
≤360 px, or stack label above control.
**Risk:** the select is the accessibility escape hatch; it must not become
smaller than 44 px tall or lose its visible label.

### R-05 — Breakpoint jump between 600 px and 768 px · **P3**
The header drops 42 px between these widths because the 1080 px wrap rule is the
only control on header layout. Nothing breaks, but the transition is abrupt.
**Recommendation:** treat as cosmetic; only address if a real device shows a
problem.

### R-06 — Layout inside a 1440–1920 px viewport is very sparse · **P3**
The content column is capped at 1120 px, which is correct for readability, but
the login card is only 420 px wide inside it, leaving a large empty field.
**Recommendation:** no change required. Recorded so it is not mistaken for a
defect during redesign.

---

## 6. What works and must be preserved

- **Zero horizontal overflow at every tested width**, including 320 px and the
  largest text size. This is a real achievement and should be treated as a
  regression test, not re-litigated.
- **Tables that become labelled cards** at ≤640 px, using `data-label`
  attributes so each cell keeps its column meaning.
- **Flexible button labels** (`white-space: normal`) so long Malay verbs wrap
  instead of clipping.
- **Page padding reduction** (24 → 14 px) at ≤640 px, keeping line length usable.
- **The three-step text-size preference** that scales the root without breaking
  layout.
- **Print-specific rules** kept separate from screen layout, so mobile work
  cannot damage the receipt.

---

## 7. Not tested — do not assume

| Gap | Why it matters |
|---|---|
| Authenticated routes at all nine widths | Registration cards, the 50-row table, receipt stepper, dialogs and the report table have never been rendered in a measured viewport. |
| Real devices (iOS Safari, Android Chrome) | `dvh` units, `position: sticky` under a collapsing URL bar, and `dialog` behaviour differ from headless Chromium. |
| On-screen keyboard | The 194 px header plus a ~300 px keyboard leaves very little space; dialog inputs may be obscured. |
| Browser zoom 200–400% | Approximated by narrow CSS viewports, not by actual zoom, which also affects fixed/sticky positioning. |
| Long content stress | No test with long student names, long item names, or 50-row pages. |
| Landscape phones in staff flows | Only the login page was captured at 812 × 375. |

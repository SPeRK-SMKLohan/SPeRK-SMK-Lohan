# Screenshot index

All images in this index are **real captures taken during this audit on
25 October 2026**, using headless Chromium via Playwright with true CSS viewport
emulation (`Emulation.setDeviceMetricsOverride`, device scale factor 1), not a
resized browser window.

Two baselines were captured:

- **`before/production/`** — the live site `https://sperk-smklohan.pages.dev`
- **`before/repo/`** — the repository build, `main` @ `6c347c7`, served locally

Both are unauthenticated. **No student, staff or administrative record appears in
any image.** The only text typed into any form is the synthetic string
"Cikgu Ujian" and the invalid address "not-an-email"; no credentials were
submitted and no sign-in was attempted.

Full-page captures are the default; files marked *(fold)* are viewport-only.
Image dimensions are the actual PNG dimensions.

---

## 1. Production — public guide `#/panduan`

| File | Viewport | Size | State / observation |
|---|---:|---|---|
| `production/guide-320.png` | 320 × 700 | 320 × 6540 | Full page. No horizontal overflow (measured 0 px). Header stacks to 194 px. |
| `production/guide-375.png` | 375 × 812 | 375 × 5468 | Full page. No overflow. Header 106 px. |
| `production/guide-430.png` | 430 × 932 | 430 × 4817 | Full page. No overflow. |
| `production/guide-600.png` | 600 × 900 | 600 × 3959 | Full page. No overflow; still in the mobile header branch. |
| `production/guide-768.png` | 768 × 1024 | 768 × 3312 | Full page. Header drops to 64 px. |
| `production/guide-1024.png` | 1024 × 768 | 1024 × 2989 | Full page. |
| `production/guide-1280.png` | 1280 × 800 | 1280 × 2851 | Full page. Content capped at 1120 px, centred. |
| `production/guide-1440.png` | 1440 × 900 | 1440 × 2851 | Full page. |
| `production/guide-1920.png` | 1920 × 1080 | 1920 × 2851 | Full page. Wide outer margins; column unchanged. |

## 2. Production — public login `#/login`

| File | Viewport | Size | State / observation |
|---|---:|---|---|
| `production/login-320.png` | 320 × 700 | 320 × 905 | Full page, empty form. No overflow. Card fills width. |
| `production/login-375.png` | 375 × 812 | 375 × 877 | Full page, empty form. No overflow. |
| `production/login-430.png` | 430 × 932 | 430 × 932 | Full page, empty form. |
| `production/login-600.png` | 600 × 900 | 600 × 900 | Full page, empty form. |
| `production/login-768.png` | 768 × 1024 | 768 × 1024 | Full page, empty form. |
| `production/login-1024.png` | 1024 × 768 | 1024 × 855 | Full page, empty form. |
| `production/login-1280.png` | 1280 × 800 | 1280 × 855 | Full page, empty form. |
| `production/login-1440.png` | 1440 × 900 | 1440 × 900 | Full page, empty form. Card 420 × 765 px, centred. |
| `production/login-1920.png` | 1920 × 1080 | 1920 × 1080 | Full page, empty form. |

---

## 3. Repository build — public guide

| File | Viewport | Size | State / observation |
|---|---:|---|---|
| `repo/guide-320.png` | 320 × 700 | 320 × 6540 | Full page. Identical measurements to production (0 px overflow). |
| `repo/guide-375.png` | 375 × 812 | 375 × 5468 | Full page. |
| `repo/guide-430.png` | 430 × 932 | 430 × 4817 | Full page. |
| `repo/guide-600.png` | 600 × 900 | 600 × 3959 | Full page. |
| `repo/guide-768.png` | 768 × 1024 | 768 × 3312 | Full page. |
| `repo/guide-1024.png` | 1024 × 768 | 1024 × 2989 | Full page. |
| `repo/guide-1280.png` | 1280 × 800 | 1280 × 2851 | Full page. |
| `repo/guide-1440.png` | 1440 × 900 | 1440 × 2851 | Full page. |
| `repo/guide-1920.png` | 1920 × 1080 | 1920 × 2851 | Full page. |
| `repo/guide-1440-fold.png` | 1440 × 900 | 1440 × 900 | *(fold)* First screen: header, title, index and first section — legible detail for review. |
| `repo/guide-375-fold.png` | 375 × 812 | 375 × 812 | *(fold)* First screen on a phone: 106 px header, title, index. |
| `repo/guide-320-fold.png` | 320 × 700 | 320 × 700 | *(fold)* First screen at the smallest width: **header occupies 194 px (28% of the viewport)**, stacking brand, size label, select and login link. Evidence for R-01. |
| `repo/guide-textsize-largest-375.png` | 375 × 812 | 375 × 7501 | Full page with **Sangat besar** (root 22 px). No horizontal overflow; document grows to 7,501 px. Evidence for R-02 and A-12. |
| `repo/guide-anchor-after-click-320.png` | 320 × 700 | 320 × 700 | *(fold)* **After tapping "Resit koperasi" in the index.** The heading is completely hidden behind the 194 px header; visible text starts mid-sentence. Evidence for A-01 / R-03 (93 px of heading hidden). |
| `repo/guide-anchor-after-click-375.png` | 375 × 812 | 375 × 812 | *(fold)* Same action at 375 px; the card's top 22 px is under the header, the heading clipped by 5 px. |
| `repo/guide-section-scroll-375.png` | 375 × 812 | 375 × 5468 | Full page after an index jump, showing the resulting scroll position in context. |
| `repo/guide-desktop-1440.png` | 1440 × 900 | 1440 × 2851 | Full page at desktop width; duplicate route/viewport of `guide-1440.png` retained from the interaction run. |

## 4. Repository build — public login

| File | Viewport | Size | State / observation |
|---|---:|---|---|
| `repo/login-320.png` | 320 × 700 | 320 × 905 | Full page, empty form. |
| `repo/login-375.png` | 375 × 812 | 375 × 877 | Full page, empty form. |
| `repo/login-430.png` | 430 × 932 | 430 × 932 | Full page, empty form. |
| `repo/login-600.png` | 600 × 900 | 600 × 900 | Full page, empty form. |
| `repo/login-768.png` | 768 × 1024 | 768 × 1024 | Full page, empty form. |
| `repo/login-1024.png` | 1024 × 768 | 1024 × 855 | Full page, empty form. |
| `repo/login-1280.png` | 1280 × 800 | 1280 × 855 | Full page, empty form. |
| `repo/login-1440.png` | 1440 × 900 | 1440 × 900 | Full page, empty form. |
| `repo/login-1920.png` | 1920 × 1080 | 1920 × 1080 | Full page, empty form. |
| `repo/login-1440-fold.png` | 1440 × 900 | 1440 × 900 | *(fold)* Desktop first screen. |
| `repo/login-375-fold.png` | 375 × 812 | 375 × 812 | *(fold)* Phone first screen. Shows the 217 × 20 px "Buka Panduan Penggunaan" link (A-05). |
| `repo/login-landscape-812x375.png` | 812 × 375 | 812 × 855 | Full page in landscape phone orientation. No overflow; page scrolls. |
| `repo/login-textsize-largest-320.png` | 320 × 700 | 320 × 1087 | Full page with **Sangat besar** at 320 px. Root 22 px, **0 px overflow**; the size select ends ~2 px from the right edge (R-04). |
| `repo/login-validation-empty-375.png` | 375 × 812 | 375 × 877 | **Empty submit.** Native English bubble **"Please fill out this field."** on the teacher-name field, overlapping the helper text. Evidence for A-02. |
| `repo/login-validation-email-375.png` | 375 × 812 | 375 × 877 | **Malformed email submit.** Native English bubble **"Please include an '@' in the email address…"**, overlapping the "Kata laluan" label. Evidence for A-02. |
| `repo/login-skip-link-focus-375.png` | 375 × 812 | 375 × 812 | *(fold)* First Tab reveals the skip link (290 × 52 px, `#17324F`) with a 4 px focus ring. Evidence for A-11. |
| `repo/login-email-focus-375.png` | 375 × 812 | 375 × 812 | *(fold)* Email field focused: 4 px `#005FCC` ring, 2 px offset. |
| `repo/login-password-focus-375.png` | 375 × 812 | 375 × 812 | *(fold)* Tab from email to password: focus ring moves in visual order. Evidence for the measured tab order. |

## 5. Repository build — access gate

| File | Route | Size | Observation |
|---|---|---:|---|
| `repo/protected-redirect-1440.png` | `#/pendaftaran` (unauthenticated) | 1440 × 900 | The requested route redirects to `#/login`; the login card is rendered, no navigation shell or data is present. Same behaviour confirmed by measurement on `#/`, `#/jana-resit`, `#/sejarah`, `#/laporan-koperasi`, `#/import` and `#/barangan`. |

---

## 6. Not captured — and why

Every item below requires an authorised session or a device this audit did not
have. **None was fabricated, mocked or reconstructed from source.**

| Missing | Reason |
|---|---|
| Dashboard, registration, import, receipt entry, history, catalogue, report | Protected by Firebase Auth + `ALLOWED_EMAILS`. No test account was provided; no bypass was attempted. |
| Navigation menu, dropdowns, hamburger, mobile menu open/closed | Only exist inside the authenticated shell. |
| Student create/edit dialog, bulk-delete dialog | Behind the auth gate; opening them would require a live record. |
| Registration table, 50-row paging, status chips, undo toast | Behind the auth gate. |
| Receipt document, print layout, generated PDF | Behind the auth gate; generating one would write data. |
| Loading, empty, error and success states on staff pages | Require an authenticated session, and error states would require forcing failures against production. |
| Screen-reader output, keyboard-only walkthrough, 200–400% zoom | Not performed; no assistive technology was available in this environment. |
| Real-device captures (iOS Safari, Android Chrome) | No physical devices connected. |

---

## 7. Reproducing these captures

Settings used, so a future "after" set is directly comparable:

- Chromium headless (Playwright), **device scale factor 1**, `locale="en-US"`,
  `timezone="Asia/Kuching"`.
- `isMobile`/`hasTouch` enabled only for widths ≤ 430 px.
- Viewports: 320×700, 375×812, 430×932, 600×900, 768×1024, 1024×768, 1280×800,
  1440×900, 1920×1080, plus 812×375 landscape.
- Full-page captures use `captureBeyondViewport` with the document's content
  size; fold captures use the viewport size.
- Wait for `.login-card` / `.guide-content` plus a 1.2 s settle before capture,
  so the SPA has finished restoring auth and painting.
- Screenshots are unretouched PNGs. No annotation, cropping or redaction was
  applied — nothing sensitive appears in them to redact.

An earlier audit pass produced a set of captures using a command-line screenshot
method that did not control the CSS viewport (one nominal 320 px capture was
750 px wide). Those files are no longer in the tree and their conclusions about
horizontal clipping have been withdrawn; see
[README §3](README.md#corrections-to-the-earlier-phase-1-record).

---

## 8. After the reconstruction (Phase 2)

Captured from the reconstructed interface on the same browser settings as the
before set: headless Chromium, device scale factor 1, CSS viewport emulation,
`locale=en-US`, `Asia/Kuching`. Full page unless noted.

Staff screens were rendered against the development fixture server described in
[after-verification.md](after-verification.md) §3 — no production data was used.

All 65 images: **0 px horizontal overflow, 0 console errors, 0 contrast failures,
0 targets below 24 px.** The palette is now corporate blue (`#0F4C81`) with
Atkinson Hyperlegible / Lexend Deca type — see
[design-system-v2.md](design-system-v2.md).

### Public sign-in `#/login`

| File | Size | Observation |
|---|---:|---|
| [`login-1024.png`](after/login-1024.png) | 1024 × 984 | Viewport 1024 px. |
| [`login-1280.png`](after/login-1280.png) | 1280 × 984 | Viewport 1280 px. |
| [`login-1440.png`](after/login-1440.png) | 1440 × 984 | Viewport 1440 px. |
| [`login-1920.png`](after/login-1920.png) | 1920 × 1080 | Viewport 1920 px. |
| [`login-320.png`](after/login-320.png) | 320 × 989 | Viewport 320 px. |
| [`login-375.png`](after/login-375.png) | 375 × 964 | Viewport 375 px. |
| [`login-430.png`](after/login-430.png) | 430 × 939 | Viewport 430 px. |
| [`login-600.png`](after/login-600.png) | 600 × 913 | Viewport 600 px. |
| [`login-768.png`](after/login-768.png) | 768 × 1024 | Viewport 768 px. |
| [`login-error-fields-375.png`](after/login-error-fields-375.png) | 375 × 1090 | Malformed email: field-level Malay message with the expected format. |
| [`login-focus-375.png`](after/login-focus-375.png) | 375 × 964 | Skip link visible on first Tab with a 3 px focus ring. |
| [`login-validation-375.png`](after/login-validation-375.png) | 375 × 1099 | Empty submit: three Malay messages, first invalid field focused, no native bubble. |

### Public guide `#/panduan`

| File | Size | Observation |
|---|---:|---|
| [`guide-1024.png`](after/guide-1024.png) | 1024 × 3622 | Viewport 1024 px. |
| [`guide-1280.png`](after/guide-1280.png) | 1280 × 3418 | Viewport 1280 px. |
| [`guide-1440.png`](after/guide-1440.png) | 1440 × 3418 | Viewport 1440 px. |
| [`guide-1920.png`](after/guide-1920.png) | 1920 × 3418 | Viewport 1920 px. |
| [`guide-320.png`](after/guide-320.png) | 320 × 5862 | Viewport 320 px. |
| [`guide-375.png`](after/guide-375.png) | 375 × 5201 | Viewport 375 px. |
| [`guide-430.png`](after/guide-430.png) | 430 × 4717 | Viewport 430 px. |
| [`guide-600.png`](after/guide-600.png) | 600 × 3854 | Viewport 600 px. |
| [`guide-768.png`](after/guide-768.png) | 768 × 3660 | Viewport 768 px. |

### Home `#/` (signed in)

| File | Size | Observation |
|---|---:|---|
| [`home-1024.png`](after/home-1024.png) | 1024 × 2151 | Viewport 1024 px. |
| [`home-1280.png`](after/home-1280.png) | 1280 × 1692 | Viewport 1280 px. |
| [`home-1440.png`](after/home-1440.png) | 1440 × 1692 | Viewport 1440 px. |
| [`home-1920.png`](after/home-1920.png) | 1920 × 1692 | Viewport 1920 px. |
| [`home-320.png`](after/home-320.png) | 320 × 3093 | Viewport 320 px. |
| [`home-375.png`](after/home-375.png) | 375 × 2700 | Viewport 375 px. |
| [`home-430.png`](after/home-430.png) | 430 × 2565 | Viewport 430 px. |
| [`home-600.png`](after/home-600.png) | 600 × 2342 | Viewport 600 px. |
| [`home-768.png`](after/home-768.png) | 768 × 2211 | Viewport 768 px. |

### Registration `#/pendaftaran`

| File | Size | Observation |
|---|---:|---|
| [`registration-1024.png`](after/registration-1024.png) | 1024 × 2111 | Viewport 1024 px. |
| [`registration-1280.png`](after/registration-1280.png) | 1280 × 2017 | Viewport 1280 px. |
| [`registration-1440.png`](after/registration-1440.png) | 1440 × 2017 | Viewport 1440 px. |
| [`registration-1920.png`](after/registration-1920.png) | 1920 × 2017 | Viewport 1920 px. |
| [`registration-320.png`](after/registration-320.png) | 320 × 4094 | Viewport 320 px. |
| [`registration-375.png`](after/registration-375.png) | 375 × 3911 | Viewport 375 px. |
| [`registration-430.png`](after/registration-430.png) | 430 × 3249 | Viewport 430 px. |
| [`registration-600.png`](after/registration-600.png) | 600 × 2866 | Viewport 600 px. |
| [`registration-768.png`](after/registration-768.png) | 768 × 2435 | Viewport 768 px. |
| [`registration-dialog-1440.png`](after/registration-dialog-1440.png) | 1440 × 900 | Student dialog: choice tiles, sticky footer, Escape returns focus to the trigger. |
| [`registration-dialog-errors-1440.png`](after/registration-dialog-errors-1440.png) | 1440 × 900 | Dialog validation in Malay with aria-invalid on the failing fields. |
| [`registration-marked-375.png`](after/registration-marked-375.png) | 375 × 812 | After Tanda daftar: persistent banner naming the child and time, with Buat asal and the 12-second window stated. |
| [`registration-select-375.png`](after/registration-select-375.png) | 375 × 812 | Administrator selection mode: checkboxes revealed, bulk bar shown. |

### Receipt entry `#/jana-resit` and saved receipt `#/resit/:id`

| File | Size | Observation |
|---|---:|---|
| [`receipt-1440.png`](after/receipt-1440.png) | 1440 × 900 | Viewport 1440 px. |
| [`receipt-320.png`](after/receipt-320.png) | 320 × 1019 | Viewport 320 px. |
| [`receipt-375.png`](after/receipt-375.png) | 375 × 960 | Viewport 375 px. |
| [`receipt-768.png`](after/receipt-768.png) | 768 × 1024 | Viewport 768 px. |
| [`receipt-ready-1440.png`](after/receipt-ready-1440.png) | 1440 × 900 | Four sections on one page; the bar stays visible. |
| [`receipt-ready-375.png`](after/receipt-ready-375.png) | 375 × 812 | Pinned total bar with the running amount and the save action. |
| [`receipt-saved-1440.png`](after/receipt-saved-1440.png) | 1440 × 1031 | Saved receipt with print, PDF and sharing beside the document. |
| [`receipt-saved-375.png`](after/receipt-saved-375.png) | 375 × 2003 | Saved receipt on a phone. |

> **Note:** the dedicated `Sejarah Resit` (`/sejarah`) page was removed in the
> follow-up revision. Receipts are now searched from the **Laporan** page
> (below), which has a search field, four totals and a CSV export.

### Cooperative report `#/laporan-koperasi`

| File | Size | Observation |
|---|---:|---|
| [`report-1440.png`](after/report-1440.png) | 1440 × 1360 | Viewport 1440 px. |
| [`report-320.png`](after/report-320.png) | 320 × 2707 | Viewport 320 px. |
| [`report-375.png`](after/report-375.png) | 375 × 2644 | Viewport 375 px. |
| [`report-768.png`](after/report-768.png) | 768 × 1830 | Viewport 768 px. |

### Catalogue `#/barangan`

| File | Size | Observation |
|---|---:|---|
| [`items-1440.png`](after/items-1440.png) | 1440 × 1119 | Viewport 1440 px. |
| [`items-320.png`](after/items-320.png) | 320 × 1633 | Viewport 320 px. |
| [`items-375.png`](after/items-375.png) | 375 × 1549 | Viewport 375 px. |
| [`items-768.png`](after/items-768.png) | 768 × 1145 | Viewport 768 px. |

### Import `#/import`

| File | Size | Observation |
|---|---:|---|
| [`import-1440.png`](after/import-1440.png) | 1440 × 900 | Viewport 1440 px. |
| [`import-320.png`](after/import-320.png) | 320 × 1547 | Viewport 320 px. |
| [`import-375.png`](after/import-375.png) | 375 × 1354 | Viewport 375 px. |
| [`import-768.png`](after/import-768.png) | 768 × 1117 | Viewport 768 px. |

### Navigation

| File | Size | Observation |
|---|---:|---|
| [`menu-open-375.png`](after/menu-open-375.png) | 375 × 812 | Full-screen menu, three labelled groups, 64 px rows, label changed to Tutup. |

### Empty state

| File | Size | Observation |
|---|---:|---|
| [`state-empty-375.png`](after/state-empty-375.png) | 375 × 3911 | Empty school: explanatory empty state with an import route. |

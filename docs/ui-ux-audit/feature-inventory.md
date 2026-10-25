# Feature inventory and route map

Inventory of everything the application can currently do, verified against the
repository at `main` @ `6c347c7` (102 tracked files) and against the live public
site. This table is the **feature-preservation checklist** for Phase 2: every row
in the "Redesign constraints" column must remain true after any change.

> **Phase 2 note.** This inventory is the requirement set the reconstruction was
> built against. Every ID below still exists; their new locations and the
> verification performed on each are tabulated in
> [after-verification.md](after-verification.md) §5. Routes and API contracts are
> unchanged.

## Verification levels used

| Level | Meaning |
|---|---|
| **Live** | Rendered and measured in a real browser during this audit (public routes only). |
| **Source** | Code paths, markup and API contracts inspected; never rendered in an authenticated session. |
| **Not run** | A destructive or write action that was deliberately not executed. |

**Access note.** Seven protected routes were probed without credentials and every
one redirected to `#/login`, confirming the gate. No authenticated page was
rendered at any point in this audit.

---

## 1. Routes

Hash-based routing in `frontend/src/main.js`. Except `#/login` and `#/panduan`,
all routes require a Firebase session **and** an email present in the Worker's
`ALLOWED_EMAILS`.

| Route | Access | Purpose | Status |
|---|---|---|---|
| `#/login` | Public | Email/password sign-in plus device-local teacher name | **Live** |
| `#/panduan` | Public and signed-in | Malay help guide | **Live** |
| `#/` | Protected | Dashboard totals, module shortcuts, recent receipts | Source |
| `#/pendaftaran` | Protected | School-first T1 attendance and student maintenance | Source |
| `#/import` | Protected | Excel template download, validation preview, import | Source |
| `#/jana-resit` | Protected | Student → items → payment → review → save | Source |
| `#/jana-resit?student=<id>` | Protected | Same flow with the student pre-selected | Source |
| `#/barangan` | Protected | Read-only item catalogue | Source |
| `#/sejarah` | Protected | Receipt search, date filters, links to detail | Source |
| `#/laporan-koperasi` | Protected | Date/payment-filtered report, CSV, print | Source |
| `#/resit/<id>` | Protected | Saved receipt, print, PDF, WhatsApp share | Source |
| `#/murid`, `#/e-daftar`, `#/e-resit` | Redirect | Legacy paths → `/pendaftaran` or `/jana-resit` | Source |
| Any unknown hash | Depends on auth | "Halaman tidak dijumpai" + return link | Source |

Navigation groups: **Utama**, **e-Daftar** (Pendaftaran, Import Data),
**e-Resit** (Jana Resit, Barangan, Sejarah Resit, Laporan Koperasi), **Panduan**.
Two dropdowns plus a hamburger toggle at ≤1080 px.

---

## 2. Feature inventory

| ID | Feature | Page / route | Purpose | User workflow | Components | Dependencies | Status | Redesign constraints |
|---|---|---|---|---|---|---|---|---|
| F-01 | Sign in | `#/login` | Authenticate an approved staff account | Enter email, password, teacher name → submit → `/api/me` allowlist check → `#/` | `pages/login.js`, `shared/auth.js`, `shared/staff-name.js` | Firebase Auth, `/api/me` | **Live** (rendered); sign-in not attempted | Do not change credential rules, allowlist or persistence. Teacher name stays device-local. |
| F-02 | Text-size preference | Login, guide, app shell | Scale all text for readability | Choose Biasa / Besar / Sangat besar; persisted | `shared/accessibility.js`, `style.css` | `localStorage` keys `sperk-text-size`, legacy `sperk-large-text` | **Live**, measured 18/20/22 px | Preserve the three options, their storage keys and the legacy migration. |
| F-03 | Public help guide | `#/panduan` | Teach the six core tasks before/after sign-in | Read sections; use index to jump | `pages/guide.js` | Hash routing, CSS | **Live** | Must stay public and reachable from login. Fix A-01 without removing the index. |
| F-04 | Main navigation and sign-out | All signed-in pages | Move between modules; sign out explicitly | Click/tap grouped links; dropdowns open on click, hover or focus; hamburger ≤1080 px | `main.js`, `style.css`, `shared/auth.js` | Firebase Auth | Source | Keep every destination reachable by keyboard and touch; dropdowns must close on Escape and outside click. |
| F-05 | Dashboard totals | `#/` | Show registration and cooperative state at a glance | Read four stat cards, today's receipt count and total | `pages/dashboard.js`, `worker/src/dashboard.js` | `/api/dashboard`, Firestore, 30 s cache | Source | Preserve metric definitions, Malaysia-time day boundary and the 30 s cache. |
| F-06 | Dashboard shortcuts and recent receipts | `#/` | Jump into the two main flows; open recent receipts | Click module card or receipt number | `pages/dashboard.js` | `/api/dashboard` | Source | Preserve links and receipt identity; never expose IC. |
| F-07 | School-first registration | `#/pendaftaran` | Work one primary school at a time on registration day | Pick school (remembered) → see per-school counters | `features/e-daftar/page.js`, `constants.js` | `/api/students`, `localStorage` school key | Source | School must remain the first, primary filter; T1-only enforcement intact. |
| F-08 | Search, status filter and paging | `#/pendaftaran` | Find a student quickly among hundreds | Type name or ≥2 IC digits; filter status; page 50 rows; refresh; auto-refresh 30 s | `features/e-daftar/page.js`, `api.js` | Worker student cache | Source | Preserve debounce, stale-response guard, error state that keeps school/search, and 50-row paging. |
| F-09 | Mark / unmark registration with undo | `#/pendaftaran` | Record attendance in one tap | Tap **Tanda daftar** → optimistic update → toast with **Buat asal** (12 s); reverse asks for confirmation | `features/e-daftar/page.js`, `shared/toast.js` | `POST /api/students/:id/status` | Source | Preserve optimism, the 12 s undo window, the confirmation on reversal, and server-authoritative status. |
| F-10 | Student create / edit | Registration dialog | Correct or add a record | Open dialog → fill school, name, 12-digit IC, OKU, status, optional transfer → save | `features/e-daftar/page.js`, `constants.js` | `POST`/`PUT /api/students` | Source | Preserve field rules, masked IC, the fixed school list, transfer reasons and their auto-filled notes. |
| F-11 | Student deletion (single and bulk) | Registration row + bulk dialog | Remove wrong or duplicate records | Select rows → "Tindakan pentadbir" → re-enter password → delete | `features/e-daftar/page.js`, `shared/auth.js` | Firebase re-authentication, `DELETE /api/students/bulk` | **Not run** | Permanent deletion must stay behind the password gate and the disclosure. Never make it a one-tap action. |
| F-12 | Excel template download | `#/import` | Give staff a correctly-shaped workbook | Click **Muat turun templat** → `templat-murid.xlsx` with "Murid" + "Panduan" sheets | `features/e-daftar/excel.js` | `xlsx` (SheetJS 0.20.3) | Source | Preserve column aliases, required-column set and the guide sheet. |
| F-13 | Import preview and commit | `#/import` | Load the roster before registration day | Choose `.xlsx` → local parse → server dry-run → review valid/invalid/duplicate → confirm | `import-page.js`, `excel.js`, `api.js` | `/api/students/import`, Firestore | Source | Keep the dry-run before writes, duplicate-skip semantics, 2 MB / 2,000-row caps and the partial-failure message. |
| F-14 | Receipt staff-name setup | `#/jana-resit` | Attribute receipts to the teacher at this device | If no device name, enter and save it before receipt work | `features/e-resit/page.js`, `shared/staff-name.js` | `localStorage` | Source | Name stays per device, not per account. Do not sync it across devices. |
| F-15 | Student selection for a receipt | `#/jana-resit` | Attach the receipt to the right student | Search name/IC → pick from ≤8 results showing masked IC + primary school | `features/e-resit/page.js` | `/api/students` | Source | Preserve T1-only, masked IC, school context and the retry on failure. |
| F-16 | Item selection and quantities | `#/jana-resit` | Build the receipt lines | Load catalogue → stepper 1–99 or fixed quantity → add/remove lines | `features/e-resit/page.js` | `/api/items` | Source | Server remains the price authority; fixed-quantity items must stay locked. |
| F-17 | Payment and receipt save | `#/jana-resit` | Record cash or bank transfer and issue the receipt | Choose method → enter reference if transfer → tick confirmation → save | `features/e-resit/page.js`, `constants.js` | `POST /api/receipts`, client UUID | Source | Preserve the explicit confirmation gate, the idempotency request ID and the single-attempt write. |
| F-18 | Saved receipt actions | `#/resit/<id>` | Give the parent a document | Open → print, download PDF, or open WhatsApp with a prepared message | `receipt-page.js`, `receipt-view.js`, `pdf.js` | `/api/receipts/:id`, jsPDF, Web Share | Source | Receipt is a formal document: preserve totals, print/PDF fidelity and IC exclusion from WhatsApp text. |
| F-19 | Receipt history | `#/sejarah` | Find and reprint an earlier receipt | Search number/name, filter dates, open detail | `history-page.js` | `/api/receipts` | Source | Preserve the 100-row cap and truncation notice; keep filters on error. |
| F-20 | Item catalogue | `#/barangan` | Show approved prices | Read-only list of items, prices, fixed/variable quantity, active state | `items-page.js` | `/api/items` | Source | Stays read-only unless the school explicitly asks for editing. |
| F-21 | Cooperative report | `#/laporan-koperasi` | Reconcile sales for a period | Choose dates and payment type → read totals → export CSV or print | `report-page.js` | `/api/receipts`, browser CSV/print | Source | Preserve totals, the 500-row limit notice and CSV formula-escaping. |
| F-22 | API authentication and authorisation | All `/api/*` | Ensure only approved staff reach data | Firebase ID token → Worker verifies signature, issuer, audience, then email allowlist | `shared/api.js`, `worker/src/index.js` | Google JWKS, `ALLOWED_EMAILS` | Source | No permission bypass, no direct browser→Firestore path, no secrets in the bundle. |
| F-23 | Read retry, dedupe and timeout | All data pages | Survive flaky school Wi-Fi | Identical in-flight GETs share one request; retryable status retried once; 15 s timeout; writes never retried | `shared/api.js` | `AbortController` | Source | Keep writes single-attempt; keep the read-only nature of retries. |
| F-24 | Student and dashboard caches | Worker | Keep 30–40 devices fast on registration day | Full load once, then delta sync by `updatedAt`; single writes merged into cache; invalidation on import/delete | `worker/src/shared/students.js`, `dashboard.js` | Cloudflare Cache API | Source | Data freshness and invalidation must be preserved; never cache across users in a way that leaks records. |
| F-25 | Legacy route handling | Old hashes | Keep old bookmarks working | `/murid`, `/e-daftar`, `/e-resit` redirect | `main.js` | Hash routing | Source | Keep the redirects. |

---

## 3. Backend endpoints

All `/api/*` except `/api/health` require a valid Firebase ID token **and** an
allowlisted email.

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Public liveness probe |
| GET | `/api/me` | Echo uid/email after authorisation |
| GET | `/api/dashboard` | Aggregated totals + 5 recent receipts |
| GET | `/api/students` | List/search with `q`, `school`, `tingkatan`, `status`, `offset`, `limit` |
| POST | `/api/students` | Create (409 on duplicate IC) |
| GET | `/api/students/:id` | Single student (full IC; UI masks it) |
| PUT | `/api/students/:id` | Update with field mask |
| DELETE | `/api/students/:id` | Permanent delete |
| DELETE | `/api/students/bulk` | Permanent bulk delete, max 200 |
| POST | `/api/students/:id/status` | Fast attendance toggle |
| POST | `/api/students/import` | Dry-run or commit import, max 2,000 rows |
| GET | `/api/items` | Item catalogue |
| GET | `/api/receipts` | List with `q`, `from`, `to`, `limit`, `includeItems` |
| POST | `/api/receipts` | Create (idempotent on `requestId`) |
| GET | `/api/receipts/:id` | Receipt detail |

---

## 4. Data model (Firestore)

| Collection | Key fields | Notes |
|---|---|---|
| `students` | `name`, `icNumber`, `formerPrimarySchool`, `tingkatan`, `oku`, `registrationStatus`, `registeredAt`, `registeredBy`, `transferSchool/Reason/Notes`, `koperasiMember`, `active`, `createdAt`, `updatedAt` | Random UUID document IDs — IC never appears in an ID or URL. Soft flag `active` plus hard delete. |
| `receipts` | `receiptNo`, `year`, `studentId`, `studentNameSnapshot`, `formerPrimarySchoolSnapshot`, `items[]`, `totalSen`, `paymentMethod`, `staffName`, `bankRef`, `status`, `createdAt`, `createdByAccountId`, `requestId` | Document ID **is** the client `requestId` → idempotent create. Name/school are snapshots. |
| `items` | `name`, `priceSen`, `active`, `fixedQuantity`, `sortOrder`, `koperasiMembership` | Prices live here only. |
| `counters` | `receipts-<year>`, `daily-<YYYY-MM-DD>` | Per-year receipt sequence and per-day count/total. |
| `imports` | `createdAt`, `createdByAccountId`, `imported`, `skipped` | Audit trail for bulk imports. |

Money is stored as integer **sen** throughout; no floats.

---

## 5. Source map

| Area | Files | Responsibility |
|---|---|---|
| Route table / shell | `frontend/src/main.js` | Hash routes, auth gate, navigation, public guide shell, boot |
| Global styles | `frontend/src/style.css` (951 lines) | Tokens, components, print, breakpoints, reduced-motion, forced-colors |
| Auth / API | `shared/auth.js`, `firebase.js`, `api.js` | Firebase session, token refresh, authenticated fetch with retry/dedupe |
| Shared UI | `shared/dom.js`, `money.js`, `toast.js`, `feedback.js`, `accessibility.js`, `staff-name.js`, `id.js`, `koperasi.js`, `config.js` | Escaping, formatting, toast, loading/error blocks, text size, device name, UUID, receipt identity |
| e-Daftar (client) | `features/e-daftar/page.js` (765), `import-page.js`, `excel.js`, `api.js`, `constants.js` | Registration UI, import UI, XLSX parsing, endpoints, schools/reasons |
| e-Resit (client) | `features/e-resit/page.js` (440), `receipt-page.js`, `receipt-view.js`, `history-page.js`, `items-page.js`, `report-page.js`, `pdf.js`, `api.js`, `constants.js`, `config.js` | Receipt flow, document, history, catalogue, report, PDF |
| Worker entry | `worker/src/index.js` | CORS, JWT verification, allowlist, routing, error mapping |
| Worker data | `firestore.js`, `util.js`, `shared/students.js` | Firestore REST client, service-account JWT, validation helpers, student cache |
| Worker features | `features/e-daftar/*`, `features/e-resit/*`, `dashboard.js` | Business rules, import, receipts, aggregates |
| Build / deploy | `frontend/package.json`, `index.html`, `wrangler.toml`; `worker/package.json`, `wrangler.toml` | Vite 8, Firebase 13, jsPDF 4, SheetJS 0.20.3; Pages + Worker config |
| Docs | `docs/Panduan_Pengguna_SPeRK.md`, `docs/Panduan_Teknikal_SPeRK.md` | Staff guide, technical/operations guide |

---

## 6. Testing infrastructure

**None.** `frontend/package.json` exposes only `dev`, `build` and `preview`;
`worker/package.json` only `dev`. There is no test runner, no linter, no
accessibility tooling, no CI configuration and no browser automation in the
repository. The repository's only quality gates are `npm run build` and manual
deployment checks.

This is worth stating plainly because it shapes Phase 2: **there is no automated
safety net for a redesign.** Any structural change to shared components
(`.card`, `.table`, `.btn`, `.input`) is unguarded, and the feature list above is
the only checklist that exists.

---

## 7. Features that do **not** exist

Recorded so they are not assumed during redesign:

- No student edit/delete from the receipt flow; no receipt edit or void.
- No receipt reprint counter, no duplicate-receipt detection by content (only by
  `requestId`).
- No item price editing, stock, or sales-by-item reporting in the UI.
- No user management, roles, or per-role permissions — authorisation is a flat
  email allowlist.
- No password reset flow in the app; staff must contact an administrator.
- No offline mode or local queue; every write needs the network.
- No audit log UI; `imports` and `createdByAccountId` are stored but not shown.
- No export of the student list (import only).
- No multi-year handling in the UI; receipts are numbered per year, but the
  registration flow assumes a single intake.

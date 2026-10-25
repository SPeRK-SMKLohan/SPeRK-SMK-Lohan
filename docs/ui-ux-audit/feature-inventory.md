# Feature inventory and route map

## Routes

The app uses hash routing (`frontend/src/main.js`): route paths appear after
`#`. Except for sign-in and the public guide, a logged-in Firebase user and a
Worker-authorised email are required.

| Route | Access | Page / purpose | Evidence |
|---|---|---|---|
| `#/login` | Public | Email/password sign-in and device-local teacher name | Source + live screenshot |
| `#/panduan` | Public and signed-in | Malay help guide; links back to app | Source + live screenshot |
| `#/` | Protected | Dashboard totals, shortcuts and recent receipts | Source only |
| `#/pendaftaran` | Protected | School-first T1 attendance, search, status and student maintenance | Source only |
| `#/import` | Protected | Excel template, validation preview and import | Source only |
| `#/jana-resit` | Protected | Student lookup, items, payment confirmation and receipt creation | Source only |
| `#/jana-resit?student=<id>` | Protected | Same receipt flow, preselected student when a valid ID is supplied | Source only |
| `#/barangan` | Protected | Read-only cooperative catalogue | Source only |
| `#/sejarah` | Protected | Receipt search, date filters and links to receipt details | Source only |
| `#/laporan-koperasi` | Protected | Date/payment-filtered cooperative report, CSV and print | Source only |
| `#/resit/<id>` | Protected | Saved receipt, print/PDF and WhatsApp sharing | Source only |
| `#/murid`, `#/e-daftar`, `#/e-resit` | Redirect | Legacy paths redirect to current registration or receipt page | Source only |
| Any unknown hash path | Depends on authentication | Not-found message and return link | Source only |

Navigation groups are **Utama**, **e-Daftar** (Pendaftaran, Import Data),
**e-Resit** (Jana Resit, Barangan, Sejarah Resit, Laporan Koperasi), and
**Panduan**. On narrower widths a button opens the navigation; dropdowns are
click/touch operable and advertise expanded state.

## Feature inventory

“Source-verified” means code paths and control markup were inspected. It does
not mean a live authenticated interaction was performed. “Partially verified”
means a public screenshot corroborates only part of the interface.

| ID | Feature name | Page or route | Purpose and user workflow | Related components | Dependencies | Current status | Redesign constraints |
|---|---|---|---|---|---|---|---|
| F-01 | Sign in | `#/login` | Enter authorised email/password and teacher name; submit; display an error on failure | `pages/login.js`, `shared/auth.js`, `shared/staff-name.js` | Firebase Auth; `/api/me` | Partially verified: public page; no sign-in attempted | Do not alter account allowlist, persistence or credential rules; teacher name is device-local |
| F-02 | Text-size preference | Login, public guide, signed-in shell | Choose Biasa/Besar/Sangat besar; save preference locally | `shared/accessibility.js`, `main.js`, page templates | localStorage, CSS root scaling | Source-verified; controls visible in public captures | Preserve saved values and old `sperk-large-text` migration behavior |
| F-03 | Public user guide | `#/panduan` | Navigate section index to login, registration, import, receipt, report or troubleshooting instructions | `pages/guide.js`, `main.js` | Hash navigation; CSS | Partially verified: live guide | Preserve public availability and T1 guidance; resolve narrow width clipping |
| F-04 | Main navigation and sign out | All signed-in pages | Navigate grouped feature links; open/close mobile menu/dropdowns; explicitly sign out | `main.js`, `style.css`, `shared/auth.js` | Firebase Auth; browser history | Source-verified; authenticated menu not photographed | Keep all destinations reachable by keyboard and touch; close menus predictably |
| F-05 | Dashboard totals | `#/` | Review active T1 counts, registration counts, today's receipts and cooperative members | `pages/dashboard.js`, `worker/src/dashboard.js` | `/api/dashboard`, Firestore students/receipts/counters, 30s dashboard cache | Source-verified; no live data or empty-state capture | Preserve definitions, timezone logic, aggregate totals and access checks |
| F-06 | Dashboard shortcuts and recent receipts | `#/` | Open registration/receipt flows and view recent receipt details | `pages/dashboard.js` | `/api/dashboard`, receipt details route | Source-verified | Preserve links and receipt identity; avoid exposing IC data |
| F-07 | School-first T1 registration | `#/pendaftaran` | Select primary school (remembered per browser), then search and inspect matching student rows and school counts | `features/e-daftar/page.js`, `constants.js`, `api.js` | `/api/students`; localStorage school preference | Source-verified; no staff-page capture | School remains first/primary filter; T1-only enforcement must remain intact |
| F-08 | Registration search, filters and paging | `#/pendaftaran` | Search by name/IC; clear query; filter status; page 50 rows; refresh or retry | `features/e-daftar/page.js`, `api.js` | Worker student listing/cache; 30s polling | Source-verified | Preserve search/school on errors, empty-vs-error distinction, no accidental status action |
| F-09 | Mark/unmark registration with undo | `#/pendaftaran` | Mark attendance, receive toast, undo within 12 seconds; unmark asks for confirmation | `features/e-daftar/page.js`, `shared/toast.js` | `POST /api/students/:id/status` | Source-verified | Preserve confirmation, server-authoritative status and undo behavior |
| F-10 | Student create/edit | Registration dialog | Enter school, name, IC, T1, OKU, attendance and optional transfer request; save/clear/close | `features/e-daftar/page.js`, `constants.js` | Student create/update API, validation | Source-verified | Preserve field rules, masked IC display, school/reason options, transfer details |
| F-11 | Student deletion | Registration row and bulk dialog | Delete one or selected records after password reauthentication; bulk cap is 200 IDs | `features/e-daftar/page.js`, `shared/auth.js`, Worker students | Firebase reauthentication; DELETE endpoints; Firestore | Source-verified; not executed | Destructive permanent action and password gate must remain explicit and separate |
| F-12 | Excel import template | `#/import` | Download `.xlsx` template for required/optional columns | `import-page.js`, `excel.js` | `xlsx` package in frontend | Source-verified | Preserve accepted column aliases, T1-only rules and limits |
| F-13 | Import preview and commit | `#/import` | Select workbook, parse locally, ask API for dry-run, review invalid/duplicate rows, confirm valid rows | `import-page.js`, `excel.js`, `api.js` | XLSX parser; `/api/students/import`; Firestore | Source-verified; no upload performed | Keep dry-run before writes, duplicate skip semantics, row/file caps, safe retry handling |
| F-14 | Receipt staff-name setup | `#/jana-resit` | If absent, enter and save teacher name on this device before receipt work | `features/e-resit/page.js`, `shared/staff-name.js` | localStorage; receipt API payload | Source-verified | Name remains per device, not shared across account; no cross-device synchronization |
| F-15 | Student selection | `#/jana-resit` | Search name/IC, retry failures, choose the correct result; selected identity shows masked IC and primary school | `features/e-resit/page.js` | `/api/students` search | Source-verified | Preserve T1-only, identity checks, masked IC and selected-school context |
| F-16 | Item selection and quantities | `#/jana-resit` | Load active catalogue, choose quantities (1–99), add/remove or change receipt lines | `features/e-resit/page.js`, `items-page.js` | `/api/items`, server-side pricing | Source-verified | Server remains price authority; fixed-quantity items and item variants stay correct |
| F-17 | Payment and receipt confirmation | `#/jana-resit` | Choose cash or bank transfer, enter transfer reference as required, confirm payment and save | `features/e-resit/page.js`, `constants.js` | `/api/receipts` POST; idempotency request ID | Source-verified | Preserve confirmation, validation, duplicate protection and busy state |
| F-18 | Saved receipt actions | `#/resit/<id>` | Read saved receipt, print, download PDF, open WhatsApp and optionally share a PDF | `receipt-page.js`, `receipt-view.js`, `pdf.js` | `/api/receipts/:id`, jsPDF, browser print/share, WhatsApp URL | Source-verified | Receipt is a formal document; preserve data, totals, print/PDF fidelity and IC privacy |
| F-19 | Receipt history | `#/sejarah` | Search by receipt number/student, date filter, open a receipt; shows up to 100 latest results | `history-page.js` | `/api/receipts` | Source-verified | Preserve date/search semantics and result limit; address missing visible retry on error |
| F-20 | Item catalogue | `#/barangan` | Read active/inactive items, prices and fixed/variable quantity rules | `items-page.js` | `/api/items` | Source-verified | Keep as read-only list unless explicitly authorised to add editing |
| F-21 | Cooperative report | `#/laporan-koperasi` | Filter date range and payment method, review totals/rows, export CSV or print | `report-page.js` | `/api/receipts`, browser CSV/print | Source-verified | Preserve totals, filtering, 500-row limit notice and safe CSV-cell escaping |
| F-22 | API authentication and permissions | All protected API calls | Get Firebase ID token; Worker verifies signature/project/email allowlist before data access | `shared/auth.js`, `shared/api.js`, `worker/src/index.js` | Firebase Auth, Google JWKS, `ALLOWED_EMAILS` | Source-verified only | No permissions bypass; no secrets or personal data in audit/release artifacts |
| F-23 | API read retry and loading timeout | Data pages | Coalesce same in-flight GETs, retry retryable status/network failures once, timeout at 15s | `shared/api.js` | Fetch/AbortController, Worker API | Source-verified only | Keep writes single-attempt/idempotency; UX should explain failures consistently |
| F-24 | Worker student/dashboard caches | API | Delta-sync student collection; cache dashboard aggregates for 30s; invalidate/merge after writes | `worker/src/shared/students.js`, `dashboard.js`, feature handlers | Cloudflare Cache API, Firestore | Source-verified from source, not load-tested | Cache is performance mechanism; data freshness/invalidation must be preserved |
| F-25 | Not-found and legacy route handling | Unknown route / old hashes | Show return-to-home link or redirect legacy path | `main.js` | Hash routing | Source-verified | Preserve compatibility with old bookmarks |

## Backend endpoint inventory

The Worker exposes public `GET /api/health`; other `/api/*` routes authenticate
before returning data. Source-defined endpoints include `/api/me`,
`/api/dashboard`, student list/create/read/update/delete/status/bulk-delete,
student import, item list, receipt list/create/read. There is no direct browser
connection to Firestore. Deletion is permanent. Receipt pricing and totals are
validated/calculated by the Worker. See `worker/src/index.js` and the feature
handlers for exact request contracts.

## Main source map

| Area | Files and responsibility |
|---|---|
| Route table/shell | `frontend/src/main.js` — hash routes, access gate, navigation, public guide, boot/auth state |
| Global visual system | `frontend/src/style.css` — tokens, controls, print rules and breakpoints |
| Auth/API | `frontend/src/shared/auth.js`, `firebase.js`, `api.js` — Firebase session and authenticated fetches |
| Accessibility | `frontend/src/shared/accessibility.js`, `toast.js` — text scaling and feedback message |
| Registration | `frontend/src/features/e-daftar/page.js`, `excel.js`, `import-page.js`, `api.js`, `constants.js` |
| Cooperative receipts | `frontend/src/features/e-resit/page.js`, `receipt-page.js`, `receipt-view.js`, `history-page.js`, `items-page.js`, `report-page.js`, `pdf.js`, `api.js` |
| Shared dashboard | `frontend/src/pages/dashboard.js`; server aggregation in `worker/src/dashboard.js` |
| API routes/auth | `worker/src/index.js`, `util.js`, `firestore.js` |
| Data rules/cache | `worker/src/features/e-daftar/*`, `worker/src/features/e-resit/*`, `worker/src/shared/students.js` |
| Build/runtime | `frontend/package.json`, `frontend/index.html`, `frontend/wrangler.toml`, `worker/package.json`, `worker/wrangler.toml` |

The package manifest shows Vite 8, Firebase 13, jsPDF 4 and SheetJS 0.20.3.
The client is plain JavaScript ES modules with hash-based routing; backend is
Cloudflare Workers using `jose` and Firestore REST. The repository has no
declared frontend test/lint/a11y scripts or test framework.

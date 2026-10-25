# Existing staff workflows

> **Phase 1 record.** This document describes the interface *before* the
> reconstruction and is kept as the baseline. The current system is documented in
> [before-after-comparison.md](before-after-comparison.md) and the measured results in
> [after-verification.md](after-verification.md).

Traced through the actual handlers, templates and API calls in the repository.
**Only W-01 (sign-in) was rendered in a browser**, and only as far as the form —
no credentials were submitted. All other workflows are source-verified and have
never been completed by a real user in this audit.

Each workflow ends with the questions that matter for staff with limited digital
confidence: *how do I know it worked, and what do I do if it didn't?*

---

## W-01 — Sign in

| | |
|---|---|
| **Start** | `#/login` (any protected URL redirects here) |
| **Steps** | 1. Enter school email. 2. Enter password. 3. Enter teacher name. 4. Press **Log Masuk**. |
| **Information** | Approved email + password; teacher name (2–80 characters). |
| **Confirmation** | Button changes to "Sedang log masuk…" and disables. On success the app navigates to `#/`. |
| **Expected outcome** | Signed in; teacher name saved to this device only. |
| **Errors** | Wrong credentials → "E-mel atau kata laluan tidak betul." (deliberately does not say which). Not allowlisted → "Akaun ini tidak dibenarkan menggunakan sistem." No network → "Tiada sambungan rangkaian." Too many attempts → "Terlalu banyak percubaan…" |
| **Recovery** | Retry; contact administrator for allowlist or password reset (no self-service reset exists). |
| **Confusion points** | **(a)** Native English validation bubbles appear for an empty or malformed email before any Malay message (A-02) — verified. **(b)** The third field, "Nama guru", looks like a credential; its explanation sits *below* the field. **(c)** Nothing on the page tells the user who to contact when sign-in fails. **(d)** After 5 s the app proceeds even if auth never resolved, so a blocked Firebase looks like "you are signed out". |

---

## W-02 — Check the dashboard

| | |
|---|---|
| **Start** | `#/` after sign-in |
| **Steps** | 1. Read the four counters (Belum daftar / Sudah daftar / Didaftarkan hari ini / Keahlian koperasi). 2. Read today's receipt count and total. 3. Scan the five most recent receipts. 4. Use a module card to enter a flow. |
| **Information** | None entered. |
| **Confirmation** | Counters render; if the read fails, a retry panel replaces them. |
| **Expected outcome** | A truthful snapshot, refreshed at most every 30 s (server cache). |
| **Errors** | API unreachable → retry panel. |
| **Recovery** | Press retry; the panel re-requests. |
| **Confusion points** | **(a)** A 30 s cached value can disagree with what a colleague just did on another device — nothing on screen says the data is cached or how old it is. **(b)** Zero counts and "not loaded yet" can look identical to a first-time user. **(c)** "Keahlian koperasi" is not explained anywhere on this page. |

---

## W-03 — Register a student (the core task)

| | |
|---|---|
| **Start** | `#/pendaftaran` |
| **Steps** | 1. Choose a primary school (remembered on this device). 2. Read the per-school counters. 3. Search by name or ≥2 IC digits. 4. Confirm name, masked IC and school. 5. Press **Tanda daftar**. 6. Read the toast. |
| **Information** | School; name or partial IC. |
| **Confirmation** | Row flips to "✓ Sudah daftar" immediately (optimistic), then the server's real timestamp appears; a toast confirms with an **Buat asal** action for 12 s. |
| **Expected outcome** | Status `SUDAH`, `registeredAt`/`registeredBy` recorded once, counters update. |
| **Errors** | No data imported → explanatory empty state with an import link. No match → offers "Daftar '…' sebagai murid baharu". Network failure → row reverts and a red toast appears. |
| **Recovery** | Retry the tap; undo within 12 s; afterwards use **Batal daftar**, which asks for confirmation. |
| **Confusion points** | **(a)** The optimistic flip means the row shows "sudah daftar" *before* the server agrees; on a slow link the user may walk away from a failed write. **(b)** The undo action disappears after 12 s with no warning that it is temporary. **(c)** Auto-refresh every 30 s can change the list under the user's finger mid-tap. **(d)** The confirmation for **Batal daftar** is a browser `confirm()` dialog, visually unlike every other confirmation in the app. |

---

## W-04 — Add or correct a student

| | |
|---|---|
| **Start** | `#/pendaftaran` → **+ Murid baharu** or **Butiran** on a row |
| **Steps** | 1. Fill school, name, 12-digit IC. 2. Choose OKU (Ya/Tidak) and registration status. 3. Optionally tick the transfer request and fill school/reason/notes. 4. **Simpan**. |
| **Information** | Name, IC, primary school; optionally transfer details. Tingkatan is fixed to 1 and read-only. |
| **Confirmation** | Dialog closes; a toast confirms; the list reloads. |
| **Expected outcome** | Validated record; IC stored normalised `######-##-####` and masked in the list. |
| **Errors** | Server validation messages are specific and in Malay: "No. IC mesti 12 digit.", "No. IC tidak sah (tarikh lahir tidak betul).", "Murid dengan No. IC ini sudah wujud.", "Sekolah rendah asal tiada dalam senarai." |
| **Recovery** | Fix the field; the dialog stays open with the message inside it. **Kosongkan borang** clears without closing. |
| **Confusion points** | **(a)** Choosing a transfer reason auto-fills a long paragraph into "Catatan", which the user may not realise is editable text they are now responsible for. **(b)** IC validation checks the embedded birth date — a typo produces "tarikh lahir tidak betul", which reads as a factual claim about the student rather than a typo. **(c)** "Butiran" opens a full edit form with no explicit cancel-vs-save emphasis beyond colour. |

---

## W-05 — Import the student roster

| | |
|---|---|
| **Start** | `#/import` |
| **Steps** | 1. Download the template. 2. Fill required columns. 3. Choose the `.xlsx`. 4. Wait for the preview. 5. Review valid/invalid/duplicate counts. 6. Press **Import N murid**. |
| **Information** | Name, IC, primary school (required); tingkatan, OKU, status, transfer fields (optional). |
| **Confirmation** | Preview shows five counts and up to 50 problem rows with a reason each; after commit, a success notice states how many were added and skipped. |
| **Expected outcome** | Only valid, non-duplicate rows are written; existing ICs are skipped, never overwritten. |
| **Errors** | Wrong file type/size/rows; missing columns (lists them by label); parse failure; network failure mid-commit. Partial commit → "Import terhenti selepas N murid. Import fail yang sama semula; murid yang sudah masuk akan dikesan sebagai pendua." |
| **Recovery** | Fix the workbook and re-upload; re-importing the same file is safe because duplicates are skipped. |
| **Confusion points** | **(a)** "Pratonton semakan" requires a round trip to the server, so the user waits after choosing a file with only a loading line. **(b)** The difference between "pendua dalam fail" and "sudah wujud" is meaningful but only explained in the reason column. **(c)** There is no undo. A wrong import must be corrected by deleting students one by one or in bulk, behind a password gate. |

---

## W-06 — Issue a cooperative receipt

| | |
|---|---|
| **Start** | `#/jana-resit` |
| **Steps** | 1. (First time on this device) enter the teacher name. 2. Search and select the student. 3. Add items and quantities. 4. Choose Tunai or Pindahan Bank; enter a reference if transfer. 5. Review the summary. 6. Tick "Pembayaran telah disahkan…". 7. Press **Simpan Resit**. |
| **Information** | Student; items + quantities; payment method; bank reference (transfer only). |
| **Confirmation** | A progress line states the step ("Langkah 3 daripada 4…"). The save button stays disabled until a student, at least one item, a payment method and the confirmation tick are all present. On success the app navigates to the saved receipt. |
| **Expected outcome** | Receipt `YYYY-NNNNNN`, server-computed total, staff name recorded, koperasi membership flagged if a membership item is included. |
| **Errors** | No device teacher name → blocking setup card first. Items fail to load → retry. Save fails → message plus "Semak Sejarah Resit dahulu, kerana resit mungkin telah disimpan." |
| **Recovery** | If the network drops after saving, check **Sejarah Resit** before retrying — the client reuses one `requestId`, so a retry returns the existing receipt rather than duplicating it. |
| **Confusion points** | **(a)** The confirmation checkbox is a procedural safeguard, not a data field; staff who tick it routinely may stop reading it. **(b)** The teacher name is per device: a teacher who moves to another phone silently issues receipts under a colleague's name unless they notice the header. **(c)** Nothing on screen shows the receipt number before saving, so the printed slip is the only proof. |

---

## W-07 — Find or reprint a receipt

| | |
|---|---|
| **Start** | `#/sejarah` |
| **Steps** | 1. Search by receipt number or student name, and/or set dates. 2. Press the receipt number or **Lihat**. 3. Print, download PDF, or open WhatsApp. |
| **Information** | Receipt number or name; optional date range. |
| **Confirmation** | Row count line; truncation notice when the 100-row cap is hit. |
| **Expected outcome** | The stored receipt with its snapshot name, items, total and payment method. |
| **Errors** | Read failure shows an error block. |
| **Recovery** | Retry via the error block's button; or change a filter to re-trigger the read. |
| **Confusion points** | **(a)** Results are capped at 100 with no paging — a busy month silently truncates and the user may conclude a receipt does not exist. **(b)** WhatsApp opens with a prepared message but cannot attach the PDF automatically; the page explains this, but the explanation is long and sits beside the button. **(c)** The phone number typed for WhatsApp is not stored, so it must be re-entered for every share. |

---

## W-08 — Review the cooperative report

| | |
|---|---|
| **Start** | `#/laporan-koperasi` |
| **Steps** | 1. Set from/to dates (defaults: 1 January → today). 2. Choose payment method. 3. Read the four totals and the row table. 4. **Muat turun CSV** or **Cetak laporan**. |
| **Information** | Date range; payment filter. |
| **Confirmation** | Message line shows "N resit"; a notice appears if the 500-row cap is reached. |
| **Expected outcome** | Totals and rows for the period, with teacher name, student, receipt number, amount and method. |
| **Errors** | Read failure sets totals to "—" (not zero), disables CSV and offers retry. |
| **Recovery** | Retry keeps the chosen dates and filter. |
| **Confusion points** | **(a)** The payment filter is applied **after** the 500-row fetch, so a filtered view can under-report without saying so. **(b)** Totals show "—" on failure, which is correct but easy to misread as "no sales". **(c)** CSV opens in Excel with a BOM (good) but the columns are English ("Nama Guru"), unlike the on-screen table. |

---

## Cross-workflow constraints for Phase 2

1. **Never weaken the access gate.** Every protected route depends on a Firebase
   session plus the `ALLOWED_EMAILS` allowlist; the public guide is the only
   unauthenticated content.
2. **Preserve school-first, T1-only registration.** School is the first filter and
   the unit of work on registration day.
3. **Preserve receipt integrity**: server-side pricing, one `requestId` per
   receipt, snapshot of student name and school, per-year numbering.
4. **Preserve destructive-action friction**: password re-entry, disclosure, and a
   separate dialog. Do not convert deletion into a swipe or a single tap.
5. **Preserve the distinction between** loading, empty, no-match, saved,
   retryable connection error and permission failure. These are already
   differentiated in copy on most pages; a redesign must not collapse them.
6. **Keep teacher attribution device-local** unless the school explicitly asks
   for account-based attribution — changing it silently would rewrite who is
   recorded on future receipts.
7. **Test with synthetic data only.** No real student record belongs in a
   screenshot, a test fixture or a commit.

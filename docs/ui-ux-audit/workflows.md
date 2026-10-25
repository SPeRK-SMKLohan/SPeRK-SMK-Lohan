# Existing staff workflows

This document traces current code-level workflows. Protected flows were not
performed in a live session; therefore expected results are based on handlers,
templates and API calls, not user acceptance testing.

## W-01 Sign in and start

1. Start at `#/login`; public help is available from the login page.
2. Enter email, password and teacher name; teacher name is saved to this
   browser/device local storage.
3. Submit; Firebase signs in, then the client calls `/api/me` to check the
   Worker allows the account. On failure, display a generic sign-in message.
4. The Firebase session uses browser local persistence, so closing a tab does
   not itself sign the user out.
5. Successful sign-in lands at `#/`; explicit Log Keluar signs out.

**Information needed:** authorised credentials, teacher name.
**Possible confusion/recovery:** a failed Firebase sign-in and Worker
authorization can both present generic errors; account allowlist/configuration
requires administrator help. Boot state waits for auth with a five-second
fallback. No live login was attempted.

## W-02 Check dashboard

1. Open Utama (`#/`).
2. Read cards for T1 students not registered/registered/today and cooperative
   membership; inspect today's sales and recent receipts.
3. Use e-Daftar or e-Resit shortcuts.

**Expected result:** totals and recent saved receipts, or a retry panel if API
read fails. With no records, code uses zero counts and “Belum ada resit.”
Dashboard data comes from a Worker endpoint and is cached for 30 seconds.
**Risks:** on a first load, “Memuatkan...” remains until the API succeeds or
fails; empty data is not itself an error. Users can conflate delay with empty
data. This behavior was not observed live.

## W-03 Register a T1 student by primary school

1. Open e-Daftar → Pendaftaran.
2. Choose a primary school (selection is persisted in this browser) or all
   schools.
3. Read school totals, search name or IC, and confirm the correct student and
   school in results.
4. Press Tanda daftar; the action is optimistic while the API saves.
5. Confirm the success toast. If incorrect, choose its Batal/Buat asal action
   within the toast period. To reverse later, use Batal daftar and confirm.
6. Use status filters, paging and refresh as needed.

**Expected result:** authoritative registration status, registered time,
updated counts, and a recoverable undo window. A network error restores the
prior status and shows a danger toast.
**Possible errors:** wrong school selection, no data imported, no matching
student, offline/slow request, or status mutation failure. No-match and empty
school states have explanatory content; loading failure has a retry while
retaining school/search.
**Constraints:** one school first; T1 only; never expose full IC; selection is
per browser. Bulk deletion is separate and destructive.

## W-04 Add or correct a student

1. From registration, choose Murid baharu or Butiran on a row.
2. Fill primary school, name, 12-digit IC, T1 and OKU/registration status.
3. Optionally enable transfer request and enter requested school/reason/notes.
4. Save; clear form is available in create flow; Close cancels the dialog.

**Expected result:** server-validated student record; IC is masked in list.
**Errors/recovery:** required values and server validation can reject the
record; edit is available again through Butiran. Transfer details and school
list are business rules to preserve.

## W-05 Import the T1 student roster

1. Before registration day, open Import Data and download the workbook
   template.
2. Fill required name, IC and primary school columns; optional status/transfer
   columns may be included.
3. Choose `.xlsx` (source states max 2 MB and 2,000 rows).
4. Browser parses the file; API dry-run reports valid, invalid, duplicate-in-
   file and existing IC rows. Review preview.
5. Confirm import of valid rows. Existing duplicates are skipped, not
   overwritten; success summary links to e-Daftar.

**Errors/recovery:** file parse, invalid rows and network/server errors can be
shown; choose another file/cancel or correct workbook and retry. Confirming an
import is a write; safe retry semantics and partial-failure outcome should be
tested before redesigning the flow.

## W-06 Create a cooperative receipt

1. Open e-Resit → Jana Resit. If no device-local teacher name exists, enter
   and save it.
2. Search by student name/IC; pick the correct T1 student, checking masked IC
   and primary school.
3. Add item lines and quantities. The API determines actual price and total.
4. Choose cash or bank transfer; enter reference for a transfer.
5. Review student, items, total and payment. Confirm payment procedure.
6. Save once. Client request ID and server duplicate handling protect retries.
7. Open saved receipt detail; print, download PDF or prepare WhatsApp message.

**Errors/recovery:** student/item reads have retry controls; a failed save shows
an error. If network drops after save, inspect history before creating another
receipt. The teacher name is per device, and switching device requires entering
that name there. Receipt operations were not live-tested.

## W-07 Find or reprint an existing receipt

1. Open Sejarah Resit.
2. Search receipt number/student and/or choose dates.
3. Select receipt number or Lihat; detail loads by receipt ID.
4. Print, download PDF, use WhatsApp, or return to history/create a new receipt.

**Expected result:** receipt snapshot and saved totals/payment. History shows at
most 100 records and server may report truncation. Source catch state shows an
error, but no explicit retry control is currently rendered; users can retry by
changing a filter/reloading the page. Do not create a replacement receipt
without checking history.

## W-08 Review cooperative report

1. Open Laporan Koperasi.
2. Default date range is start of current year through today; choose dates and
   payment type.
3. Read total, cash/bank totals, receipt count and rows.
4. Export CSV or print. Report loads up to 500 receipt records and shows a
   truncation notice if the limit is reached.

**Errors/recovery:** inline retry exists; date and payment filters remain in
place. CSV quotes cells and prefixes formula-leading characters. No report
was generated with live data.

## Design constraints across workflows

- Preserve role/access gate and school authorization; do not treat public
  screenshot access as authorization to student records.
- Preserve school-first T1 registration, idempotent receipt creation, server
  price calculation, device-local teacher attribution, permanent-delete
  confirmation, masked IC and undo semantics.
- Maintain clear distinctions among loading, no records, no matching filter,
  saved, retryable connection error and permission failure.
- Test with synthetic/approved test data and never put real student details in
  audit screenshots.

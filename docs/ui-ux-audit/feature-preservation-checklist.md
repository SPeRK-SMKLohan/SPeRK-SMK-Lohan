# Phase 2 feature-preservation checklist

This checklist is based on the Phase 1 inventory (`feature-inventory.md`).
“Source review” means the Phase 2 diff was checked to ensure the existing
route, data contract, validation, permissions, and business rules remain in
place. It is not proof of a complete runtime regression test.

| Inventory ID | Feature | Source review | Runtime regression |
|---|---|---:|---|
| F-01 | Sign in and device-local teacher name | Done | Not tested with an authorised account |
| F-02 | Text-size preference and local persistence | Done | Not tested with all preferences |
| F-03 | Public user guide | Done | Public route and responsive rendering checked |
| F-04 | Navigation and sign out | Done; routes retained | Authenticated interaction not tested |
| F-05 | Dashboard totals | Done; API and calculations retained | Authenticated data not tested |
| F-06 | Dashboard shortcuts and recent receipts | Done; destinations retained | Authenticated interaction not tested |
| F-07 | School-first T1 registration | Done; rules retained | Authenticated interaction not tested |
| F-08 | Registration search, filters, paging and retry | Done; query behavior retained | Authenticated interaction not tested |
| F-09 | Mark/unmark registration and undo | Done; status operation retained | Not executed |
| F-10 | Student create/edit and validation | Done; fields and rules retained | Not executed |
| F-11 | Student deletion and reauthentication | Done; safeguards retained | Not executed |
| F-12 | Excel import template | Done; format retained | Download not tested |
| F-13 | Import preview, validation and commit | Done; API and rules retained | Upload/write not tested |
| F-14 | Receipt staff-name setup | Done; device-local storage retained | Not tested with an authorised account |
| F-15 | Receipt student selection | Done; API and identity handling retained | Not tested with an authorised account |
| F-16 | Item selection and quantities | Done; server pricing retained | Not tested with an authorised account |
| F-17 | Payment and receipt confirmation | Done; validation/idempotency retained | Receipt write not tested |
| F-18 | Saved receipt, print, PDF and sharing | Done; actions retained | Not tested with a real test receipt |
| F-19 | Receipt history and filters | Done; filters/limit retained | Authenticated interaction not tested |
| F-20 | Cooperative item catalogue | Done; read-only behavior retained | Authenticated interaction not tested |
| F-21 | Cooperative report, CSV and print | Done; calculations/filters retained | Authenticated interaction not tested |
| F-22 | API authentication and permissions | No auth/permission code changed | Not security-tested |
| F-23 | API read retry and write behavior | No API client behavior changed | Slow/offline integration not tested |
| F-24 | Worker cache and data rules | No Worker/backend code changed | Load/freshness not tested |
| F-25 | Not-found and legacy routes | Route table retained | Authenticated route behavior not tested |

## Scope checked

- The implementation changes are limited to frontend presentation, labels,
  semantic associations, loading/error feedback, and retry controls for safe
  reads.
- No Worker source, database schema, API endpoint contract, authentication
  policy, import validation, registration operation, receipt calculation, or
  stored production data was changed.
- All 25 features remain in the source inventory and retain their routes or
  existing workflow paths.
- Runtime testing of the protected features remains outstanding because an
  authorised staff session and safe test records were unavailable.

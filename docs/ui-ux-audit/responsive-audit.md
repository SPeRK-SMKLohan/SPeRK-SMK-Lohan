# Responsive audit

## Observed behavior

The public guide and login were captured at live production URL
`https://sperk-smklohan.pages.dev`. Authenticated workflows are not represented
in these screenshots. Images are viewport captures, not full-page captures.

| Viewport | Capture | Observation | Confidence / limit |
|---|---|---|---|
| 320 × 700 | [`guide-viewport-320.png`](before/guide-viewport-320.png) | Guide intro text is clipped at the right edge. Public header content extends beyond the visible width. | Visually reviewed; public guide only |
| 375 × 812 | [`login-mobile-375.png`](before/login-mobile-375.png), [`guide-mobile-375.png`](before/guide-mobile-375.png) | Login controls/card and guide header/body are cut off at the right edge; horizontal overflow is visible. | Visually reviewed; strongest evidence for P1 defect |
| 430 × 932 | [`guide-viewport-430.png`](before/guide-viewport-430.png) | Header action and guide text are still clipped at right despite the larger phone width. | Visually reviewed; public guide only |
| 600 × 900 | [`guide-viewport-600.png`](before/guide-viewport-600.png) | Guide copy wraps and card remains inside the viewport in the capture. Header actions fit. | Visually reviewed; public guide only |
| 768 × 1024 | [`guide-viewport-768.png`](before/guide-viewport-768.png) | Main content fits; guide index wraps to a second line. Public header shows the text-size control and login action. | Visually reviewed; public guide only |
| 1024 × 768 | [`guide-viewport-1024.png`](before/guide-viewport-1024.png) | Guide content fits; guide index wraps. | Visually reviewed; public guide only |
| 1280 × 800 | [`guide-viewport-1280.png`](before/guide-viewport-1280.png) | Centered content and guide index fit; index wraps one item to another line. | Visually reviewed; public guide only |
| 1440 × 900 | [`login-desktop-1440.png`](before/login-desktop-1440.png), [`guide-desktop-1440.png`](before/guide-desktop-1440.png) | Public login and guide are centered and readable in the viewport capture. The guide continues below the captured fold. | Visually reviewed; no staff pages |
| 1920 × 1080 | [`guide-viewport-1920.png`](before/guide-viewport-1920.png) | Guide remains centered with wide outer margins; content column remains constrained. | Visually reviewed; public guide only |

## Responsive rules found in source

`frontend/src/style.css` defines breakpoints at 1020px, 1080px, 900px and
640px. The 1080px rule wraps the topbar and switches to a mobile menu; 1020px
stacks receipt columns and import/report layouts; 900px reduces report grids;
640px changes registration and report tables into cards and stacks filters.
Mobile registration rows preserve labels via `data-label`, and receipt item
tables have a card-style treatment. The formal receipt document has separate
print rules.

These behaviors are established from CSS source only. The authenticated
registration cards, report cards, receipt entry, dialogs and data tables have
not been rendered in a live viewport during this audit. Do not assume that
having a media query means a layout works at all intermediate widths.

## Findings

1. **Confirmed narrow-screen overflow — P1.** The public guide and login show
   material cut-off at widths 320–430px. Users can lose the end of labels,
   instructions and actions. Determine whether overflow originates in the
   public header flex children, page min-content sizing, or another child by
   measuring `document.documentElement.scrollWidth`, `body.scrollWidth` and
   each overflowing element at 320, 375 and 430px.
2. **Tablet/near-breakpoint checks are incomplete.** The 768 and 1024 captures
   show public guide content fits, but do not test the staff navigation or
   data tables at the 900/1020/1080px transitions.
3. **Data tables require staff-page confirmation.** Registration, receipt
   history, catalogue and import preview use different table patterns. Verify
   desktop horizontal scroll and mobile card reflow, including long student and
   item names, disabled actions, and browser text enlargement.
4. **Dialog/keyboard fit is unverified.** Student/delete dialogs have viewport
   width and height limits in CSS; test at short landscape screens and with the
   on-screen keyboard open. Ensure save/cancel controls remain reachable.
5. **Receipt layout needs separate scrutiny.** The formal document has narrow
   mobile typography and a four-column desktop table. The current source adds
   mobile item cards, but no authenticated live receipt was inspected here.
   Check screen layout, print and downloaded PDF independently.
6. **Fixed/sticky interactions:** registration shell is sticky, receipt summary
   is sticky on wide screens, and toast is fixed. Check that these never cover
   focused controls, errors, keyboard-open forms or anchor targets.

## Preservation checks for Phase 2

- Maintain responsive 50-row registration paging and avoid a DOM-heavy full
  student list.
- Keep the primary school filter visible and usable before search.
- Keep menu toggle, filter chips, clear-search, status actions and save/cancel
  controls operable by touch and keyboard.
- Allow receipt, item and report text to wrap; use deliberate table/card
  alternatives rather than shrinking text until it becomes unreadable.
- Preserve the formal printed receipt as a document and test that screen-only
  mobile changes do not affect print/PDF output.
- Repeat screenshots at each requested viewport after changes and compare
  against the originals listed in `screenshot-index.md`.

## Phase 2 implementation status

The public login and guide were recaptured using actual browser CSS viewport
emulation at the listed widths. No horizontal overflow was detected for those
two public routes at 320, 375, 430, 600, 768, 1024, 1280, 1440 and 1920 px;
login was also captured in 812 × 375 landscape. This does not revalidate the
protected staff layouts or interactions. The original screenshots' CSS
viewport measurement was not recorded and a previous headless Edge capture
could render a narrower PNG from a wider layout viewport. See
`before-after-comparison.md`.

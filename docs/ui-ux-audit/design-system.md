# Existing design system

Findings below come from `frontend/src/style.css` and the rendered public guide
and login captures. They describe the current state, not design changes.

## Brand, color and typography

| Role | Current definition |
|---|---|
| Primary action/navigation | `--primary: #17324F`; deep variant `#10263D`; white text on primary |
| Accent / links | `--accent: #853128`; hover `#64231D`; soft terracotta for registered status |
| Success | `--green: #195331`; soft background `#E8F3EC` |
| Warning | `--amber: #8C6505`; background `#FEF7E6` |
| Error | `--danger: #A31919`; soft background `#FFDAD6` |
| Page/surface | Background `#F3F5F7`; white cards; secondary surfaces `#F3F3F4`, `#EEEEEE` |
| Text | Primary `#1A1C1C`; secondary `#343C46`; muted `#4B5561`; focus `#005FCC` |
| Font | Plus Jakarta Sans headings; Inter body/UI; Roboto Mono numeric values. WOFF2 fonts hosted in `frontend/public/fonts/`. |
| Base sizing | Root is 112.5% by default; the preference classes set it to 112.5/125/137.5% of the browser default for Biasa/Besar/Sangat besar. At the default 16px browser basis, approximate body sizes are 18/20/22px. |
| Headings | h1 2rem desktop / 1.5rem under 640px; h2 1.35rem; h3 1.125rem |
| Line height | Body 1.55; guide content 1.65 |

Selected palette contrast ratios calculated from the token hex values: primary
text/background 15.66:1; secondary/background 10.22:1; accent/background
7.79:1; white/primary 13.08:1. These are approximate token pairs only and do
not establish WCAG conformance for actual rendered states.

## Spacing and shape

- Main page max width 1120px; desktop padding 40px top, 24px sides.
- At ≤640px page padding reduces to 20px top, 14px sides.
- Controls mostly use 8px radius; cards generally 12–16px radius.
- Cards are white with 1px border and subtle shadow; page background is pale
  grey.
- Standard buttons are 52px minimum height; small buttons 48px, reduced to
  44px in a mobile override. Inputs are 52px high with a visible border.
- Checkboxes/radio controls are 24px base. Some special actions/stepper controls
  are 44px.
- Table cells use 14×16px padding; compact tables use 8×10px.

## Components and patterns

| Pattern | Current treatment |
|---|---|
| Navigation | Sticky topbar; logo and brand; desktop grouped links; ≤1080px toggle and vertically expanded menu; dropdown open state can be click/focus/hover depending on viewport. |
| Buttons | Filled primary/positive, neutral secondary, danger, WhatsApp; labels are usually explicit. Text wraps in base style. |
| Inputs | Light neutral fill, 1px border, blue 4px visible focus outline; labels usually wrap inputs. Exceptions are noted in accessibility audit. |
| Cards | White surface, border, radius and subtle elevation. Dashboard statistic cards share a grouped surface. |
| Status | Badges and text labels; registration uses check/open-circle symbols as well as wording. Some color remains supplemental. |
| Tables | Shared table styles; `.wide` table min-width 880px in registration; table wrapper scrolls horizontally. Report and registration tables become labelled cards at ≤640px. Receipt print document remains a separate formal style. |
| Dialogs | Native `<dialog>` with page-specific form content and confirmation dialogs. Full focus behavior requires live assistive-tech checks. |
| Feedback | Reusable toast with optional undo action; other pages use inline muted/error/notice text and live-region semantics inconsistently. |
| Loading/empty | Page-level text such as “Memuatkan...”; registration differentiates no school/no data/no match/error; dashboard has retry; empty/failed patterns vary elsewhere. |
| Text size | Select labelled Biasa/Besar/Sangat besar; stored in localStorage. Older A+ preference is read once for migration. |
| Print | Receipt and report have print styling; receipt PDF is generated client-side from saved receipt. |

## Breakpoints and layouts

| Breakpoint | Source behavior |
|---|---|
| `max-width: 1080px` | Wrap topbar; mobile navigation toggle and vertical menu. |
| `max-width: 1020px` | Stack receipt layout, unstick summary, stack import/report sections. |
| `max-width: 900px` | Reduce report filters and total-card columns. |
| `max-width: 640px` | Smaller page padding; registration/report data rows become cards; forms/filter/report grids stack; receipt toolbars/tables reflow. |

Breakpoints overlap and are evaluated by CSS order. The public captures show
overflow at 320–430px despite these responsive rules; see the responsive and
accessibility audit.

## Patterns worth preserving

- School identity, crest, Malay language and plain task names.
- T1/school-first registration, large primary actions and undo feedback.
- Data privacy (masked student IC) and the formal receipt identity/print form.
- Persistent text sizing, visible focus outline and skip-to-content links.
- Strong primary action and distinct danger state, with no reliance on color
  alone for registered/not-registered wording.

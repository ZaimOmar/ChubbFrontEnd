# 19 Clickable claims list / table (v1, PENDING; refines 04 v1 table, reused by 08 and Home)

- **Purpose:** Make every claim row obviously clickable and keyboard friendly in all lists (officer queue, manager pending, assigned claims, Home previews).
- **Personas:** Officer (`/staff/queue`), Manager (`/manager/pending`), Claimant (Home). Stories US-06, US-30. **API:** `GET /claims` (filters/sort as 04, B1).
- Component: `app-claim-list`, inputs `rows`, `columns` preset (`queue | pending | mine | compact`), `loadState`.

## Layout (desktop)
```
Incoming claims            Market [All v] Type [All v] [Clear]    12 claims shown
+--------------------------------------------------------------------------------+
| Claim number          Market Type     Amount         Age     Status        Action |
|--------------------------------------------------------------------------------|
| CLM-SG-2026-000118 >  SG     Motor    SGD 10,000.00  2d 6h   [Submitted]  [Pick up]|  <- whole row clickable
| CLM-HK-2026-000041 >  HK     Property HKD 52,000.00  1d 0h   [Submitted]  [Pick up]|  <- hover: bg + underline
+--------------------------------------------------------------------------------+
Rows per page [10 v]  1-10 of 12  < >
```
Hover/focus state of a row: background `--c-row-hover`, claim number underlined, chevron `>` shifts to accent colour, `cursor: pointer`. Focus: 3px ring around the row (`:focus-within` on the row, ring on the link for single tab stop).

## Row affordance implementation notes (CSS only)
- The claim number is a real `<a routerLink>` (the single tab stop and the accessible name: "CLM-SG-2026-000118, Motor, SGD 10,000.00, Submitted"). A `::after` pseudo-element with `position:absolute; inset:0` stretches the link over the row (row has `position:relative`). The Pick up button sits above with `position:relative; z-index:1` so it stays independently clickable and focusable.
- Do not use `(click)` on `<tr>`; no `role="button"` on rows.
- Chevron `>` is `aria-hidden` mat-icon `chevron_right`.
- Status via `app-status-badge`. Age >= 2d shows icon `schedule` + text (e.g. "2d 6h"), amber text colour from tokens only as an addition to text, not instead.
- Money right-aligned, tabular numerals. Row height 56px (44px minimum target).
- Zebra not used; 1px `--c-border` row separators.

## Mobile (<600px)
Rows become cards: line 1 claim number (link) + chip; line 2 type, market, amount; line 3 age; Pick up button full width at bottom. Whole card clickable same technique.

## Components
`mat-table` (+ `matSort` on submitted/amount), `mat-paginator`, `mat-select` filters, `mat-flat-button` Pick up, `mat-icon`. Filters in URL query string (as 04).

## Fields / validation
Filters only. Pick up actions per 04 (per-row idempotency guard).

## Actions and status
| Action | Enabled when |
|---|---|
| Open row (link) | any row; target by role: officer `/staff/claims/:id`, manager `/manager/claims/:id`, claimant `/claimant/claims/:id` |
| Pick up | status Submitted, officer role |
| Review (manager pending variant, replaces Pick up) | PendingDecisionApproval; text "You proposed this" instead for own proposals; the row still opens the trail |

## States
Loading: 5 skeleton rows, `aria-busy`. Empty: icon + "No incoming claims match these filters." + [Clear filters] (or "The queue is empty. Nice work."). Error: `app-error-panel` + Retry (filters stay usable). 409 on pick-up: warning banner "CLM-... was already picked up by another officer. The list has been refreshed." focus to banner, row removed. In-flight: that row's button spinner + disabled, row link still works.

## Accessibility
Caption/`aria-label` on table; sort announced; result count `aria-live="polite"`; button `aria-label="Pick up CLM-SG-2026-000118"`; row text readable at 200% zoom; wide-table scroll region has `tabindex="0"` and label; hover never the only cue (underline and chevron).

## Open questions
- Q-L1 Show claimant column for officers? Contract has no names (G2): omitted.
- Q-L2 "Overdue" threshold for age warning (no SLA in the rules): assumed no threshold, show age only; amber icon only after a number is agreed.

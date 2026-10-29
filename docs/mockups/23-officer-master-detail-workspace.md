# 23 Officer workspace, master-detail - v1 PENDING

Persona: officer. Stories: US-06, 09, 22, 26, 27 (layout over 04, 05, 06, 07; actions unchanged). Route `/staff/queue?claim=<id>`; `/staff/claims/:id` stays as the deep link and the narrow-screen view. API: `GET /claims` (status Submitted / assigned), `GET /claims/{id}`, `GET /claims/{id}/timeline`, `POST pick-up`, assess, propose (as built).

## Layout at 1366x768
```
Officer / Queue                                  [View: Oldest first v] [Compact]
KPI: Unassigned 14 | Mine 6 | Awaiting manager 3 | Oldest 3d     (48px, tiles drill down)
+-------------------------------------+------------------------------------+
| [Incoming 14] [Mine 6]              | CLM-2026-0012  [SUBMITTED]  < 3/14 >|
| #      MKT TYPE   AMOUNT  AGE       | SG Motor  SGD 4,200  3d  unassigned |
| [___] [v]  [v]    [..]    [..]      |  [ Pick up p ]  [More v]            |
|-------------------------------------| [Overview] [Timeline]               |
|>CLM-0012 SG Motor 4,200  3d  [ ]    | Description ...                     |
| CLM-0013 HK Prop  9,800  2d  [ ]    | Motor: ABC123, Orchard Rd           |
| CLM-0014 MY Motor   800  2d  [ ]    | Financials: claimed 4,200           |
| ...                                 |                                     |
|-------------------------------------| (pane scrolls inside)               |
| 1-25 of 14   < >      Pick up 2     |                                     |
+-------------------------------------+------------------------------------+
```
Left 42%, right 58%. Both panes scroll independently; page does not.

## Behaviour
- Row select (click, `j/k`, arrows) loads the pane; URL `?claim=` updates; browser Back closes the pane.
- Pane header = sticky summary: number (copy), status badge, market, type, amount, age, assignee; `< 3/14 >` previous/next in current list order.
- Primary action by status: Submitted -> Pick up; Assigned to me -> Set assessed amount; Assessed -> Propose decision; Proposed -> Withdraw. More: Request info, Release. Disabled with tooltip reason when not allowed.
- Pick up success: row moves to Mine, pane updates, toast "Picked up CLM-2026-0012". Bulk: tick rows, footer "Pick up N", per-row result summary.
- Dialogs: assess and propose stay as dialogs/forms per 06, 07; reject keeps confirmation.
- Shortcuts: j/k move, Enter focus pane, Esc back to list, p pick up, a assess, / filter, ? help.
- Components: shared `app-claim-table`, `mat-tab-group` (Incoming/Mine, Overview/Timeline), `mat-paginator`, filter chips, `mat-menu`.
- States: list loading = row skeletons; pane loading = summary and body shimmer; empty list "Queue clear" + Clear filters; error panel with Retry and correlation id; 409 on pick up: amber banner in pane "Already picked up by Ana" + Reload, row updates.
- Below 1100px: pane becomes full page (`/staff/claims/:id`), Back returns to the list with filters kept.
- A11y: list role grid, roving tabindex; pane region labelled by claim number; focus moves to pane heading on open, back to row on Esc.

## Open questions
"Mine" tab needs an assigned-to-me filter in `GET /claims`; confirm.

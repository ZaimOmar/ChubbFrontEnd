# 24 Manager command centre - v1 PENDING

Persona: manager. Stories: US-13, 14, 28, 29, 30 (layout over 08, 10, 11, 18; actions unchanged). Route `/manager/home`. API: `GET /reporting/pending-approvals`, `/reporting/outstanding`, `/reporting/exposure`, confirm and send-back endpoints (as built).

## Layout at 1366x768 (no page scroll)
```
Manager / Command centre                                   [Refresh] [Compact]
+-------------+-------------+-------------+--------------------------------+
| PENDING  7  | OLDEST  3d  | OUTSTANDING | EXPOSURE (USD, reporting rate) |
| filter ->   | sort ->     | 41  chk: 7  | 1.2M                           |
+-------------+-------------+-------------+--------------------------------+
| PENDING APPROVALS (oldest first)               | EXPOSURE BY MARKET        |
| #         MKT TYPE ASSESSED PROPOSED  OFFICER  | SG   ████████ 420,000     |
| CLM-0012  SG Motor 4,200 Approve 4,200 Ana     | HK   █████ 310,000        |
|            [Confirm] [Send back]               | MY   ███ 190,000          |
| CLM-0020  HK Prop  9,800 Reject  - Ben         | TH   ██ 120,000           |
|            You proposed this (disabled)        | + Awaiting checker by     |
| ...                                            |   officer: Ana 3, Ben 2   |
| 1-25 of 7   < >                                | [View full exposure]      |
+------------------------------------------------+---------------------------+
```
Left 60% table, right 40% panels; each pane scrolls inside.

## Inline confirm popover (anchored to the row)
```
CLM-2026-0012  SG Motor  SGD 4,200
Officer proposal: Approve 4,200 - "Repairs verified"
[ Confirm ]  [ Send back... ]
Send back reason * (min 10 chars) [______________] [Send back] [Cancel]
```
- Confirm: one click in popover, row shows progress then disappears with a toast "Confirmed CLM-2026-0012".
- Reject-final proposals: Confirm opens the existing confirmation dialog.
- Maker's own claim: buttons disabled, hint "You proposed this".
- 409 (already actioned): row turns amber "Already handled", Dismiss, list refreshes.
- Validation: send-back reason required, "Enter a reason of at least 10 characters."

## Behaviour and cohesion
- Tiles are filters/drill-downs: Pending -> table filtered (URL), Oldest -> sort + highlight, Outstanding -> `/manager/pending` with awaiting-checker filter, Exposure -> exposure view. Claim numbers are links to `/manager/claims/:id` (Back restores the list state).
- Shortcuts: j/k rows, Enter open popover, c confirm, s send back, Esc close.
- Components: `mat-card`-style section cards, shared `app-claim-table`, `mat-menu`/CDK overlay popover, `mat-form-field` replaced by `app-field`, CSS bars (text values printed).
- States: tiles and rows shimmer; empty pending "Nothing waiting for approval." + link to Outstanding; each panel has its own error + Retry so one failure does not blank the page.
- A11y: bars have printed numbers and a table alternative (`<table>` visually hidden); popover traps focus, Esc returns focus to the row button.

## Open questions
Is an officer breakdown for awaiting-checker available from the reporting API? If not, omit that panel.

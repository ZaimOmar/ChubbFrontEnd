# 11 Manager: Liability exposure by market and type (v1)

- **Purpose:** Show what we may have to pay: outstanding reserve in USD by market and by claim type.
- **Persona:** Manager. **Priority:** MUST P1 (plain table; charts COULD).
- **Story:** US-14 (ACs: total = sum(reserve x static rate) over non-final claims; Pending* count at current reserve; Rejected excluded; send-back or withdrawal leaves exposure identical). Rules: BR-22, BR-24, BR-35.
- **API:** `GET /dashboard/exposure` (Reporting).
- **Route:** `/manager/exposure`.

## Layout
```
Liability exposure                       Updated 28 Oct, 14:05 [Refresh] (h1)
Total exposure        USD 1,254,300.00
Converted at static reporting rates (illustrative, not market rates).  [Rates v]

By market and type (USD)
| Market | Motor           | Property        | Total            | Claims |
|--------|-----------------|-----------------|------------------|--------|
| SG     | USD 120,000.00  | USD  80,500.00  | USD 200,500.00   | 12     |
| HK     | ...             |                 |                  |        |
| ...    |                 |                 |                  |        |
| Total  | USD 700,000.00  | USD 554,300.00  | USD 1,254,300.00 | 42     |
Includes reserve on claims awaiting a checker (at current reserve).
```
"Rates" disclosure (`mat-expansion-panel`): static table SGD 0.74, HKD 0.128, MYR 0.22, THB 0.029, IDR 0.000062, AUD 0.65 with dated note (values come from the API if provided; Q20).

## Components
`mat-card` (total), `mat-table` (market rows, type columns), `mat-expansion-panel` for rates, `mat-button` Refresh, error panel. All amounts shown with `money` pipe in USD; columns labelled "(USD)".

## Fields and actions
Read-only. Refresh only. No status-driven actions.

## States
- Loading: skeleton table.
- Empty: "No open claims. Exposure is USD 0.00." (table not shown).
- Error: error panel with Retry; last data kept with notice.
- 403: "Only managers can view exposure."
- 409: n/a.
- Zero cells: shown as "USD 0.00" (not blank) so totals reconcile.

## Accessibility
Table has caption and header scopes (`scope="col"` / `scope="row"`); totals row/column labelled; USD stated in text.

## Open questions
Q20 Do rates come from the API response or are they a static UI note? Q21 "In settlement" figure is Phase 2 (BR-22) and not shown.

# 04 Officer: Incoming queue with filters and pick-up (v1)

- **Purpose:** Find Submitted claims, filter by market and type, pick one up.
- **Persona:** Officer. **Priority:** MUST P1.
- **Story:** US-06 (ACs: filter shows only matching claims; pick-up gives UnderReview, assigned to me, one Public entry; two simultaneous pick-ups, one wins, the other gets 409). Rules: BR-01, BR-02, BR-26.
- **API:** `GET /claims?status=Submitted&market=..&type=..` (officer), `POST /claims/{id}/assign`.
- **Route:** `/staff/queue`.

## Layout
```
Incoming claims                                                  (h1)
Market [ All       v ]  Type [ All v ]  [ Clear filters ]   Showing 12 of 12
+------------------------------------------------------------------------+
| Claim number        | Market | Type     | Amount          | Submitted   | Age  |        |
|---------------------|--------|----------|-----------------|-------------|------|--------|
| CLM-SG-2026-000118  | SG     | Motor    | SGD 10,000.00   | 26 Oct 08:10| 2d 6h| [Pick up]|
| CLM-HK-2026-000041  | HK     | Property | HKD 52,000.00   | 27 Oct 14:22| 1d 0h| [Pick up]|
+------------------------------------------------------------------------+
Sorted by submitted (oldest first). Rows per page [10 v]  1-10 of 12 < >
```
After pick-up: snackbar "You picked up CLM-SG-2026-000118." with action "Open claim"; row disappears from the list.

## Components
`mat-select` (market: All + 6; type: All, Motor, Property), `mat-table` + `matSort` (submitted, amount), `mat-paginator`, `mat-flat-button` Pick up per row (`aria-label="Pick up CLM-SG-2026-000118"`), claim number is a link to claim detail (read-only preview allowed before pick-up, see Q8), `mat-snack-bar`, status banner for conflict.

## Fields and validation
Filters only; no validation. Filter values reflected in the URL query string so they survive refresh.

## Actions and status
| Action | Enabled when | Result |
|---|---|---|
| Pick up | Claim status Submitted (all rows in this list) | UnderReview, assigned to me |
| Open claim | any row | `/staff/claims/:id` |
All rows here are Submitted by definition; a row that changes meanwhile is handled by 409.

## States
- Loading: table skeleton rows, filters disabled.
- Empty: "No incoming claims match these filters." + "Clear filters" (when filtered), or "The queue is empty. Nice work." (no filters).
- Error: error panel with Retry; filters stay usable.
- 409 on pick-up: banner "CLM-SG-2026-000118 was already picked up by another officer. The list has been refreshed." Row removed, focus to banner. No retry button on that row.
- 403: "You are not allowed to pick up claims." (e.g. manager-only user).
- Pick-up in progress: that row's button shows spinner and is disabled; other rows remain usable.

## Accessibility
Table has caption "Incoming claims"; sort state announced; button labels include claim number; filter changes announce result count via `aria-live="polite"` ("5 claims shown").

## Open questions
Q8 May an officer preview an unassigned claim's trail before picking up? Mockup assumes yes (BR-12 allows officer view in their scope; confirm).

# 10 Manager: Outstanding claims dashboard (v1)

- **Purpose:** Backlog at a glance: counts by status, market and type; oldest unassigned claim.
- **Persona:** Manager. **Priority:** MUST P1 (plain tables; charts COULD).
- **Story:** US-13 (ACs: outstanding = every non-Rejected, non-Settled claim counted once under its own status, Pending* separate rows, totals by status/market/type equal; optional labelled "awaiting checker" subtotal; oldest unassigned = Submitted, no assignee, earliest submittedAt, ties by claim number, shown in hours and days; refresh includes new claims). Rules: BR-28, BR-76, BR-77.
- **API:** `GET /dashboard/outstanding` (Reporting). Refresh by Refresh button; SSE/polling is US-17 (COULD).
- **Route:** `/manager/outstanding`.

## Layout
```
Outstanding claims                       Updated 28 Oct, 14:05 [Refresh]  (h1)
+--------------------+ +---------------------------+
| Total outstanding  | | Oldest unassigned         |
|        42          | | CLM-AU-2026-000012  [Open]|
| (awaiting checker: | | Age 2d 6h (since 26 Oct)  |
|  5, labelled)      | | Unassigned in total: 4    |
+--------------------+ +---------------------------+

By status                                  (table, caption)
| Status                       | Claims |
|------------------------------|--------|
| Submitted                    |   4    |
| Under review                 |  18    |
| Info requested               |   6    |
| Awaiting checker (decision)  |   5    |
| Approved                     |   9    |
| Awaiting checker (settlement)|   0    |
| Settling                     |   0    |
| Total                        |  42    |
Note: "Awaiting checker" rows are separate; they are not counted in Under review.

By market                          | By type
| SG 12 | HK 8 | MY 7 | TH 6 |...  | Motor 25 | Property 17 |
| Total 42                          | Total 42             |
```
Status rows use the status badge (text + icon). The "awaiting checker" subtotal is a labelled line in the total card ("includes 5 awaiting checker"), never replacing rows. Rows for PendingSettlementApproval and Settling are shown with 0 (Phase 2 statuses) or hidden if the API omits them (Q17). Rows with a count > 0 link to a filtered claim list (drilldown, see Q18).

## Components
`mat-card` x2 (total, oldest unassigned), three `mat-table`s (plain tables, charts later), `app-status-badge`, `mat-button` Refresh, "Updated at" text with `aria-live="polite"`, `money` not used (counts only).

## Fields
Read-only. Oldest unassigned: claim number link to `/manager/claims/:id`, age in hours and days, submitted date.

## Actions
Refresh; open oldest unassigned claim. No status-driven actions.

## States
- Loading: card and table skeletons.
- Empty: "No outstanding claims." (all zero) and oldest unassigned card reads "No unassigned claims."
- Error: error panel with Retry; last good data stays visible with "Could not refresh. Showing data from 14:05."
- 403: "Only managers can view dashboards."
- 409: n/a.
- Consistency warning: if group totals differ (should not happen, BR-77) show a visible warning "Totals do not match; please refresh."

## Accessibility
Each table has caption and a Total row (`<tfoot>`); counts are text; refresh result announced ("Updated at 14:05").

## Open questions
Q17 Does the API return rows for statuses with 0 claims? Q18 Is drilldown to a claim list in Phase 1 (no task for a list screen)? Mockup omits the list; counts are not links unless confirmed. Q19 Show "awaiting checker" subtotal (optional per US-13)? Mockup shows it.

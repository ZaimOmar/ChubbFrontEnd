# 06 Officer: Set assessed amount (v1)

- **Purpose:** Set the assessed (gross) amount; show excess, net payable and reserve preview from the server response.
- **Persona:** Assigned officer. **Priority:** MUST P1.
- **Story:** US-26 (ACs: assessed 8,000 with excess 500 gives payable 7,500 and reserve 7,500, one Internal entry; assessed 400 with excess 500 gives payable 0, an approve proposal will be refused; not assigned or Pending* gives 403/409). Rules: BR-04, BR-19, BR-21, BR-22, BR-36.
- **API:** Claims command to set assessed amount (endpoint decided by architect; TBC). The preview is NOT computed in the UI: the response supplies excess, payable, old and new reserve (no business rules in UI).
- **Route:** dialog (`mat-dialog`) opened from `/staff/claims/:id` (screen 05).

## Layout
```
+--------------------------------------------------+
| Set assessed amount                          [x] |
|--------------------------------------------------|
| CLM-SG-2026-000123   Estimated SGD 10,000.00     |
|                                                  |
| Assessed amount (required)   SGD [ 8,000.00 ]   |
| Hint: the gross loss you assess, before excess.  |
|                                                  |
| After saving (from server):                      |
|   Excess        SGD    500.00                    |
|   Net payable   SGD  7,500.00                    |
|   Reserve       SGD 10,000.00 -> SGD 7,500.00    |
|                                                  |
|                         [ Cancel ] [ Save ]      |
+--------------------------------------------------+
```
Flow: user enters amount, presses Save, dialog switches to a result state showing the server figures and a "Done" button. If payable is 0: warning (icon + text) "Net payable is SGD 0.00. This claim cannot be approved; consider proposing rejection." Excess is shown before saving from the claim data if already on the page (read-only).

## Components
`mat-dialog`, `mat-form-field` with currency prefix, `mat-flat-button`, definition list for results, warning banner, `mat-spinner`.

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| Assessed amount | required, number, >= 0, 2 decimals | "Enter the assessed amount." / "Amount cannot be negative." |
Server 422 shown under the field.

## Actions and status
Save enabled only when status UnderReview and user is assignee (button on screen 05 controls opening). Setting again later (before proposing) is allowed (BR-04 "set or changed").

## States
- Loading: Save spinner, field disabled.
- Error 422: under field. Error 5xx: banner in dialog, values kept.
- 409 (claim now Pending* or changed): banner "This claim can no longer be assessed (it is {status})." Dialog closes on OK and page refreshes.
- 403: "Only the assigned officer can assess this claim."
- Empty: n/a.

## Accessibility
Dialog heading focused on open; result state announced with `aria-live="polite"`; currency shown as text.

## Open questions
Q11 Is changing the assessed amount after a first set allowed in the UI? (BR-04 says "set or changed"; mockup allows it.)

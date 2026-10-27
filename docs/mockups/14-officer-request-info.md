# 14 Officer: Request information (v1)

- **Purpose:** Ask the claimant a question; due date is set by the system (14 days).
- **Persona:** Assigned officer. **Priority:** SHOULD P1.
- **Story:** US-07 (ACs: UnderReview then request gives InfoRequested, due = request + 14 days, Public entry with question; open request gives 409; empty question gives 422; Pending* gives 409). Rules: BR-13 to BR-16.
- **API:** `POST /claims/{id}/info-requests` (body: question). **Route:** dialog from screen 05.

## Layout
```
+------------------------------------------------+
| Request information                        [x] |
| CLM-SG-2026-000123                             |
| Question for the claimant (required)           |
| [                                          ]   |
| [                                        ] 0/1000|
| The claimant will see this question and a due  |
| date 14 days from now (set by the system).     |
|                       [ Cancel ] [ Send request]|
+------------------------------------------------+
```
After success the screen 05 trail shows a Public entry and the due date; status InfoRequested.

## Components
`mat-dialog`, textarea, hint, `mat-flat-button`, snackbar.

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| Question | required, not blank, max 1000 | "Enter the question for the claimant." |

## Actions by status
Opens only when I am assignee, status UnderReview, no pending proposal. On screen 05 the button is disabled with visible text "Not available while a decision is waiting for a manager." when Pending*.

## States
Loading spinner. 422 under field. 409: banner "This claim cannot take an information request now (it is {status}, or one is already open)." and page refresh. 403: "Only the assigned officer can request information." 5xx: banner, text kept. Empty: n/a.

## Accessibility
Dialog heading focused; counter text plus `mat-error`.

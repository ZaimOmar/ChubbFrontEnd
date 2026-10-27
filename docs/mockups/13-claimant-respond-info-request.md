# 13 Claimant: Respond to an information request (v1)

- **Purpose:** Read the officer's question and due date, send an answer.
- **Persona:** Claimant. **Priority:** SHOULD P1.
- **Story:** US-04 (ACs: InfoRequested then respond gives UnderReview, same officer, Public "Information received"; any other status gives 409 and no entry). Rules: BR-01, BR-13 to BR-15.
- **API:** `POST /claims/{id}/info-responses` (body: answer text). Question and due date come from the timeline/claim detail.
- **Route:** section on `/claimant/claims/:id` (screen 03) opened by "Answer request"; renders as an inline card, not a separate page.

## Layout
```
+ Information requested --------------------------------------+
| (help icon) Your insurer asked on 28 Oct 2026:               |
| "Please send the police report."                             |
| Please reply by 11 Nov 2026 (14 days).                       |
|                                                              |
| Your answer (required)  [                                  ] |
|                          [                               ] 0/2000|
|                                     [ Send answer ]          |
+--------------------------------------------------------------+
```
Success: card collapses to snackbar "Answer sent." and screen 03 reloads (status Under review; timeline shows "Information received").

## Components
`mat-card`, textarea `matInput`, `mat-hint` counter, `mat-flat-button`, `mat-snack-bar`.

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| Your answer | required, not blank, max 2000 | "Write your answer before sending." |
Document attachment is COULD (filename only) and not designed.

## Actions by status
Card and Send visible only when status InfoRequested. Overdue (past due date): still allowed, shows "This request is overdue" text (no auto-reject, BR-16).

## States
- Loading: button spinner, field disabled.
- Error 422: under field. 5xx: banner, text kept.
- 409 (status changed, e.g. already answered): banner "This request is no longer open. The claim has been refreshed." and card disappears.
- 403/404: "We could not find that claim."
- Empty: n/a.

## Accessibility
Question quoted in a labelled region; due date as `<time>`; textarea labelled "Your answer (required)".

## Open questions
Q22 Can the claimant see previous answers? Assumed yes via the Public timeline ("Information received" has no text, BR-08); confirm whether answer text is shown.

# 22 Report incident, single-viewport form - v1 PENDING

Persona: claimant. Story US-01 (supersedes layout of 02 v1; fields, validation and API unchanged). API: `POST /claims` (idempotent, as built).

## Layout at 1366x768 (about 520px of content height, no scroll)
```
Claimant / Report incident                                   title row
+--------------------------------------------------------------------------+
| REPORT AN INCIDENT   Tell us what happened. * required                   |
|--------------------------------------------------------------------------|
| CLAIM TYPE *  [ Motor | Property ]                                       |
|                                                                          |
| POLICY AND INCIDENT                    | MOTOR DETAILS                   |
| POLICY NUMBER *      MARKET *          | VEHICLE REGISTRATION *          |
| [______________]     [Singapore v]     | [____________________]         |
| INCIDENT DATE *      AMOUNT *          | ACCIDENT LOCATION *             |
| [dd/mm/yyyy ]        [SGD][_________]  | [____________________]         |
| DESCRIPTION *                          | Tip: add the police report no.  |
| [                                  ]   |                                 |
| [                          0 / 2000]   |                                 |
|--------------------------------------------------------------------------|
| Draft saved 10:42   [Discard]            [Cancel Esc]  [Submit Ctrl+Enter]|  sticky footer
+--------------------------------------------------------------------------+
```
Property type swaps the right pane to Property address and Damage type, same height. Nothing chosen: right pane shows a muted "Choose a type to add details."

Mobile: single column, order type, policy, incident, details; footer stays sticky; date and amount side by side to 480px.

## Fields and messages (unchanged from 02)
Policy number (max 30) "Enter your policy number."; Market "Choose a market." default last used; Type "Choose motor or property."; Date not in future "Incident date cannot be in the future."; Amount > 0 "Enter an amount greater than 0." with currency chip from market; Description max 2000 "Describe what happened."; Motor: registration (20), location (200); Property: address (300), damage type (100).

## Behaviour
- Validate on blur, then on input; error replaces the hint line. Failed submit: focus first invalid field, live region "3 fields need attention".
- Draft: autosave to localStorage 2 s after change; on load banner "Draft restored. Discard"; cleared on success and on logout.
- Shortcuts: Ctrl+Enter submit, Esc cancel (confirm if dirty).
- Components: `app-field`, `mat-button-toggle-group` (type), native select/date, textarea, `mat-progress-bar` while submitting.
- Actions enabled: Submit when not in flight; Cancel always.
- States: loading n/a; submitting = bar + disabled Submit; server error = alert above grid; 409/duplicate key = "This claim was already received" with link to the claim (existing idempotency handling); success = confirmation card with claim number link, "View my claim", "Report another".
- A11y: labels bound, required marked in text, fieldset/legend for type, logical tab order left column then right, footer not hiding focus (scroll-padding).

## Open questions
Currency chip from market: confirm market to currency mapping source.

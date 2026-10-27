# 07 Officer: Propose decision (maker) (v1)

- **Purpose:** Propose approve, or reject with a code and text, for manager confirmation.
- **Persona:** Assigned officer (maker). **Priority:** MUST P1.
- **Story:** US-27 (ACs: approve with rationale min 10 chars gives PendingDecisionApproval, one Internal entry and one Public "Decision under review"; reject without valid code or text under 10 gives 422; approve with payable 0 or no assessed amount gives 422; payable above estimate without justification gives 422; already Pending* gives 409). Rules: BR-01, BR-10, BR-17 to BR-19, BR-21, BR-33, BR-35, BR-36.
- **API:** `POST /claims/{id}/decision-proposals`. Body: outcome, (approve) rationale and optional above-estimate justification, (reject) reasonCode and text. Never sent: amount (server uses payable), status, makerId, reserve.
- **Route:** page `/staff/claims/:id/propose` (full-width form for room to read the summary) opened from screen 05.

## Layout
```
< CLM-SG-2026-000123
Propose a decision                                               (h1)
+----------------------------------------------------------+
| Summary: Estimated SGD 10,000.00  Assessed SGD 8,000.00  |
|          Excess SGD 500.00   Net payable SGD 7,500.00    |
+----------------------------------------------------------+
Outcome (required)   (o) Approve   ( ) Reject

-- when Approve --
Amount to approve   SGD 7,500.00   (net payable, read-only)
Rationale (required)   [                                  ]  0/10 min
[ ] -- shown only if net payable > estimated:
Justification for amount above estimate (required) [        ]

-- when Reject --
Rejection reason (required)  [ Choose a code v ]
   Not covered | Policy inactive | Exclusion applies |
   Insufficient evidence | Duplicate claim | No response
Explanation (required)  [                                  ] 0/10 min

Note: A manager must confirm before the claimant is told the result.
                                   [ Cancel ] [ Submit proposal ]
```
Submit opens a confirmation dialog (00 section 7) summarising outcome and text; on success navigate back to screen 05 showing the "Waiting on checker" banner and snackbar "Proposal sent for manager confirmation."

## Components
`mat-radio-group`, `mat-select` (codes), textareas with counters, read-only amount display, conditional justification field, error summary, `mat-dialog` confirm, `mat-flat-button`.

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| Outcome | required | "Choose approve or reject." |
| Rationale (approve) | required, min 10 chars | "Give a rationale of at least 10 characters." |
| Justification (above estimate) | required when shown | "Explain why the amount is above the estimate." |
| Rejection reason | required, one of 6 codes | "Choose a rejection reason." |
| Explanation (reject) | required, min 10 chars | "Explain the rejection in at least 10 characters." |

Inline server 422 messages mapped to the matching control; unmapped ones in the summary. The UI also shows (not blocks) from the claim data: if no assessed amount, a warning and the Approve option disabled with text "Set an assessed amount before approving." If payable is 0: Approve disabled with "Net payable is 0, approval is not possible. Reject instead." (mirrors backend; backend remains authoritative.)

## Actions by status
Page reachable only when I am assignee and status UnderReview. Any other status: page shows "Proposal is not possible in status {label}" with a link back. Submit while Pending* gives 409.

## States
- Loading: claim summary skeleton; submit spinner.
- Empty: n/a.
- Error 422: inline + summary, values kept. Error 5xx: banner, values kept.
- 409: banner "A proposal is already waiting for a manager." then link to claim (data refreshed).
- 403: "Only the assigned officer can propose a decision."

## Accessibility
Radio legend "Outcome"; conditional sections announced via `aria-live`; error summary receives focus; `mat-hint` counters not the only feedback.

## Open questions
Q12 Is the approved amount always equal to net payable (no officer override)? Mockup assumes yes (BR-19). Q13 Reject allowed when no assessed amount set (BR-21 only restricts approve)? Mockup assumes yes.

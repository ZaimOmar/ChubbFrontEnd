# 16 Release / reassign a claim (officer and manager) (v1)

- **Purpose:** Officer releases or requests reassignment with a reason (US-12 officer side); manager reassigns to another officer with a reason, understanding auto-withdraw of a pending proposal.
- **Persona:** Assigned officer (release), Manager (reassign). **Priority:** SHOULD P1.
- **Story:** US-12 (ACs: reassign with reason changes assignee and writes one Internal entry; Pending* proposal is auto-withdrawn and claim returns to UnderReview; no reason gives 422; final claim gives 409). Rules: BR-10, BR-27, BR-32, BR-37, BR-76.
- **API:** reassign/release endpoint decided by architect (TBC). Officer list for the picker: TBC (Q23).
- **Route:** dialog from screen 05 (officer) and screen 09 (manager).

## Layout (manager)
```
+-----------------------------------------------------+
| Reassign CLM-SG-2026-000118                    [x]  |
| Currently assigned to: Aisha Tan                    |
| New officer (required)   [ Choose officer v ]       |
| Reason (required)        [                    ] 0/10 min|
| (!) This claim has a decision proposal waiting for  |
|     a manager. Reassigning withdraws that proposal  |
|     and returns the claim to Under review. The new  |
|     officer will need to propose again.             |
|                          [ Cancel ] [ Reassign ]    |
+-----------------------------------------------------+
```
The warning shows only when status is PendingDecisionApproval. Officer variant: title "Release claim", no officer picker (assignment returns to the manager for reassignment; Q24), reason required, same warning when pending.

## Components
`mat-dialog`, `mat-select` (officers, excluding current), textarea, warning banner (icon + text), `mat-flat-button`.

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| New officer | required (manager) | "Choose an officer." |
| Reason | required, min 10 chars (UI mirrors BR-10; server authoritative) | "Give a reason of at least 10 characters." |

## Actions by status
Enabled for UnderReview, InfoRequested, PendingDecisionApproval. Hidden for Submitted, Approved, Rejected.

## States
Loading spinner; officer list loading/empty ("No other officers available."). 422 per field. 409: "This claim can no longer be reassigned ({status})." (final claims) and refresh. 403: "You are not allowed to reassign this claim." 5xx banner. Success snackbar "Reassigned to {name}."

## Accessibility
Warning is text with icon, announced `role="alert"` when it appears; dialog shared pattern.

## Open questions
Q23 Endpoint to list assignable officers. Q24 What does officer "release" do (back to manager? back to queue)? BR-76 says claims never re-enter Submitted, so assumed it goes unassigned-with-status-unchanged and needs a manager.

# 08 Manager: Pending-approval queue with Confirm and Send back (v1)

- **Purpose:** Work list of proposals awaiting the checker, oldest first; confirm exactly as proposed or send back with a reason.
- **Persona:** Manager (checker). **Priority:** MUST P1.
- **Stories:** US-30 (queue), US-28 (confirm), US-29 (send back). ACs: oldest first with claim number, market, type, amount, maker, age; confirm applies proposal exactly (no editable fields); maker (even with Manager role) gets 403; Officer-only gets 403; two managers, one wins and one gets 409; send-back needs reason min 10 chars. Rules: BR-02, BR-28, BR-32, BR-34, BR-38, BR-39.
- **API:** `GET /dashboard/pending-approvals`; `POST /claims/{id}/decision-proposals/{pid}/confirm` (body: proposal id only, no outcome/amount/code); `POST .../{pid}/send-back` (body: reason).
- **Route:** `/manager/pending`.

## Layout
```
Pending approvals                                    [Refresh]    (h1)
3 decisions awaiting a check. Oldest first.
+------------------------------------------------------------------------------+
| Claim              | Market| Type    | Proposed        | Amount       | Maker      | Age  | Actions |
|--------------------|-------|---------|-----------------|--------------|------------|------|---------|
| CLM-SG-2026-000118 | SG    | Motor   | Approve         | SGD 7,500.00 | Aisha Tan  | 5h   | [Review][Confirm][Send back]|
| CLM-HK-2026-000041 | HK    | Prop.   | Reject: Not covered | -        | Raj Patel  | 1d 2h| ...     |
| CLM-MY-2026-000007 | MY    | Motor   | Approve         | MYR 3,000.00 | You (maker)| 2d   | [Review] Cannot check: you proposed this |
+------------------------------------------------------------------------------+
```
"Proposed" column shows the outcome (Approve or Reject with code label); amount is the net payable for approvals, a dash for rejects. Review opens the claim trail view (screen 09, `/manager/claims/:id`) so the manager can read the rationale before acting.

Confirm dialog (00 section 7):
```
Confirm this decision?
CLM-SG-2026-000118   Approve  SGD 7,500.00
Proposed by Aisha Tan on 28 Oct 11:30. Rationale: repair quote verified
Confirming applies it exactly as proposed. You cannot change it here.
                                      [ Cancel ] [ Confirm decision ]
```
Send back dialog:
```
Send back to the officer
CLM-SG-2026-000118
Reason (required)  [                                   ]  0/10 min
The claimant will not be told about the send-back.
                                      [ Cancel ] [ Send back ]
```

## Components
`mat-table` (+ sort on Age fixed oldest first, no user re-sort that breaks the contract; optional paginator), `mat-button` actions with claim-number aria-labels, `mat-dialog` x2, textarea with counter, `mat-snack-bar`, banner, optional `mat-chip` "Awaiting checker" count.

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| Send-back reason | required, min 10 chars | "Give a reason of at least 10 characters." |
Confirm has no fields. Request body contains only the proposal id (and the reason for send-back). Server 422 on reason shown under the field.

## Actions by status and role
| Action | Enabled when | Otherwise |
|---|---|---|
| Confirm | row status PendingDecisionApproval and current user is not the maker | Confirm HIDDEN for the maker, replaced by text "You proposed this, another manager must check it." (UI hint only, backend returns 403) |
| Send back | same as Confirm | hidden for maker |
| Review | always | - |
Officer-only users never see this area (guard); direct call returns 403 and the page shows "Only managers can check decisions."

## States
- Loading: table skeleton; buttons disabled while loading.
- Empty: "Nothing is waiting for approval." (icon).
- Error: error panel with Retry.
- 409 (another manager acted first, or proposal withdrawn): banner "This decision was already handled (confirmed, sent back or withdrawn). The queue has been refreshed." Row removed; no state change by this user.
- 403 maker-cannot-check (if the hint missed it, e.g. dual-role): banner "You cannot confirm your own proposal. Another manager must check it." (title from problem-details `maker-cannot-check`). Row stays, actions hidden.
- 403 other: "You are not allowed to check decisions."
- Success: snackbar "Decision confirmed: CLM-SG-2026-000118 is now Approved." / "Sent back to Aisha Tan." and row removed.
- Per-row action in progress: that row's buttons disabled with spinner.

## Refresh
Manual Refresh button; automatic 5 to 10 s polling is US-17 (COULD, cut first), not designed here.

## Accessibility
Table caption; buttons carry claim number; confirm dialog states outcome and amount in text; row removal announced via `aria-live="polite"`; unavailable Confirm for maker explained in visible text.

## Open questions
Q14 Is the maker's own pending claim shown in the manager's queue (dual-role) with the "cannot check" hint, or hidden? Mockup shows it with the hint (useful for the BR-32 demo). Q15 Is the proposal rationale returned by the pending-approvals endpoint, or must the dialog fetch it from the trail?

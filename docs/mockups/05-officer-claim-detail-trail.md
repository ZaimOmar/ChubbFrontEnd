# 05 Officer: Claim detail with full trail (v1)

- **Purpose:** Whole story of a claim (Public + Internal) and the hub for officer actions (assess, propose, request info, withdraw, release).
- **Persona:** Officer (assigned or not; non-assigned can read but not act). **Priority:** MUST P1.
- **Stories:** US-09 (ACs: entries ordered by time, each marked Public/Internal with actor, role, reason, maker and checker on proposals; non-assigned officer can read, decision attempt gives 403); US-22 refused entries (SHOULD). Rules: BR-05, BR-09, BR-12, BR-39, BR-74.
- **API:** `GET /claims/{id}`, `GET /claims/{id}/timeline` (staff projection). Action endpoints in screens 06, 07, 14, 15, 16.
- **Route:** `/staff/claims/:id`. Uses shared timeline (audience staff).

## Layout
```
< Incoming queue
CLM-SG-2026-000123   [ Under review ]   Assigned to: Aisha Tan (you)   (h1)
+-----------------------------+--------------------------------------+
| Claim                       | Money                                |
| Motor - Singapore           | Estimated      SGD 10,000.00         |
| Policy POL-SG-100234        | Assessed       SGD  8,000.00         |
| Incident 27 Oct 2026        | Excess         SGD    500.00         |
| Claimant: J. Lim            | Net payable    SGD  7,500.00         |
| Description: ...            | Reserve        SGD  7,500.00         |
+-----------------------------+--------------------------------------+
+ Waiting on checker (only when Pending decision) ----------------+
| (hourglass) Proposal PRP-12 awaits manager confirmation.        |
| Approve SGD 7,500.00 proposed by you on 28 Oct 11:30.            |
| [ Withdraw proposal ]                       (mockup 15)          |
+-----------------------------------------------------------------+
Actions: [Set assessed amount] [Propose decision] [Request information] [Release / reassign]
Full trail      Filter: (o) All ( ) Public ( ) Internal                (h2)
o 28 Oct 09:12 [Public]   Claim received: CLM-SG-2026-000123
|                          by Claimant
o 28 Oct 10:01 [Public]   Claim picked up for review     by Aisha Tan (Officer)
o 28 Oct 10:40 [Internal] Assessed amount set to SGD 8,000.00; excess 500.00;
|                          payable 7,500.00; reserve 10,000.00 -> 7,500.00
o 28 Oct 11:30 [Internal] Decision proposed: approve SGD 7,500.00  (maker Aisha Tan)
|                          Rationale: repair quote verified     Proposal PRP-12
o 28 Oct 11:30 [Public]   Decision under review
o 28 Oct 12:10 [Internal] Decision sent back (checker Mark Lee): quote not attached
o 28 Oct 12:15 [Refused]  Refused: Aisha Tan tried to confirm own proposal
```

## Components
Header with `app-status-badge`; two `mat-card` (claim, money; money values come from the server response, no client maths); optional banner card; action row of `mat-stroked-button`s; `mat-button-toggle-group` trail filter (default All; staff only); shared `app-claim-timeline`; error panel. Money card values use `money` pipe; missing value shows "Not set".

## Fields
Read-only. Assessed/excess/payable/reserve displayed as returned (BR-19, BR-22).

## Actions by status and assignment (UI mirrors, backend authoritative)
| Action | Enabled when | Otherwise |
|---|---|---|
| Set assessed amount (06) | I am assignee and status UnderReview | disabled; tooltip text "Only the assigned officer can assess while under review." |
| Propose decision (07) | assignee, UnderReview, assessed amount set | disabled; reason text shown: "Set an assessed amount first." / "A proposal is already waiting." |
| Request information (14) | assignee, UnderReview, no pending proposal | disabled with reason |
| Withdraw proposal (15) | I am maker, PendingDecisionApproval | hidden |
| Release / reassign (16) | assignee, status UnderReview, InfoRequested or Pending | hidden |
| (none) | Submitted, Approved, Rejected | note "No actions available for this status." |
Disabled buttons use `aria-disabled` plus visible helper text (not tooltip only).

Non-assigned officer: banner "This claim is assigned to {name}. You can read the trail but not act on it." All actions hidden.

## States
- Loading: header and card skeletons; trail skeleton. Error: error panel with Retry (page and trail load independently).
- Empty trail: cannot occur; fallback "No entries."
- Filter yields none: "No Internal entries yet."
- 404: "We could not find that claim."
- 409 (after an action, e.g. claim moved on): banner "This claim changed while you were working. The page has been refreshed." and data reloads.
- 403: "You are not the assigned officer for this claim."
- Corrected entries show "corrected by <entry>" (BR-74). Correction issuing UI is NOT in the task list and is not designed (Q9).

## Accessibility
Visibility is text badge + icon; Refused is labelled "Refused" with warning icon; trail is `<ol>`; toggle group labelled "Filter trail by visibility"; "Jump to latest" link.

## Open questions
Q9 US-18 Correction command has no UI task; confirm it stays out of Phase 1 UI. Q10 Do we show the claimant's name/contact to the officer (assumed yes, name only)?

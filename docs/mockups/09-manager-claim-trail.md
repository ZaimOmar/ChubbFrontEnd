# 09 Manager: Claim trail view (v1)

- **Purpose:** Manager opens any claim (not only pending) and reads the full trail; entry point for Confirm / Send back and Reassign for that claim.
- **Persona:** Manager. **Priority:** MUST P1.
- **Story:** US-09 (AC: manager can open any claim and read Public + Internal entries, ordered, marked, with actor, role, reason, maker/checker). Rules: BR-02, BR-12, BR-39.
- **API:** `GET /claims/{id}`, `GET /claims/{id}/timeline` (staff projection). Also `GET /claims?...` for the search (see below).
- **Route:** `/manager/claims/:id`; reachable from pending queue (08), outstanding drilldown (10) and a "Find claim" box in the toolbar of the manager area.

## Layout
```
< Pending approvals
CLM-SG-2026-000118  [ Awaiting checker (decision) ]   Assigned: Aisha Tan   (h1)
+------------------------------+-------------------------------------+
| Claim: Motor - Singapore ... | Money: Estimated / Assessed / Excess|
|                              | Net payable / Reserve               |
+------------------------------+-------------------------------------+
+ Decision awaiting check (only when PendingDecisionApproval) ---------+
| Approve SGD 7,500.00  proposed by Aisha Tan, 28 Oct 11:30  PRP-12    |
| Rationale: repair quote verified                                     |
| [ Confirm decision ] [ Send back ]  (same dialogs as screen 08)      |
| (maker view: "You proposed this, another manager must check it.")    |
+----------------------------------------------------------------------+
Actions: [ Reassign ] (mockup 16)
Full trail    Filter: (o) All ( ) Public ( ) Internal
 ... shared timeline, audience staff (see 00 section 5) ...
```

## Components
Same as screen 05 (cards, banner, shared timeline, toggle filter) plus the Confirm/Send back dialogs from screen 08. "Find claim" = `mat-form-field` with search icon in the manager toolbar: enter a claim number, Enter opens the claim; not found shows inline "No claim with that number."

## Actions by status
| Action | Enabled when |
|---|---|
| Confirm decision / Send back | PendingDecisionApproval and I am not the maker |
| Reassign (16) | UnderReview, InfoRequested, PendingDecisionApproval |
| none | Submitted (can reassign? no: not assigned, see Q16), Approved, Rejected, Settled; note "No actions available for this status." |
Manager never gets propose, assess or request-info buttons.

## States
Loading skeletons (header, cards, trail independent); error panel with Retry; 404 "We could not find that claim."; 403 "Only managers can use this view."; 409 on confirm/send-back as screen 08 (page reloads and the decision panel disappears); filter-empty "No Internal entries yet."; maker-cannot-check message as screen 08.

## Accessibility
As screen 05; action panel is a labelled region.

## Open questions
Q16 Can a manager act on a Submitted (unassigned) claim? Assumed no (BR-27 lists assigned statuses only).

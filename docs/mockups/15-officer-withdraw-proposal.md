# 15 Officer: Withdraw my pending proposal (v1)

- **Purpose:** Maker withdraws a pending proposal with a reason; shows the "waiting on checker" state.
- **Persona:** Assigned officer who is the maker. **Priority:** SHOULD P1.
- **Story:** US-31 (ACs: my PendingDecisionApproval proposal, withdraw with reason gives UnderReview and one Internal entry, claimant sees nothing new; not the maker gives 403; checker confirmed first gives 409). Rules: BR-02, BR-10, BR-36, BR-38.
- **API:** `POST /claims/{id}/decision-proposals/{pid}/withdraw` (body: reason). **Route:** banner + dialog on screen 05.

## Layout
Waiting banner on screen 05 (see 05): "Proposal PRP-12 awaits manager confirmation" with [ Withdraw proposal ].
```
+--------------------------------------------+
| Withdraw proposal PRP-12?             [x]  |
| Approve SGD 7,500.00 will no longer go to  |
| a manager. The claim returns to Under review|
| Reason (required) [                      ] 0/10 min|
|              [ Keep proposal ] [ Withdraw ]|
+--------------------------------------------+
```

## Components
Banner card, `mat-dialog` (00 section 7), textarea counter, snackbar "Proposal withdrawn."

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| Reason | required, min 10 chars | "Give a reason of at least 10 characters." |

## Actions by status
Visible only to the maker while PendingDecisionApproval. Other officers and managers do not see it.

## States
Loading spinner. 422 under field. 409: banner "A manager already confirmed or sent back this decision. The claim has been refreshed." 403: "Only the officer who made the proposal can withdraw it." 5xx: banner. Empty: n/a.

## Accessibility
Banner is a labelled region with hourglass icon and text; dialog as shared pattern.

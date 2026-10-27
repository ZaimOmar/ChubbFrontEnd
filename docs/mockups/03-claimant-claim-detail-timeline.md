# 03 Claimant: Claim detail with timeline and decision display (v1)

- **Purpose:** See where my claim stands, what happened and when, and the final decision. Also covers the decision display (US-05) in the same screen. Merges "My claims" detail per the cut order.
- **Persona:** Claimant (own claims only). **Priority:** MUST P1 (timeline); decision display SHOULD P1.
- **Stories:** US-03 (ACs: timeline shows "Claim received" and "Claim picked up for review" in order with dates; while a proposal is pending, only "Decision under review", also after a send-back; no Internal entries, count or gap; confirmed rejection shows code and text, approval shows "approved for {currency amount}"); US-05. Rules: BR-08, BR-09, BR-12, BR-33.
- **API:** `GET /claims/{id}` and `GET /claims/{id}/timeline` (claimant projection). Other claimant's id returns 403/404.
- **Route:** `/claimant/claims/:id`. Components: shared timeline (00 section 5), status badge, money.

## Layout
```
< My claims
CLM-SG-2026-000123        [ Under review ]                         (h1)
+--------------------------------------------------------------+
| Motor claim - Singapore                                       |
| Policy POL-SG-100234    Incident 27 Oct 2026                  |
| Amount claimed  SGD 10,000.00     Submitted 28 Oct 2026, 09:12|
+--------------------------------------------------------------+
+ Action needed (only when status = Info requested) ----------+
| (!) Your insurer needs more information. Due 11 Nov 2026     |
| [ Answer request ]                         (see mockup 13)   |
+--------------------------------------------------------------+
+ Decision (only after a confirmed decision) -----------------+
| APPROVED:  (check) Your claim is approved for SGD 7,500.00   |
| or                                                            |
| REJECTED:  (x) Your claim was not approved.                  |
|            Reason: NOT_COVERED - "Policy excludes flood..."  |
+--------------------------------------------------------------+
Progress                                                         (h2)
o 28 Oct 2026, 09:12  Claim received: CLM-SG-2026-000123
|                      by Claimant
o 28 Oct 2026, 10:01  Claim picked up for review
|                      by Officer
o 28 Oct 2026, 11:30  Decision under review
```
Pending (decision proposed, or after send-back): Decision card is NOT shown; status badge reads "Decision under review" (BR-33) and the timeline's last entry is "Decision under review". No outcome, amount, names, send-back or any hint of the manager step.

## Components
`mat-card` (summary, decision card), shared `app-claim-timeline` (audience claimant), `app-status-badge` (claimant relabelling), `money` pipe, `mat-button` back link, `mat-progress-bar`, error panel. Rejection codes shown as friendly label plus text (labels: Not covered, Policy inactive, Exclusion applies, Insufficient evidence, Duplicate claim, No response).

## Fields
Read-only. Decision card values come only from the final Public entry/projection (amount with currency; rejection code and text).

## Actions by status
| Status | Visible actions |
|---|---|
| Submitted, UnderReview, PendingDecisionApproval | none (read-only) |
| InfoRequested | "Answer request" (opens mockup 13) |
| Approved | none in Phase 1 (decision card shows approval) |
| Rejected | none (final) |

## States
- Loading: skeleton summary + timeline skeleton, `aria-busy`.
- Empty timeline: cannot occur (always has "Claim received"); if it does, "No activity yet."
- Error 404/403: "We could not find that claim." with link to My claims (no hint whether it exists).
- Error 5xx: error panel with Retry.
- 409: n/a on this read-only view (appears in mockup 13).
- Stale data: "Refresh" icon button (`aria-label="Refresh claim"`); no auto-polling in Phase 1.

## Accessibility
Status and decision outcome carry text and icon; timeline is an ordered list with `<time>`; decision card is a region with `aria-labelledby`; page `h1` is claim number.

## Security notes for developer
Render the claimant projection as returned; do not request staff endpoints; no Internal wording anywhere in claimant templates; Corrections, refused entries never shown (BR-74).

## Open questions
Q7 Should the claimant timeline show "by Officer" role text, or only summaries (BR-08 allows role; US-03 says "who by role")? Mockup shows role only.

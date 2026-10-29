# 20 Claim detail with timeline and decision card (v2 of 03 / 05 / 09 layout, PENDING)

Layout refinement only; fields, actions, errors, statuses and the approved behaviour of 03, 05, 06, 07, 08, 09 stay as approved v1 (with SPEC binding changes B1 to B5). Stories US-03, 05, 09. **API:** `GET /claims/{id}`, `GET /claims/{id}/timeline` (unchanged). Routes unchanged.

## Layout (desktop, >=960px: two columns 2fr / 1fr)
```
Home > Claims > CLM-SG-2026-000118                                (breadcrumb)
CLM-SG-2026-000118   [ Under review ]                      (h1 + chip)  [Refresh]
+----------------------------------------------+ +--------------------------+
| DECISION CARD (top of right column, sticky)   | | Claim summary             |
| claimant: shown when Approved/Rejected        | | Type: Motor  Market: SG   |
|  [check] Approved                             | | Incident: 25 Oct 2026     |
|  Approved amount  SGD 7,500.00                | | Policy: P-12345           |
|  Rejected: label + claimantReason message     | | Estimated: SGD 8,000.00   |
| staff: Next action card (see below)           | | Description ...           |
+----------------------------------------------+ +--------------------------+
| Timeline                       [All|Public|Internal] staff only             |
| o 28 Oct 2026, 09:12  Claim received                                        |
| |                                                                           |
| o 28 Oct 2026, 11:30  Decision under review                                 |
+----------------------------------------------------------------------------+
```
Order in the DOM and tab order: header, decision/next-action card, summary, timeline (matches reading order; on mobile single column in the same order).

## Decision card variants (all text + icon + colour)
| Audience / status | Content |
|---|---|
| Claimant, Submitted/UnderReview/Decision under review | Info card (blue): "We are reviewing your claim." No amounts, no checker wording (BR-33) |
| Claimant, Approved | Green card, icon check_circle, "Approved", amount with currency, date |
| Claimant, Rejected | Red-tint card, icon cancel, "Rejected", reason label + `claimantReason` message only (never rationale) |
| Officer assignee, UnderReview | "Next action" card: [Assess] then [Propose decision] (enabled per 05 rules, helper text when disabled) |
| Officer, PendingDecisionApproval | "Waiting on checker" card (05 component) |
| Manager, PendingDecisionApproval, not maker | Proposal summary (outcome, amount, reason code, maker, age) + [Confirm] [Send back] (destructive style for Send back) |
| Manager, maker | "You proposed this, another manager must check it." |
| Approved/Rejected (staff) | Final outcome summary, no actions (Phase 1) |

## Timeline refinements
Vertical line with 12px node markers; Public nodes filled, Internal nodes hollow with lock icon AND "Internal" badge (not shape/colour alone); Refused nodes have warning icon + "Refused". Newest at bottom with "Jump to latest". `<ol>`, each `<li>` with `<time datetime>`. Entry text 16px, meta (actor, ids) 14px muted `--c-text-muted`. Filter is a `mat-button-toggle-group` with `aria-label="Filter trail"`.

## Components
`mat-card` (decision card, summary), `mat-chip`-like status badge (existing), `mat-button-toggle-group`, `mat-dialog` for Confirm/Send back/Assess (approved dialogs unchanged), `mat-progress-bar`, existing `app-claim-timeline`.

## States
Claim and timeline load independently: loading skeletons; empty timeline "No activity yet."; error panels with Retry each; 404 "We could not find that claim."; 409 on any command: banner at top of main column, page reloads, focus to banner (messages per SPEC 5.3).

## Accessibility
Decision card is `section aria-labelledby` with `h2`; outcome announced by text; status changes after an action announced via `aria-live="polite"` ("Claim is now Approved"); dialogs trap focus and return it; amounts spoken with currency code; breadcrumb `nav aria-label="Breadcrumb"` with `aria-current="page"`.

## Open questions
- Q-D1 Sticky right column on desktop acceptable (assumed yes, disabled below 960px)?
- Q-D2 Claimant Rejected message source depends on SPEC B2 (`rejectionReason.claimantReason`); no change to that decision.

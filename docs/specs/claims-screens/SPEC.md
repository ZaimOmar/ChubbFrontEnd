# SPEC: Claims demo-path screens (report, claimant detail, officer queue/detail/assess/propose, manager approvals/trail)  (area: claimant | staff | manager)

| Field | Value |
|---|---|
| Author | `frontend-developer` |
| Status | REVIEWED (architect, 2026-10-29; binding changes B1 to B5 in section 12; the reject path of 07 is blocked until the human approves mockup 07 v2) |
| Approved mockup | `docs/mockups/` 02, 03, 04, 05, 06, 07, 08, 09, each v1, APPROVED 2026-10-28 (`APPROVALS.md`); 00 shared patterns v1 APPROVED. Where the contract forces a difference the screen is blocked, not deviated (G1 to G6) |
| Phase | P1 build |
| Stories (US-xx) / BR-xx | US-01, 03, 05, 06, 09, 26, 27, 28, 29, 30. BR-01, 02, 04, 08, 09, 12, 17 to 19, 21, 22, 28, 32, 33, 34, 36, 39 |
| Tasks (docs/planning/TASKS.md) | Sections 1 and 3: claimant report/detail, officer queue/detail/assess/propose, manager approvals/trail (section 10 order) |

## 1. Purpose and scope
Delivers the demo path end to end: a claimant reports an incident and follows it; an officer picks it up, assesses, proposes; a manager confirms or sends back; the claimant sees the result. Every command goes through `SubmissionGuard` (spec `claims-idempotency`). The UI mirrors allowed actions from status, role and assignee; the backend stays authoritative.

**Out of scope (deferred, no route, no button):** withdraw proposal (15), reassign/release (16), request information and claimant respond (13, 14; the "Action needed" card and the officer "Request information" button are not rendered), claimant "My claims" list (12), officer workload (17), manager dashboards (10, 11) and "Find claim" search, auto-polling (US-17), correction UI, all Phase 2. `GET /claims` has no claimant access and no claim-number filter, so these have no contract either.

## 2. Acceptance criteria
- **AC-1 (US-01)** Valid report submit -> success view with server `claimNumber`, `status` Submitted, `currency`, `estimatedAmount`; invalid input -> field errors, no request; 422/400 -> messages mapped to controls, values kept. One `Idempotency-Key` per submit; double click sends one request.
- **AC-2 (US-03, 05)** Claimant detail shows summary from `ClaimsClaimantClaimView` and the claimant timeline (`summary`, `occurredAt` only). `PendingDecisionApproval` never appears: status arrives already masked as `UnderReview` and the badge renders what it is given. Approved shows the decision card with `approvedAmount` and `currency`.
- **AC-3 (US-06)** Queue lists `status=Submitted` with market/type filters (URL query params) and server paging. Pick-up -> `AssignClaim`; success removes the row and snackbars with "Open claim". 409 `claim-already-assigned` -> banner, list refreshed, no retry button. Pick-up for one row does not block the others.
- **AC-4 (US-09)** Officer and manager detail show `ClaimsStaffClaimView` money fields as returned (no client maths) and the staff timeline with Public/Internal badge, actor role, reason, maker/checker/proposal ids, Refused labelling; filter All/Public/Internal.
- **AC-5 (US-26)** Assess dialog posts `assessedAmount` (> 0, 2 decimals; contract minimum 0.01, see G4) and optional `note`; result shows server `assessedAmount`, `netPayable`, `reserve`; `netPayable == 0` shows the warning. Offered only to the assignee when status is UnderReview.
- **AC-6 (US-27)** Propose form: Approve needs `rationale` (10..2000), plus `justification` when the server demands it (`justification-required` 422 reveals the field); Reject needs `reasonCode`, `rationale` (staff only) and `claimantReason` (10..500, "Message to claimant"). No amount, status or maker is sent. Confirmation dialog before submit. 409 `proposal-pending` -> banner and refresh.
- **AC-7 (US-30)** Manager queue lists `PendingDecisionApproval` claims with `openProposal` (outcome, amount, reasonCode, makerId, proposedAt) oldest proposal first, Review link, manual Refresh.
- **AC-8 (US-28)** Confirm sends `ConfirmDecision` for `{id, pid}` with an empty body (`ClaimsEmptyRequest`); no editable fields. Confirm and Send back are hidden for the maker (`openProposal.makerId == session user id`), replaced by "You proposed this, another manager must check it." A 403 `maker-cannot-check` shows "You cannot confirm your own proposal. Another manager must check it." 409 `proposal-not-open` -> "already handled", list refreshed.
- **AC-9 (US-29)** Send back needs `reason` (10..1000); 422 shown under the field.
- **AC-10 (errors)** Every data view has loading, empty and error (with Retry) states; 401/403/404/5xx via the foundation mapper; problem types map to the messages in section 5.3; no `detail` is shown.
- **AC-11 (guard)** Routes `/claimant`, `/staff`, `/manager` lazy and role-guarded (already in `app.routes.ts`); guards are UX only.

## 3. Mockup mapping
| Mockup | Route | Components |
|---|---|---|
| 02 | `/claimant/report` | `ReportIncidentPage`, `ReportIncidentFormComponent`, `MotorDetailsFormComponent`, `PropertyDetailsFormComponent`, `ReportSuccessComponent` |
| 03 | `/claimant/claims/:id` | `ClaimantClaimDetailPage`, `ClaimSummaryCardComponent`, `DecisionCardComponent`, shared `app-claim-timeline` (claimant) |
| 04 | `/staff/queue` | `IncomingQueuePage`, `QueueFiltersComponent`, `QueueTableComponent` |
| 05 | `/staff/claims/:id` | `OfficerClaimDetailPage`, `StaffClaimCardsComponent` (claim + money, shared with manager), `WaitingOnCheckerComponent`, `OfficerActionsComponent`, `TrailFilterComponent`, shared timeline (staff) |
| 06 | dialog from 05 | `AssessDialogComponent` |
| 07 | `/staff/claims/:id/propose` | `ProposeDecisionPage`, `ProposalFormComponent` (approve/reject groups) , `ProposalConfirmDialogComponent` |
| 08 | `/manager/pending` | `PendingApprovalsPage`, `PendingTableComponent`, `ConfirmDecisionDialogComponent`, `SendBackDialogComponent` |
| 09 | `/manager/claims/:id` | `ManagerClaimDetailPage` (reuses `StaffClaimCardsComponent`, `TrailFilterComponent`, `DecisionPanelComponent`, the two dialogs) |

Mockup 05 trail "Request information / Release" buttons and 03 "Action needed" are omitted (out of scope above); this removes UI, it does not change an approved layout.

## 4. Routes, guards and structure
```
src/app/features/
  claimant/ claimant.routes.ts  report/  claim-detail/  claimant.facade.ts
  staff/    staff.routes.ts     queue/   claim-detail/  propose/  staff.facade.ts
  manager/  manager.routes.ts   pending/ claim-detail/  manager.facade.ts
src/app/shared/claims/   (status-badge, money, timeline from foundation; staff-claim-cards, trail-filter)
src/app/core/claims/     claims-api.ts (interface + InjectionToken), claims-api.generated.ts (adapter, step 6), claims-api.fake.ts (tests/dev)
```
Feature folders do not import each other; the staff cards and trail filter live in `shared/claims/` because officer and manager both use them. Role redirects: `/claimant` -> `report`, `/staff` -> `queue`, `/manager` -> `pending`. Containers (pages) call a facade; presentational components take inputs and emit outputs; no `HttpClient` in components.

## 5. API usage
### 5.1 Contract (`../ChubbBackEnd/contracts/openapi/claims.yaml`, confirmed)
| Operation | Used by | Notes |
|---|---|---|
| `SubmitClaim` POST /claims | 02 | body `policyNumber` (max 30), `type`, `market`, `incidentDate` (date), `description` (max 2000), `estimatedAmount` (>= 0.01), `motorDetails{vehicleRegistration<=20, incidentLocation<=200}` or `propertyDetails{propertyAddress<=300, damageType<=100}`; 201 `ClaimantClaimView` |
| `GetClaim` GET /claims/{id} | 03, 05, 09 | `oneOf` claimant/staff view |
| `GetClaimTimeline` GET /claims/{id}/timeline | 03, 05, 09 | `oneOf` array of claimant items / staff entries |
| `ListClaims` GET /claims | 04, 08 | `market`, `type`, `status`, `assigneeId`, `page`, `pageSize`<=100; `StaffClaimPage` |
| `AssignClaim` | 04 | empty body |
| `RecordAssessedAmount` | 06 | `assessedAmount`, `note?`; 200 `StaffClaimView` |
| `ProposeDecision` | 07 | `outcome`, `reasonCode?` (6 codes), `rationale`, `justification?`, `claimantReason?`; 200 `StaffClaimView` |
| `ConfirmDecision` `/decision-proposals/{pid}/confirm` | 08, 09 | empty body |
| `SendBackDecision` `/send-back` | 08, 09 | `reason` |
Every command takes the required `Idempotency-Key` header parameter and returns the updated `StaffClaimView` (the facade replaces local state with it, no extra GET). Not in this contract and **not used**: `GET /dashboard/pending-approvals` (mockup 08), names for users, claimant name, excess, search by claim number.

### 5.2 Facade and thin interface (builds before generation)
`ClaimsApi` (injection token, plain TS interface in `core/claims/claims-api.ts`) mirrors the operations above with domain-named methods returning `Observable<T>` and taking `(…, context: HttpContext, key: string)` for commands (the `SubmissionGuard.run` `send` signature). Types are local readonly interfaces (`ClaimantClaim`, `StaffClaim`, `OpenProposal`, `TimelineItem`, `StaffTimelineEntry`, `ClaimStatus`, `Market`, `RejectionCode`) shaped exactly like the schemas, so step 6 is a one-file adapter (`claims-api.generated.ts`) plus a type-compatibility check; `src/app/api/` is never touched or created here. A `FakeClaimsApi` backs tests.

Facades (`ClaimantFacade`, `StaffFacade`, `ManagerFacade`) expose readonly signals (`claim`, `timeline`, `page`, `loadState` = `loading | ready | empty | error`, `error`) and methods. Each command method owns a `SubmissionGuard` per submit site with scope strings `create-claim`, `assign:<id>`, `assess:<id>`, `propose:<id>`, `confirm:<id>:<pid>`, `send-back:<id>:<pid>`. Per-row pick-up/confirm use one guard per row id (map in the facade) so rows are independent. Role view selection: `Claimant` session -> claimant view type, otherwise staff; a runtime shape check (`'claimantId' in view`) guards the `oneOf` cast.

### 5.3 Error messages (screen text by problem `type`; all else uses the foundation mapper)
| Type / status | Message | Effect |
|---|---|---|
| `claim-already-assigned` 409 | "{claim} was already picked up by another officer. The list has been refreshed." | refresh list |
| `invalid-transition` 409, `concurrency-conflict` 409 | "This claim changed while you were working. The page has been refreshed." | reload |
| `proposal-pending` 409 | "A proposal is already waiting for a manager." | reload |
| `proposal-not-open` 409 | "This decision was already handled (confirmed, sent back or withdrawn). The queue has been refreshed." | refresh |
| `maker-cannot-check` 403 | "You cannot confirm your own proposal. Another manager must check it." | hide actions |
| `not-assigned-officer` 403 | "You are not the assigned officer for this claim." | |
| `forbidden` 403 | "You are not allowed to do that." | |
| 422 `assessed-amount-required` / `payable-zero` / `justification-required` / `reason-code-invalid` / `same-officer` | mapped to the matching control or the form banner, fixed texts per type | `justification-required` reveals the justification field |
| 422 `policy-not-found`, `market-mismatch`, `incident-date-in-future`, `incident-outside-policy-period`, `currency-mismatch` | field text on policy number / market / date; fixed texts | values kept |
| 403 on submit | "This policy is not linked to your account." | |
| `phase-2-not-enabled`, unknown | foundation default for the status | |
Idempotency kinds (in-progress, key-reused, unknown outcome) follow the `claims-idempotency` spec; the form shows its polite "still processing" line.

## 6. State and forms
- Page-level signals: `loadState`, `claim`, `timeline` (loaded independently, each with its own error/Retry), `filters` (from the query string via `withComponentInputBinding`), `page`.
- Typed `FormBuilder.nonNullable` forms. **Report:** `policyNumber`, `market`, `type`, `incidentDate` (max today), `description` (10..2000, see G3), `estimatedAmount` (> 0, 2 decimals), nested `motor` or `property` group added/removed on type change (other group cleared). Currency is derived from the market for display only and never sent. **Assess:** `assessedAmount`, `note?`. **Propose:** `outcome`; approve group (`rationale`, `justification` conditionally); reject group (`reasonCode`, `rationale`, `claimantReason`). **Send back:** `reason`. Validators mirror the contract bounds; the server remains authoritative.
- Submit buttons bind to `guard.isInFlight()`; forms set `aria-busy`; validation runs before `run` so no key is consumed on invalid input.
- Action availability is a pure `computed` per page from `status`, `assignedOfficerId`, `openProposal.makerId` and `AuthService.user().id` (e.g. assess: assignee and UnderReview; propose: also `assessedAmount` set and no `openProposal`; confirm/send back: PendingDecisionApproval and not maker). Disabled actions show visible helper text per mockup 05.
- No polling; manual Refresh.

## 7. Trail and visibility
Claimant templates bind only the claimant projection (`summary`, `occurredAt`); no staff types are importable from `features/claimant` (lint boundary by folder + review). `claimantReason` is the only rejection text a claimant may see; `rationale` and `justification` are rendered only in staff/manager views and never in claimant components. Refused entries are shown to staff only, labelled "Refused".

## 8. Security and accessibility
No `innerHTML`; all user text via Angular interpolation; no ids, keys, bodies or claim data in logs or URLs beyond the route id; client role checks are UX only. Tests assert the claimant bundle path never renders `rationale`. Accessibility per the mockups: labels and `aria-describedby` errors, error summary focus, dialog focus and return, `aria-live` for result counts and row removal, status never colour-only, button names include the claim number.

## 9. Test plan
| Criterion | Type | Test name (examples) |
|---|---|---|
| AC-1 | component | `ReportForm_SwitchType_ShowsMatchingGroupAndClearsOther`; `..._InvalidSubmit_NoRequest`; `..._DoubleClick_OneRequest`; `..._422PolicyNotFound_ShowsFieldError` |
| AC-2 | component | `ClaimantDetail_UnderReview_NoDecisionCard`; `..._Approved_ShowsAmount`; `..._Timeline_RendersSummariesOnly` |
| AC-3 | component / unit | `Queue_FilterChange_UpdatesQueryAndRequest`; `Queue_PickUp_RemovesRow`; `Queue_PickUp409_ShowsBannerAndRefreshes`; `Queue_Empty_And_Error_States` |
| AC-4 | component | `OfficerDetail_ShowsMoneyAsReturned`; `Trail_FilterInternal_ShowsOnlyInternal`; `OfficerDetail_NonAssignee_HidesActions` |
| AC-5 | component | `AssessDialog_Valid_PostsAndShowsServerFigures`; `..._PayableZero_ShowsWarning`; `..._Zero_Invalid` |
| AC-6 | component | `Propose_Reject_RequiresCodeRationaleAndClaimantReason`; `Propose_Approve_PayloadHasNoAmount`; `Propose_409_ShowsWaitingBanner`; `Propose_Justification422_RevealsField` |
| AC-7, 8, 9 | component | `Pending_OldestFirst`; `Pending_MakerRow_HidesConfirmAndSendBack`; `Confirm_SendsEmptyBody`; `Confirm403MakerCannotCheck_ShowsMessage`; `Confirm409_RefreshesQueue`; `SendBack_ReasonMin10`; `Pending_Empty_And_Error_States` |
| AC-10, 11 | unit | `Routes_RoleAreasLazyAndGuarded`; `Facade_ProblemType_MapsToMessage` (table) |
| Security | component | `ClaimantViews_NeverRenderRationale` |

## 10. Implementation plan and cut line
Each step is a small commit with tests; `ClaimsApi` interface and `FakeClaimsApi` first (step 0).
1. **Claimant:** `ClaimsApi` + fake + types; report incident (02); claimant detail with timeline and decision card (03). *Demo-critical.*
2. **Officer:** queue + pick-up (04); officer detail with trail (05); assess dialog (06); propose page (07).
3. **Manager:** pending approvals with confirm/send back (08); manager claim trail (09).
4. **Step 6 / wiring:** blocked on the generated client; swap `FakeClaimsApi` for the generated adapter, contract tests.
**Cut line (if time runs out):** keep step 1 and the queue + detail + propose + manager confirm path; cut in this order: manager trail view (09, link to officer-style read-only detail only), assess note field, trail filter, queue sort/paging polish, claimant decision-card wording polish. Never cut idempotency use, the maker rule UI or error states.

## 11. Risks, assumptions, open questions
Contract versus approved mockup (blocking only the named screen; owner in brackets):
- **G1 (08, `architect`/`ui-ux-designer`)** Mockup 08 uses `GET /dashboard/pending-approvals`, which is not in `claims.yaml`. Proposed: `ListClaims?status=PendingDecisionApproval` (the staff view carries `openProposal` incl. rationale, so Q15 is answered). Needs a stated sort (oldest proposal first) from the backend; otherwise the page sorts the loaded page by `openProposal.proposedAt` (wrong across pages).
- **G2 (05, 08, 09, `ui-ux-designer`/human)** The contract has ids only: no user names (maker, assignee, claimant, checker), so "Aisha Tan (you)" cannot be shown. Proposed: "You" when the id equals the session user id, otherwise "Officer {first 8 of id}" or "Another officer"; claimant name omitted (Q10). Needs approval.
- **G3 (02, `ui-ux-designer`)** Mockup 02 has "Third party involved?" and a "Cause of damage" select; the contract has neither (`motorDetails` = registration + location; `propertyDetails.damageType` = free text <= 100). Proposed: drop the checkbox, make damage type a text input. Description minimum 10 is a mockup rule the contract does not state (max 2000 only): keep as client UX or drop.
- **G4 (06, 07 `ui-ux-designer`)** Mockup 06 shows "Excess" and a before/after reserve; the staff view has no `excess` and only the current `reserve`. Proposed: show assessed, net payable and reserve only (no client subtraction). Mockup 06 says amount >= 0, the contract >= 0.01 (use the contract).
- **G5 (07, `ui-ux-designer`, human)** Mockup 07 v1 has one "Explanation" for Reject; the contract needs `rationale` (staff only) **and** `claimantReason` ("Message to claimant", 10..500). A v2 of mockup 07 must be approved before the reject path is coded; Approve path is unaffected. Also: the amount to approve is shown from `netPayable`; approve vs Q12/Q13 as in the mockup.
- **G6 (03, `product-owner`/`business-analyst`)** The claimant view has no rejection code or `claimantReason`; mockup 03 shows "Reason: NOT_COVERED - text". Proposed: show the decision from the timeline `summary` of the final Public entry if it carries the text, else status plus `approvedAmount` only. Needs backend confirmation of where `claimantReason` reaches the claimant.
- **G7 (03, 04)** "< My claims" back link: My claims is out of scope; link to `/claimant/report`. Queue sort and ordering: `ListClaims` has no sort parameter; assumed server returns oldest first (confirm). Age is computed from `submittedAt` for display only.
- **G8 (`architect`)** Fake-first interface: confirm the `ClaimsApi` token approach (section 5.2) is acceptable, and that generated types are structurally compatible at step 6.
Assumptions: the foundation provides `app-status-badge`, `MoneyPipe`, date helpers, `app-claim-timeline`, `app-error-panel`, snackbar; session user id equals the token `sub` that the backend uses as maker/assignee id. Risks: names missing (G2), a stale `oneOf` shape check, rows acting concurrently (per-row guards), mockups changing after G3 to G6 answers (rework confined to those forms).

## 12. Review record
| Reviewer | Date | Verdict (REVIEWED / CHANGES REQUESTED) | Notes |
|---|---|---|---|
| architect | 2026-10-29 | REVIEWED (binding changes B1 to B5; the reject path stays blocked on mockup 07 v2 approval by the human) | Fits the REVIEWED foundation and claims-idempotency specs, `claims.yaml` (two view schemas, `oneOf`, `policyNumber`, empty-body confirm, `claimantReason`), ARCHITECTURE section 9 and SECURITY-REQUIREMENTS: no client maths; server views replace state; per-row guards with the backend scope strings; the maker rule appears in the UI only as UX; the claimant never imports staff types; `rationale` is never rendered for claimants. The human decisions on G1 to G8 are final and are applied below; the author edits the spec text (or applies the changes when coding the step) with no further review. |

**Binding changes.**
- **B1 (G1, G7 queues):** both queues send `sort=oldest` explicitly (do not rely on the default): officer `ListClaims?status=Submitted&sort=oldest` (FIFO by `submittedAt`, BR-76) and manager `ListClaims?status=PendingDecisionApproval&sort=oldest` (oldest proposal first). Never sort a loaded page on the client. The contract change is recorded in ARCHITECTURE section 9; until the backend ships it, `FakeClaimsApi` honours `sort`. G7: the claimant back link goes to `/claimant/report`.
- **B2 (G6, G5):** the claimant decision card on 03 shows `rejectionReason.label` and `rejectionReason.claimantReason` when Rejected, and `approvedAmount` with `currency` when Approved. Do not parse the timeline summary. On 07 build the approve path now. The reject group (`reasonCode`, "Internal rationale (staff only)", "Message to claimant") is built only after the human approves mockup 07 v2. Split plan step 2 into "propose: approve" and "propose: reject [blocked on 07 v2]".
- **B3 (G2, G3, G4, demo cuts):**
  - G2: show "You" when the id equals the session `sub`, otherwise the role label plus the first 8 characters of the id ("Officer 3f2c9a1b"). No claimant name.
  - G3: no third-party checkbox; `damageType` is a free-text input (100 or fewer characters); `description` is required and non-blank with at most 2,000 characters. Drop the min-10 rule, because the backend does not enforce it (CLAUDE.md: no UI-only business rules).
  - G4: the assess result shows only `assessedAmount`, `netPayable` and `reserve`. No excess, no before/after, and the minimum is 0.01.
- **B4 (section 5.3):** delete the row "403 on submit: This policy is not linked to your account". Another person's policy returns 422 `policy-not-found` (no existence leak), which already has a field message; a 403 on submit can only come from the role policy and uses the foundation `forbidden` text. Also add a mapping for 400 `validation-error` on the unknown `sort` value (the foundation default is enough).
- **B5 (G8 ruling): fake-first `ClaimsApi` token is accepted, with three conditions.** (1) The token and `FakeClaimsApi` may stay permanently as the test seam. The local types are temporary: at step 6 each becomes an alias of the generated type (`export type StaffClaim = ClaimsStaffClaimView`), not a second hand-kept copy. Add `ClaimsApiTypes_MatchGenerated` (a compile-time assignability check both ways) to the step 6 tests. (2) Pull step 6 forward. The Gateway serves the merged document from the **committed** `claims.yaml` (ADR-003), so the client can be generated as soon as the Gateway image is rebuilt, without waiting for the Claims service to run; do it before the manager step. (3) Command methods pass `context` through the generated `options.context` and the key as the generated `idempotencyKey` argument (claims-idempotency Q-I5); the adapter adds no other headers. Why not hand-write an `HttpClient` client: ADR-003 forbids invented contracts. Why not wait for generation: steps 1 to 3 need no wire calls in tests. |

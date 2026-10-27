# ChubbFrontEnd - Tasks

Owner: Product Owner. Master list: `../Assessment/AssessmentTasks.md`. Backend list: `../ChubbBackEnd/docs/planning/TASKS.md`. Stories: `../ChubbBackEnd/docs/product/user-stories.md`; rules: `../ChubbBackEnd/docs/domain/business-rules.md`.
**Format:** `- [ ] [PRIORITY][PHASE] task - stories; rules`. Priority MUST / SHOULD / COULD. Phase **P1** = built within the 5h cap, **P2** = designed, not built.
All boxes start unticked. Start building only after the backend Claims service is demoable AND the mockup gate below is passed. Backend first; plain tables before charts.

## Phase boundary (settled)
- **P1:** claimant, officer and manager screens for the claim lifecycle up to Approved or Rejected, centred on the claim progress TRAIL and maker-checker on the DECISION.
- **P2:** payee details, money view, payment exceptions queue, fund, ledger, reconciliation. Mockups only, optional, never built in the cap.
- **Cut order:** polish and charts > US-17 refresh > US-11/16/47 views > US-10, US-12 UI, US-31 UI, US-02 (merge into timeline screen), US-05 > US-22 display > US-04/07 UI. Never cut: US-01, 03, 06, 09, 26 to 29, claim trail view, role guards.

## 1. Design gate (nothing below starts until approved)
- [ ] [MUST][P1] Mockups for every MUST and SHOULD P1 screen in `docs/mockups/` by `ui-ux-designer`: report form, my claims, claim timeline, respond to info request, decision display, officer queue, officer claim detail with trail, propose-decision form, manager pending-approval queue with confirm/send-back, reassign, outstanding and exposure dashboards, manager claim trail view - US-01 to 07, 09, 12, 13, 14, 26 to 31
- [ ] [MUST][P1] Human approval recorded per mockup in `docs/mockups/APPROVALS.md`; unapproved screens are not built - process, no story
- [ ] [SHOULD][P2] Optional mockups (marked "Phase 2 - designed, not built") for payee details, claimant money view, payment exceptions queue, fund, ledger, reconciliation - US-32, 33, 38 to 45; BR-42, BR-62, BR-72

## 2. Setup
- [ ] [MUST][P1] Scaffold Angular 20 (standalone, signals, SCSS) with Angular Material - US-25
- [ ] [MUST][P1] Environment config with Gateway base URL (only the Gateway is ever called) - US-20
- [ ] [MUST][P1] Generate API client from the Gateway OpenAPI into `src/app/api/` and commit it - US-25 (ADR-003)
- [ ] [MUST][P1] JWT interceptor (token sent only to the Gateway) and problem-details error handling incl. 401/403/409/422 - US-20, 28; BR-11
- [ ] [MUST][P1] Auth service (mock login as seeded claimant, officer, manager, dual-role user) plus role guards - US-23; BR-02, BR-32
- [ ] [MUST][P1] Lazy-loaded areas `/claimant`, `/staff`, `/manager`; redirect by role after login; wrong-role area redirects/403 - US-23; BR-02
- [ ] [MUST][P1] One shared timeline component used by claimant, officer and manager views (entries ordered by time; Public/Internal badge shown only to staff) - US-03, 09; BR-08, BR-09, BR-12

## 3. Claimant screens (P1)
- [ ] [MUST][P1] Report incident form: policy no., market, type (dynamic motor/property fields), date, description, amount; validation errors; shows claim number and status Submitted - US-01; BR-04, BR-23, BR-25
- [ ] [MUST][P1] Claim detail with progress timeline (Public entries only: what happened, when, who by role, reason); shows only "Decision under review" while pending and after a send-back - US-03; BR-08, BR-09, BR-33
- [ ] [SHOULD][P1] My claims list - US-02; BR-12 (cut: merge into the timeline screen)
- [ ] [SHOULD][P1] Respond to an information request (question, due date, answer form; handles 409) - US-04; BR-13 to BR-15
- [ ] [SHOULD][P1] See the decision: "approved for {currency amount}" or rejection code and text in one place - US-05; BR-08, BR-17, BR-33
- [ ] [COULD][P1] Notification badge/inbox on status change - US-03; BR-64
- [ ] [COULD][P1] Document upload (filename only) - no story

## 4. Officer (staff) screens (P1)
- [ ] [MUST][P1] Incoming queue with market/type filters and pick-up; handles 409 when another officer won - US-06; BR-01, BR-26
- [ ] [MUST][P1] Claim detail with the FULL trail (Public + Internal, each marked, actor, role, reason, maker and checker on proposals) via the shared timeline component - US-09; BR-05, BR-09, BR-12, BR-39
- [ ] [MUST][P1] Assess: set assessed amount, shows excess, net payable and reserve preview from server response - US-26; BR-19, BR-21, BR-22
- [ ] [MUST][P1] Propose decision form: approve, or reject with code from the list and text (min 10 chars); inline 422 errors; buttons driven by status and assignment - US-27; BR-17 to BR-19, BR-36
- [ ] [SHOULD][P1] Withdraw my pending proposal with reason; shows "waiting on checker" state; confirm-won-first 409 handled - US-31; BR-10, BR-38
- [ ] [SHOULD][P1] Request information (question, shows due date; disabled while a proposal is pending) - US-07; BR-13 to BR-16
- [ ] [SHOULD][P1] Release/reassign request with reason from claim detail - US-12; BR-27, BR-37
- [ ] [SHOULD][P1] My workload: open claims by status, ageing, Pending* shown as waiting on checker - US-10; BR-28
- [ ] [SHOULD][P1] Display refused attempts as Internal "Refused" entries in the trail - US-22; BR-04, BR-32
- [ ] [COULD][P1] Team table: per-officer counts and handling time - US-11; BR-29

## 5. Manager screens (P1)
- [ ] [MUST][P1] Pending-approval queue (oldest first: claim number, market, type, amount, maker, age) with Confirm and Send back (reason min 10 chars); confirm sends only the proposal id, no editable fields; hides Confirm for the maker; shows 403 `maker-cannot-check` clearly - US-28, 29, 30; BR-02, BR-32, BR-34, BR-38
- [ ] [MUST][P1] Claim trail view: manager opens any claim (not only pending) and reads the full trail - US-09; BR-02, BR-12
- [ ] [SHOULD][P1] Reassign a claim with reason (explains auto-withdraw of a pending proposal) - US-12; BR-27, BR-37
- [ ] [MUST][P1] Outstanding claims dashboard: counts by status (Pending* separate), market, type; oldest unassigned (Submitted, no assignee, by submittedAt); optional awaiting-checker subtotal (plain tables acceptable) - US-13; BR-28, BR-76, BR-77
- [ ] [MUST][P1] Liability exposure by market and type in USD (plain table acceptable) - US-14; BR-22, BR-24, BR-35
- [ ] [COULD][P1] Refresh via SSE or 5 to 10 s polling - US-17
- [ ] [COULD][P1] Charts; checker turnaround and send-back rate; time in status - US-47, 16; BR-30, BR-40

## 6. Shared and quality
- [ ] [SHOULD][P1] Status badge for all 9 statuses, money pipe by currency, loading and error states - US-03, 05
- [ ] [SHOULD][P1] Reactive form validation; responsive layout (COULD) - US-01, 27
- [ ] [SHOULD][P1] Unit tests: guards, claim form, decision form, shared timeline (Public vs Internal rendering), dashboard component - US-03, 09, 27
- [ ] [COULD][P1] One Playwright smoke test: claimant submits, officer proposes, dual-role refused, manager confirms - US-25
- [ ] [MUST][P1] README: install, run, seeded users (incl. dual-role), how to regenerate the API client - US-25
- [ ] [MUST][P1] SPEC.md (from `docs/specs/SPEC-TEMPLATE.md`) written and architect-REVIEWED before coding each module/feature - process, no story
- [ ] [MUST][P1] Small conventional commits; journal entries for AI usage - process, no story

## 7. Security
- [ ] [MUST][P1] Frontend security check (`scripts/security-check.sh`: secret scan, `npm audit`) exits 0 - US-20
- [ ] [MUST][P1] Frontend security tests: token only to Gateway; no server-owned fields sent (status, assignee, reserve, makerId, checkerId, amount/outcome on confirm); claim text escaped; Corrections never rendered for claimants; safe 401/403/409 handling; no Internal data rendered for claimant; role routes guarded - US-20, 28; BR-09, BR-11, BR-34

---

# PHASE 2 screens (designed, NOT built - mockups only, optional)

No Angular code is written for these in the 5h cap. Each would be mockup-only, labelled "Phase 2 - designed, not built". Backend counterparts are in the Phase 2 section of `../ChubbBackEnd/docs/planning/TASKS.md`.
- [ ] [SHOULD][P2] Mockup: claimant payee details form (bank details masked last 4 after save) - US-32; BR-42, BR-43
- [ ] [COULD][P2] Mockup: claimant money view (payable, paid-to-date, remaining limit; no fund or failure fields) and money alerts inbox - US-33, 34; BR-41, BR-64, BR-72
- [ ] [COULD][P2] Mockup: officer request settlement; manager settlement confirm/send-back (joins pending-approvals queue) - US-35, 36; BR-20, BR-32
- [ ] [COULD][P2] Mockup: manager payment exceptions queue with retry, correct payee, cancel - US-38, 39, 40; BR-47, BR-49, BR-50
- [ ] [COULD][P2] Mockup: pool fund screen (balances, coverage ratio, top-up, Held payments) - US-41, 42, 43; BR-66 to BR-71
- [ ] [COULD][P2] Mockup: read-only ledger and trial balance (Manager only) - US-44; BR-54 to BR-62
- [ ] [COULD][P2] Mockup: reconciliation breaks view - US-45; BR-53, BR-61
- [ ] [COULD][P2] Build the above screens when Finance is built; frontend security tests for masking and manager-only guards - US-32 to 45; S17 to S31

## Scope cuts
Real SSO, i18n, file uploads beyond metadata, offline support, heavy state libraries, any Phase 2 screen implementation; cut polish before features.
Removed as stale: officer "settle" button and single-step approve/reject, "settlement amount" on claimant decision, SLA-breach flags.

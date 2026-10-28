# SPEC: Claims idempotency (key holder, interceptor, retry handling)  (area: core)

| Field | Value |
|---|---|
| Author | `frontend-developer` |
| Status | PARTIAL (steps 1-5 coded, step 6 blocked; tests unverified, see Build scope). Previously REVIEWED (architect, 2026-10-28; step 6 stays blocked on `claims.yaml`; see section 12) |
| Approved mockup | n/a. This is a cross-cutting `core/` helper with no screen of its own. The consuming screens (02 report incident, 06, 07, 13, 14, 15, 16 and the pick-up/approval screens) name their own approved mockups in their specs. The user-visible strings in section 6 ("still processing", "try again later", "review and resubmit") are not in `docs/mockups/00-shared-patterns.md` section 6 yet: see open question Q-I1 |
| Phase | P1 build |
| Stories (US-xx) / BR-xx | US-01, 04, 06, 07, 12, 26 to 29, 31. BR-79 (mandatory key, format), BR-80 (scope), BR-81 (raw-body fingerprint), BR-82 (replay), BR-83 (key reused), BR-84 (5xx never stored), BR-85 (in-flight duplicate), BR-86 (which responses are stored), BR-87 (24 h retention). Backend ADR-009 (Accepted). Spec index row 4 in `../ChubbBackEnd/docs/specs/README.md` |
| Tasks (docs/planning/TASKS.md) | Section 2: the five idempotency items (key helper for every non-GET Claims command, submit disabled in flight, 409 in-progress handling, Location/Replayed fallback, business-409 separation by problem `type`, 422 key-reused, unit tests) |

## 1. Purpose and scope
Every non-GET Claims command needs a client-chosen `Idempotency-Key` (BR-79). This slice gives the app one place that decides when a key is created, kept, reused or discarded, so a double-click, a flaky mobile network or a 409 "in progress" never creates a second claim or a second trail entry, and a genuinely new user action is never mistaken for a retry.

**In scope**
- `SubmissionGuard`: a small signal-based holder, one instance per submit site (form or action button), that owns the pending attempt (key plus the exact serialised body), the in-flight state, and the decision "same attempt or new attempt".
- An `Idempotency-Key` HttpContext token plus a functional interceptor that writes the header on non-GET calls to the Gateway Claims route, and refuses to send a Claims command without a key.
- Retry policy for 409 `idempotency-request-in-progress` (honour `Retry-After`, same key, same bytes, bounded).
- Outcome handling: replay as success, stored refusals, 422 `idempotency-key-reused`, 400 key errors, network/5xx (outcome unknown).
- Extension of the foundation problem-details mapper (new `AppError.kind` values and `problemType`, `retryAfterSeconds`), section 5.3.
- Tests (section 9).

**Out of scope:** the screens themselves (each screen spec uses the guard); refresh of the claim after a business 409 (screen facade); offline queueing or background sync; persisting a pending submission across reloads (Q-I2); idempotency on `POST /auth/token` (not a Claims command); the generated client contents (section 5.1); Phase 2 endpoints.

## 2. Acceptance criteria
- **AC-1 (one key per user action, BR-79)** Given a user presses submit on a command form, then exactly one UUID key is created for that action and sent as `Idempotency-Key`. The key matches `A-Z a-z 0-9 - _`, 8 to 128 chars (a UUID v4 is 36).
- **AC-2 (retry reuses key and bytes, BR-81, BR-82)** Given a submission whose outcome is unknown (network error, timeout, 5xx, or in-progress retries exhausted), when the user submits again with an unchanged form, then the same key and the identical serialised body are sent.
- **AC-3 (new action or changed body gets a new key, BR-83)** Given the form content or the target (claim/proposal id, command) changed since the pending attempt, or the previous attempt reached a definitive outcome, then a new key is created. The same key is never sent with a different body.
- **AC-4 (no double submit, BR-85)** While an attempt is in flight (including waiting for an in-progress retry) the submit control is disabled with progress shown, and a second `run` call is ignored (no second request). It is re-enabled on any non-success outcome.
- **AC-5 (header scope)** `Idempotency-Key` is added only to non-GET requests to the Gateway origin under the Claims route. It is not added to GET, to other origins, or to `POST /auth/token`.
- **AC-6 (missing key is a bug)** A non-GET Claims request that reaches the interceptor without a key in its context is not sent; the call fails with a developer error surfaced as the generic error message. The interceptor never invents a key (it would differ per HTTP attempt and defeat idempotency).
- **AC-7 (409 in progress, BR-85)** Given 409 with problem `type` `idempotency-request-in-progress`, then the guard waits `Retry-After` seconds (default 1 if unreadable; clamped to 1..10), resends the same request with the same key, and shows "still processing". After 5 failed waits it stops, shows a "try again later" message and keeps the attempt (and key) for the next user submit. This 409 is never shown as a business conflict and never causes a new key.
- **AC-8 (business 409 separated by type)** Given 409 with any other `type` (`invalid-transition`, `claim-already-assigned`, `proposal-not-open`, `concurrency-conflict`, `phase-2-not-enabled`, unknown), then it is a business refusal: the attempt is discarded, the screen shows its message and refreshes the claim, and the next user action takes a new key. Classification is by `type` only, never by status alone.
- **AC-9 (replay is success, BR-82)** A 2xx is success whether or not `Idempotent-Replayed: true` is present. A replay is not shown as a duplicate or warning. The pending attempt is cleared. `Idempotent-Replayed` and `Location` are never required: where a value is needed (the new claim `id` after `POST /claims`) it is read from the response body, and the headers are used only if the browser exposes them (Q-I3).
- **AC-10 (stored refusal, BR-86)** Given a 403 or 409 business refusal (whether first response or `Idempotent-Replayed`), then there is no automatic retry, the attempt is discarded, and the next user action uses a new key (a new key is a new real attempt and correctly writes a new Refused entry).
- **AC-11 (422 key reused, BR-83)** Given 422 `idempotency-key-reused`, then the attempt is discarded, the message "We could not safely submit this. Please review your entries and submit again." is shown, no response detail is displayed, and the next submit uses a new key.
- **AC-12 (400 key errors)** Given 400 `idempotency-key-missing` or `idempotency-key-invalid`, then it is treated as a client bug: generic error message, attempt discarded, nothing from the response shown. (Field-level 400 `validation-error` keeps the foundation `fieldErrors` mapping.)
- **AC-13 (unknown outcome keeps the key)** Given status 0, timeout or 5xx, then the attempt is kept (BR-84: 5xx is never stored, so reuse is safe), the error is shown with "Your request may not have been received. You can safely try again.", and submit is re-enabled.
- **AC-14 (privacy)** The key is not a secret but is never logged together with a token or body; no body, key or `Retry-After` value is written to any log.

## 3. Mockup mapping
n/a: no regions of its own. Consuming screens bind to the guard's signals (`isInFlight`, `status`) for the disabled submit, the progress indicator and the polite live-region text. Any shared "still processing" pattern is for `ui-ux-designer` to add to 00 section 6 (Q-I1); this spec does not build a component for it.

## 4. Routes, guards and structure
No routes. Files under `src/app/core/idempotency/` (one concern per file, per CODING-GUIDELINES section 3):
- `idempotency-key.ts`: `createIdempotencyKey()` returns `crypto.randomUUID()`; fallback built from `crypto.getRandomValues` when `randomUUID` is unavailable (non-secure context such as plain http on a LAN address). Never `Math.random`.
- `idempotency-context.ts`: `IDEMPOTENCY_ATTEMPT` HttpContextToken holding an `Attempt` (`key`, `scope`, `bodyText`, mutable `sentBodyText`), exported helper `withAttempt(attempt): HttpContext`.
- `submission-guard.ts`: the holder (4.1).
- `idempotency.interceptor.ts`: functional interceptor (4.2).
- `in-progress-retry.ts`: the RxJS retry operator (4.3).
- `idempotency-wait.ts`: injection token `IDEMPOTENCY_WAIT` (`(ms: number) => Observable<unknown>`, default `timer`) so tests never use real time; same pattern as the foundation `NOW` token.
- Extension of `core/http/app-error.ts` and `core/http/problem-details-mapper.ts` (5.3).
Interceptor order in `app.config.ts`: `[jwtInterceptor, idempotencyInterceptor, problemDetailsInterceptor]`. The idempotency interceptor only reads/writes the request; the problem-details interceptor stays last so response errors are mapped on the way back.
Feature facades (later specs) call `guard.run(...)`; components never touch `HttpClient`, the key, or the context.

### 4.1 `SubmissionGuard` contract
Where the key lives: in memory only, inside the guard instance owned by the submit site (a component field created by `inject`-friendly factory `createSubmissionGuard()`, so it lives and dies with the component and is never a global). It is not written to storage (Q-I2).
- Signals (readonly): `status` (`'idle' | 'sending' | 'waiting'`; `waiting` = honouring Retry-After, UI text "still processing"), `isInFlight` (computed: `sending` or `waiting`), `hasPendingAttempt`, `lastOutcome` (`'success' | 'refused' | 'unknown' | 'rejected' | null`, for the screen's message choice).
- `run<TRequest, TResult>(scope: string, request: TRequest, send: (request: Readonly<TRequest>, context: HttpContext) => Observable<TResult>): Observable<TResult>`.
  - `scope` is supplied by the facade and identifies command plus target, e.g. `assign:<claimId>`, `confirm:<claimId>:<proposalId>`, `create-claim`. It mirrors the backend scope (BR-80: route with resolved ids), so a different claim never reuses a key.
  - If `isInFlight()` the call returns `EMPTY` (ignored duplicate; AC-4). Equivalent to `exhaustMap` semantics at the call site.
  - Fingerprint: `bodyText = JSON.stringify(request)` taken once from a frozen deep copy (`structuredClone` then `Object.freeze` shallowly is not enough: deep-freeze in a tiny helper) so later form edits cannot mutate the pending bytes. If a pending attempt exists with equal `scope` and equal `bodyText`, reuse it; otherwise create a new attempt with a new key (AC-2, AC-3).
  - `send` is always given the frozen snapshot, never the live form value, and a context from `withAttempt(attempt)`. Facades must pass the snapshot to the generated method unchanged and must not rebuild or reorder it, so HttpClient's `JSON.stringify` yields the same bytes on every resend (BR-81 hashes raw bytes, no canonicalisation).
  - The returned observable is composed as `defer(() => send(...))` then `withInProgressRetry`, `tap`/`catchError` for outcome classification, `finalize` to reset `status` to `idle`. It emits the result once and completes. No nested subscribes; the caller subscribes with `takeUntilDestroyed`.
- Outcome rules applied by the guard (the table in 5.4 is normative): clear the attempt on success, on any definitive HTTP 4xx other than the in-progress 409; keep it on unknown outcomes (AC-13) and on exhausted in-progress retries (AC-7).
- `reset()`: discards the attempt (used when a form is cleared or navigated away from deliberately).
Rationale for discarding on every definitive 4xx: a 4xx means the command did not run (or a refusal was stored). Reusing the key after a stored refusal would only replay the stale refusal, and reusing it after an unstored 4xx buys nothing because the user normally changes the body. A new key can never cause a duplicate effect here. Keeping the key is only needed when the outcome is unknown.

### 4.2 Interceptor
- Applies when: method is not GET (HEAD/OPTIONS also excluded), the URL parsed with `new URL` has the Gateway origin (same parsing as the JWT interceptor, not string prefix), and the path is under the Claims route prefix (Q-I4: confirm the Gateway prefix is `/claims`; kept as one constant derived from config, not hard-coded across files).
- If the context holds an attempt: set header `Idempotency-Key` to `attempt.key`. On the first send record `attempt.sentBodyText = req.serializeBody()`; on a resend compare it, and if different, do not send and fail with a developer error (defence against a facade that rebuilt the body; prevents a 422 in production and a wrong request). The comparison uses only local strings; nothing is logged.
- If it holds no attempt: do not send, error (AC-6).
- Does not touch `Authorization` (JWT interceptor does) and never adds the header to other origins or to GET.
- Generated-client interplay: see 5.1. The key is injected through `HttpContext` and the interceptor, never by editing generated code.

### 4.3 In-progress retry operator
`withInProgressRetry(attempt state)` wraps the cold `send` observable. On an `AppError` of kind `idempotency-in-progress` it sets `status = 'waiting'`, waits `retryAfterSeconds` (default 1, clamp 1..10) via `IDEMPOTENCY_WAIT`, then resubscribes (the same `send` closure, the same snapshot, the same context, so same key and same bytes). Up to 5 waits (6 attempts); on the sixth failure it rethrows an `AppError` of kind `idempotency-in-progress` flagged `exhausted` and the guard maps it to "try again later" and keeps the attempt. Any other error passes straight through. Unsubscribing (component destroyed) cancels the wait.

## 5. API usage
### 5.1 Client generation interplay: BLOCKED on contract
`ChubbBackEnd/contracts/openapi/` currently holds `identity.yaml` only; `claims.yaml` (and the Gateway merged `/openapi/v1.json`) does not exist yet, so nothing here can be verified against generated operations, and nothing is invented. ADR-009 states the contract declares the `Idempotency-Key` header on each command. Two possible generated shapes, both supported without editing `src/app/api/`:
1. The generator emits a required `idempotencyKey: string` parameter on each command method (header parameter in the spec). The facade passes `attempt.key` for that parameter (read from the context by a one-line helper `guard.run`'s `send` callback receives via `key` in addition to `context`) and the interceptor still sets/verifies the header from the context, which gives one source of truth and a fail-fast mismatch check.
2. The header is not a parameter (or generator option omits it). The interceptor alone supplies it.
In both cases the generated methods accept `options.context` (typescript-angular passes `HttpContext` through `options`); the guard's `send` callback therefore receives `(snapshot, context, key)`. Generation configuration is already set by the foundation spec A-F3. If the chosen generator version does not expose `context`, report it to the architect instead of patching generated code (Q-I5).

### 5.2 Endpoints
Every non-GET Claims command, named exactly as in the generated client once available (list from TASKS section 2 and ARCHITECTURE section 9 table, 11 routes): `POST /claims`, `POST /claims/{id}/assign`, `.../assessed-amount`, `.../decision-proposals`, `.../decision-proposals/{pid}/confirm`, `.../send-back`, `.../withdraw`, `.../reassign`, `.../info-requests`, `.../info-responses`, `.../corrections`. The settlement stubs (409 `phase-2-not-enabled`) are non-GET Claims endpoints too and fall under the same rule if a screen ever calls them. No GET gets a key. Request bodies carry only client-settable fields (foundation security rule); the key is a header, never a body field.

### 5.3 Problem-details extension (foundation `core/http`)
The foundation mapper keeps `type`, `status`, `errors`, `X-Correlation-Id`, and "match problem `type` values exactly". This spec adds, without changing existing behaviour:
- `AppError.problemType?: string` (the exact `type` slug, last path segment normalised the same way the foundation mapper reads it).
- `AppError.retryAfterSeconds?: number`, read from the `Retry-After` response header only when it parses as an integer 0..3600; otherwise undefined (Gateway CORS must expose it, Q-I3).
- New `kind` values `idempotency-in-progress` (409 + type `idempotency-request-in-progress`), `idempotency-key-reused` (422 + type `idempotency-key-reused`), `idempotency-key-invalid` (400 + type `idempotency-key-missing` or `idempotency-key-invalid`). All other 409 stay `conflict`.
This is a small change to a REVIEWED foundation file set: architect to confirm at review (Q-I6).

### 5.4 Outcome table (normative)
| Response | Meaning | Guard action | Key next time | UI message (via the screen) |
|---|---|---|---|---|
| 2xx, with or without `Idempotent-Replayed: true` | executed or replayed | success, clear attempt | new | screen's success |
| 409 `idempotency-request-in-progress` | first copy still running, not stored | wait `Retry-After`, resend same bytes and key, max 5 waits | same | "Still processing. Please wait." then, if exhausted, "This is taking longer than expected. Please try again in a moment." |
| 409 other `type` (business) | resource-rule refusal, stored (BR-86) | no retry, discard, screen refreshes claim | new | screen-specific text, default foundation 409 text |
| 403 | stored resource-rule refusal or unstored role-policy 403 (the client cannot tell and does not need to) | no retry, discard | new | "You are not allowed to do that." (or an allow-listed specific reason such as `maker-cannot-check`, defined by the consuming spec) |
| 422 `idempotency-key-reused` | client bug | discard | new | "We could not safely submit this. Please review your entries and submit again." |
| 400 `idempotency-key-missing`/`-invalid` | client bug | discard | new | foundation generic "Something went wrong. Please try again." |
| 400 `validation-error`, 404, other 422 | command did not run | discard | new | foundation mapping (field errors, not-found) |
| 401 | session expired | foundation flow (clear session, redirect); discard | new after login | foundation text |
| status 0, timeout, 5xx | outcome unknown, never stored (BR-84) | keep attempt, re-enable submit | same (identical bytes) | "Your request may not have been received. You can safely try again." |
After 24 h a key expires (BR-87); a pending attempt never lives that long in memory (it dies with the component), so this is noted, not handled.

## 6. State and forms
- Signals as in 4.1. The consuming form disables its submit button and shows `mat-progress-bar`/`aria-busy` from `guard.isInFlight()`, and announces `waiting` through a polite live region ("Still processing..."). Disabling is not the only defence: `run` itself ignores a call while in flight (AC-4), so Enter key repeats and programmatic double calls are also safe.
- The form value used to build the request is read once at submit; subsequent edits do not change a pending attempt, and (AC-3) the next submit with edited content gets a new key.
- Forms still validate first (reason required, etc.); a request that fails client validation never reaches `run`, so no key is consumed.
- Error/empty/loading states: the guard only supplies submit-progress and outcome signals; the consuming screens render their own loading/empty/error states.
- No polling in this slice.

## 7. Trail and visibility
n/a for rendering. Effect on the trail: correct use of the guard is what keeps the Refused-entry and "Information received" counts true (a network repeat adds nothing; a new action after a stored refusal adds one, which is correct). Nothing internal is rendered by this slice.

## 8. Security and accessibility
**Security**
- The key is an opaque client-chosen identifier, not a secret and not an authentication artefact; scoping to the actor happens on the server from the token (BR-80), so knowing a key gives no access. It is still never logged, put in a URL, or stored in `localStorage`; no `console.*`.
- Never log the key together with the token or body; stored backend responses can contain personal data, and this slice never reads or caches response bodies beyond the call result.
- Keys come from a CSPRNG (`crypto.randomUUID`/`getRandomValues`), never `Math.random`, so they are not guessable.
- Header added only to the parsed Gateway origin, non-GET, Claims path (no leakage to third parties; AC-5).
- No server-owned fields in requests; the header is the only addition. 422/400 response details are never displayed (the original response is never revealed by the server on 422 and is not rendered either).
- Frontend security tests: header absent on other origin, on lookalike host, on GET; no key in error messages.
**Accessibility**
- Disabled submit exposes state via `aria-busy` on the form and a visible progress indicator; the "still processing" and "try again later" texts are in an `aria-live="polite"` region (errors that need action use the foundation `role="alert"` error panel). Focus returns to the submit control or the error panel after failure, as in the consuming mockups. Status is never colour-only.

## 9. Test plan
Mock HTTP with `HttpTestingController`; `IDEMPOTENCY_WAIT` replaced by an immediate observable; no real timers or network; deterministic keys by providing a key-factory token override in the test (`createIdempotencyKey` is injected).
| Criterion / risk | Test type | Test name |
|---|---|---|
| AC-1 key format | unit | `IdempotencyKey_Create_MatchesAllowedCharsetAndLength`; `..._NoRandomUuid_FallsBackToGetRandomValues` |
| AC-1, AC-2 | unit | `SubmissionGuard_Run_FirstSubmit_CreatesOneKey`; `SubmissionGuard_Run_RetryAfterNetworkError_ReusesKeyAndBody` |
| AC-2 identical bytes (BR-81) | unit | `SubmissionGuard_Run_Retry_SendsByteIdenticalBody`; `Interceptor_Resend_BodyDiffersFromFirstSend_DoesNotSendAndErrors` |
| AC-3 | unit | `SubmissionGuard_Run_ChangedBody_NewKey`; `..._ChangedScope_NewKey`; `..._AfterSuccess_NewKey`; `..._FormEditedWhilePending_DoesNotMutateSnapshot` |
| AC-4 | unit / component | `SubmissionGuard_Run_WhileInFlight_IgnoresSecondCall_OneRequest`; `SubmitButton_WhileInFlight_IsDisabledAndBusy`; `..._AfterFailure_IsReEnabled` |
| AC-5 | unit | `IdempotencyInterceptor_PostToGatewayClaims_AddsHeader`; `..._Get_NoHeader`; `..._OtherOrigin_NoHeader`; `..._LookalikeHost_NoHeader`; `..._AuthToken_NoHeader` |
| AC-6 | unit | `IdempotencyInterceptor_ClaimsCommandWithoutAttempt_DoesNotSendAndErrors` |
| AC-7 | unit | `WithInProgressRetry_409InProgress_WaitsRetryAfterThenResendsSameKey`; `..._NoRetryAfterHeader_Waits1Second`; `..._RetryAfterOutOfRange_Clamped`; `..._FiveWaitsThenGivesUp_KeepsAttempt`; `..._DuringWait_StatusIsWaiting`; `..._SuccessAfterRetry_ClearsAttempt`; `..._Unsubscribe_CancelsWait` |
| AC-8 | unit | `SubmissionGuard_Run_409InvalidTransition_NoRetryDiscardsAttempt_NextActionNewKey`; `..._409ConcurrencyConflict_...`; `ProblemDetailsMapper_409InProgress_DifferentKindFromBusinessConflict` |
| AC-9 | unit | `SubmissionGuard_Run_ReplayedHeader_TreatedAsSuccess`; `..._ReplayedHeaderUnreadable_StillSuccess`; `..._CreateClaim_ReadsIdFromBodyWhenLocationUnreadable` |
| AC-10 | unit | `SubmissionGuard_Run_403StoredRefusal_NoRetryNextActionNewKey` |
| AC-11 | unit | `SubmissionGuard_Run_422KeyReused_ShowsReviewMessageNewKeyNoResponseDetail` |
| AC-12 | unit | `SubmissionGuard_Run_400KeyMissingOrInvalid_GenericErrorDiscardsAttempt` |
| AC-13 | unit | `SubmissionGuard_Run_Status0_And_5xx_KeepAttemptAndReEnable` |
| 5.3 mapping | unit | `ProblemDetailsMapper_Map_RetryAfter_ParsesIntegerOnly`; `..._422KeyReused_Kind`; `..._400KeyInvalid_Kind`; `..._DoesNotExposeServerDetail` |
| AC-14 privacy | unit | `Idempotency_NeverWritesConsole_Storage_OrUrl` (spies on console and storage during a full retry flow) |
Contract tests against the generated client (parameter shape, `options.context`) are written when `claims.yaml` exists (5.1).

## 10. Implementation plan
Small conventional commits, each with tests. Steps 1 to 5 do not need the generated client; step 6 does.
1. `feat:` `createIdempotencyKey`, `IDEMPOTENCY_WAIT`, context token and `Attempt` type. Tests.
2. `feat:` problem-details mapper extension (5.3). Tests.
3. `feat:` `idempotencyInterceptor` + registration order in `app.config.ts`. Tests.
4. `feat:` `withInProgressRetry`. Tests.
5. `feat:` `SubmissionGuard` (signals, snapshot, outcome rules). Tests.
6. [BLOCKED on `claims.yaml` and regenerated client] `chore:` wire the first facade (claimant report incident) to the generated method, confirm the `idempotencyKey` parameter/`options.context` shape, finish contract tests. Update this spec if the shape differs.
7. Run `ng build` (no warnings), lint, Prettier, tests; hand off to `code-reviewer`, `security-reviewer`; end-to-end check against spec 3 when the Claims API runs (double-click, kill network mid-request, parallel same key giving 409 in progress).
Estimate: about 45 to 60 minutes for steps 1 to 5. Cut line: never cut the header/guard/in-flight protection (MUST, ADR-009 Consequences); the wait/retry operator can degrade to "show try again later, keep key" if time is short.

## 11. Risks, assumptions, open questions
**Assumptions:** the backend behaves as ADR-009 and BR-79 to BR-87 (Accepted): the 24 h retention, byte-hashed body, 409 in-progress with `Retry-After: 1`, 4xx stored only when a Refused entry was written. The client cannot distinguish a stored from an unstored 403/4xx and does not need to (new key after any definitive 4xx).

**Risks:** (1) body bytes differ between the first send and a resend if a facade rebuilds the DTO: mitigated by the frozen snapshot plus the interceptor's byte comparison. (2) A reload after an unknown outcome loses the key, so re-submitting `POST /claims` creates a second claim (BR-87 officer handles `DUPLICATE_CLAIM`): accepted for the demo, Q-I2. (3) If Gateway CORS does not yet expose `Retry-After`, `Idempotent-Replayed` and `Location` (backend TASKS section 3 item still open), the client defaults to a 1 s wait and reads the id from the body; behaviour is correct but untested end to end. (4) Generated client shape unknown until `claims.yaml` exists (5.1). (5) `JSON.stringify` of a request containing `undefined` or `Date` fields is stable per object but surprising; DTOs must be plain data. (6) Client clock or tab sleeping does not matter (no time-based key logic).

**Open questions**
- **Q-I1 (`ui-ux-designer`, human):** add the "still processing", "try again later" and "request may not have been received" texts and the disabled-with-progress submit pattern to 00 section 6, or accept the wording in 5.4.
- **Q-I2 (`architect`, `product-owner`):** memory-only key and attempt (lost on reload) is proposed. Persisting key plus body would survive reloads but stores personal data in `sessionStorage`; recommended: no.
- **Q-I3 (`architect`/backend):** confirm Gateway CORS exposes `Retry-After`, `Idempotent-Replayed`, `Location` (backend TASKS section 3 item still open) and that the 201 body of `POST /claims` carries the claim `id` so the Location fallback works.
- **Q-I4 (`architect`):** confirm the Gateway Claims route prefix used by the interceptor's path check.
- **Q-I5 (`architect`):** confirm the generator version/options pass `HttpContext` through `options` and how `Idempotency-Key` appears in generated signatures (5.1).
- **Q-I6 (`architect`):** approve the small extension of the foundation mapper and `AppError` (5.3).
- **Q-I7 (`product-owner`):** should network errors be retried automatically (bounded) rather than only on user resubmit? Proposed: user resubmit only (simpler, visible), same key.

## Build scope (steps 1 to 5)
Coded under `src/app/core/idempotency/` plus the additive `AppError`/mapper extension and the interceptor order `jwt, idempotency, problemDetails` in `app.config.ts`. `send` receives `(snapshot, context, key)`. Specs are written but were not run to completion (human instruction to save cost): karma fails on `fakeAsync` in `in-progress-retry.spec.ts` (no zone testing) and must be rewritten with a manual wait observable. Step 6 not done.

## 12. Review record
| Reviewer | Date | Verdict (REVIEWED / CHANGES REQUESTED) | Notes |
|---|---|---|---|
| architect | 2026-10-28 | REVIEWED | Fits ADR-009, BR-79 to BR-87, ARCHITECTURE sections 2a, 3a and 9, the REVIEWED foundation spec (A-F3, A-F5) and SECURITY-REQUIREMENTS (key never logged or stored, header only to the parsed Gateway origin). The outcome table 5.4 matches the backend's storability rule: keep the key only when the outcome is unknown (status 0, timeout, 5xx; a Gateway 502/504 is exactly the case where the command may have committed, so a same-key resend that replays is the right answer); discard it on every definitive 4xx. The in-progress 409 is separated by problem `type`, never by status. Memory-only attempt (Q-I2): agreed from the architecture side, because `sessionStorage` would hold personal data (answers, claim details) where any injected script can read it, and the reload risk is bounded by BR-87 (`DUPLICATE_CLAIM`); `product-owner` co-owns the answer. Steps 1 to 5 may start; step 6 waits for `contracts/openapi/claims.yaml`. |

**Architect answers.**
- **Q-I3: confirmed, both parts.** `src/Gateway/Api/CorsSetup.cs` exposes `X-Correlation-Id`, `ETag`, `Idempotent-Replayed`, `Retry-After` and `Location`, and allows `Idempotency-Key` (checked 2026-10-28; ARCHITECTURE section 2a updated, so risk 3 is closed). The `POST /claims` 201 body is `ClaimsClaimantClaimView` (renamed at the claims-api review; there are now two schemas, claimant and staff) and always includes `id` and `claimNumber` (ARCHITECTURE section 9). It is stored with the key and replayed byte for byte, so AC-9's body-first rule holds on replays too.
- **Q-I4: the prefix is `/claims`**, from Gateway route `claims` = `/claims/{**remainder}` (the catch-all also matches bare `/claims`, so `POST /claims` is covered). Gateway paths equal service paths, with no rewriting. Match by path segment: path `=== '/claims'` or `startsWith('/claims/')`, taken from `new URL(...).pathname` after any base-URL path prefix, so `/claimsX` and `/claims-archive` never match. Non-GET calls to `/notifications/**` and other routes get no key, and they must not be blocked by AC-6.
- **Q-I5: shape 1.** `claims.yaml` declares `Idempotency-Key` as a required header parameter, **inline on every command** (ADR-003: the Gateway merge accepts only `components.schemas`, so there is no shared `components.parameters`). `typescript-angular` (version pinned in `openapitools.json`, A-F3) then generates a required `idempotencyKey: string` argument and sets the header itself, and every method takes `options?: { context?: HttpContext, ... }`. The facade passes `attempt.key` and the attempt context. The interceptor **verifies** that the header equals `attempt.key` (and sets it only if absent), so there is one source of truth and a mismatch fails fast. Confirm with the contract test at step 6; if the pinned version lacks `options.context`, report back rather than patching generated code.
- **Q-I6: approved.** The extension to `AppError` and the mapper is additive (new `kind` values, optional `problemType` and `retryAfterSeconds`); existing mappings are unchanged.

**Notes to apply when coding (non-blocking).**
1. 5.3: `problemType` is the raw `type` string, compared **exactly** with the bare codes in the contract. Drop "last path segment normalised", matching foundation A-F5 and the coding note.
2. 5.1: remove the "two possible shapes" branch once step 6 confirms shape 1, and update the spec as step 6 already says.
3. 5.2: the problem types from the claims-domain review that the screens may meet are `incident-date-in-future`, `market-mismatch`, and `same-officer` (`coverage-limit-exceeded` is Phase 2 only, BA decision log 16). They are ordinary 422/409 business outcomes for the consuming screen specs. Nothing changes in this slice, because classification is by `type` and unknown types default to `conflict` or `validation`.
4. AC-6 test: add `IdempotencyInterceptor_NonGetToNotifications_SentWithoutKeyAndNotBlocked`. |

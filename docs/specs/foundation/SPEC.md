# SPEC: Foundation (scaffold, core, login, shared timeline and status badge)  (area: core + shared + login)

| Field | Value |
|---|---|
| Author | `frontend-developer` |
| Status | REVIEWED |
| Approved mockup | `docs/mockups/00-shared-patterns.md` v1, APPROVED 2026-10-28; `docs/mockups/01-login.md` v2, APPROVED by the human (Email only, `POST /auth/token`, dev-only demo-account picker; v1 approved 2026-10-28; see `APPROVALS.md`). 00 was accepted with the designer assumptions on open questions |
| Phase | P1 build |
| Stories (US-xx) / BR-xx | US-23 (role-based mock login), US-20 (token is the only identity; token only to Gateway), US-25 (run locally, generated client), US-03 and US-09 (shared timeline), US-05 (status/decision display). BR-02 (who acts, wrong role), BR-32 (dual-role user), BR-33 (claimant relabel), BR-08/09/12 (trail visibility), BR-11 (actor from token), BR-78 (claimant never staff; Officer+Manager allowed) |
| Tasks (docs/planning/TASKS.md) | Section 2 (all seven items), section 6 "Status badge, money pipe, loading and error states", section 7 security items for the foundation (token only to Gateway, safe 401/403/409, role routes guarded) |

## 1. Purpose and scope
Create the Angular 20 app skeleton every later screen builds on: configuration, authentication (mock login, token decoding, guards, redirect by role), the HTTP layer (JWT interceptor, problem-details mapping), the app shell, and the three shared pieces reused by all roles (status badge, money pipe, claim timeline). After this slice a seeded user can sign in and land in an empty, guarded role area.

**In scope:**
- Angular 20 scaffold: standalone, signals, SCSS, Angular Material, strict TypeScript, strictTemplates, ESLint (angular-eslint) and Prettier, lockfile (guidelines section 2).
- `src/app` layout per guidelines section 3: `core/`, `shared/`, `api/` (generated), `features/claimant|staff|manager` (lazy routes, placeholder landing page each).
- Environment config (build-time): Gateway base URL, a `production` flag used only to validate the URL, and a `demoAccounts` list that is non-empty only in `environment.development.ts` (production bundle contains no demo emails; `npm run check:bundle` greps `dist`). Production requires an `https` Gateway URL.
- `AuthService` (login, token in memory plus sessionStorage, claim decoding, logout, expiry via `checkSession`/`activeToken`), `authGuard` (also `canActivateChild` on the shell route, so expiry is caught between areas), `roleGuard`, `loginRedirectGuard` (already-logged-in visit to `/login`), landing-by-role.
- Functional interceptors: JWT (Gateway origin only) and problem-details error mapping to a typed `AppError`.
- App shell per 00 section 1 (toolbar, role text, logout, side nav per role) and shared `app-error-panel`, loading indicator, snackbar service (the 00 section 6 pieces the shell and login need).
- Login screen per 01.
- `app-status-badge` (all 9 statuses, claimant relabel), `MoneyPipe`, `DateTimePipe`/age helper (00 sections 2 to 4), `app-claim-timeline` (00 section 5, both audiences).
- Tests for all of the above (section 9).

**Out of scope:** every feature screen (claimant, officer, manager: later specs); the API client contents (generated, see 5.1); notifications, SSE, charts; refresh tokens and revocation (backend production gap); Phase 2 screens; Playwright smoke (COULD). Timeline data fetching: the timeline component is presentational and takes entries as input; each role's facade (later specs) loads them.

## 2. Acceptance criteria
- **AC-1 (US-23)** Given a seeded user and the right password, when they submit the login form, then the app stores the token, decodes the claims and navigates to the landing of their role: Claimant `/claimant`, Officer `/staff`, Manager `/manager`, Officer+Manager `/staff` (Q3 assumption accepted).
- **AC-2 (US-23)** Given wrong credentials (401), then the banner "Email or password is incorrect." is shown, focus moves to it, and the username is not cleared. Given 5xx/network, then "We could not sign you in. Please try again." Given a token whose roles contain none of Claimant/Officer/Manager, then "Your account has no access to this application." and no session is kept.
- **AC-3 (validation)** Empty email shows "Enter your email." (a malformed one "Enter a valid email address."); empty password shows "Enter your password."; messages are tied to the control via `aria-describedby`; submit and the demo picker are disabled only while submitting; Enter submits; double submit prevented.
- **AC-4 (BR-02, UX only)** Given a signed-in user opening an area their role does not allow, then they are redirected to their own landing with the snackbar "You do not have access to that area." Given no session, then any guarded route redirects to `/login`. The backend remains the authority (403).
- **AC-5 (BR-32)** Given the dual-role user, then the shell nav shows both "Officer" and "Manager" groups, and both `/staff` and `/manager` are reachable.
- **AC-6 (US-20, S1)** Given any request to the Gateway origin while a session exists, then `Authorization: Bearer <token>` is attached; given a request to any other origin or a relative URL not under the Gateway base URL, then no `Authorization` header is attached. The token is never in a URL, log or error message.
- **AC-7 (problem details)** Given an RFC 7807 response, then the interceptor yields an `AppError` (`status`, `kind`, safe `message` from the 00 section 6 table, optional `fieldErrors`, optional `correlationId`); raw server `detail` is never rendered unless the mapping explicitly allows a specific reason (e.g. `maker-cannot-check`, `invalid-credentials` handled by login only). 401 on a non-login call clears the session, shows "Your session has expired. Please log in again." and redirects to `/login`. 401 from `POST /auth/token` does not trigger the session-expired flow. 403, 404, 409, 422, 5xx and network errors map per the table.
- **AC-8 (expiry)** Given the token `exp` has passed, then the session is treated as absent (guards redirect to login with the expired message) and no request is sent with it.
- **AC-9 (reload)** Given a signed-in user reloads the tab, then the session is restored from sessionStorage if the token is not expired; logout clears memory and sessionStorage.
- **AC-10 (00 section 2)** `app-status-badge` renders icon plus text label plus colour for each of the 9 statuses with the labels in 00; with `audience = claimant`, PendingDecisionApproval reads "Decision under review". The text is the accessible name; the icon is `aria-hidden`.
- **AC-11 (00 section 3)** `money` pipe formats `(amount, currency)` as `SGD 8,000.00` / `IDR 12,500,000.00` with `Intl.NumberFormat` and the code always shown; null/undefined amount renders an empty string.
- **AC-12 (00 section 5, US-03, US-09, BR-09)** `app-claim-timeline` renders an ordered list oldest to newest with `<time>`; staff audience shows Public/Internal/Refused/Correction badges (text plus icon), actor name and role, reason, maker/checker/proposal id and "corrected by" flag when present; claimant audience shows no badges, ids, counts or actor names (role only) and never renders an entry marked Internal even if the server returned one (defence in depth). States: loading, empty ("No activity yet."), error with Retry; "Jump to latest" link.
- **AC-13 (security)** No `innerHTML`, no `bypassSecurityTrust*`; timeline text (summary, reason) is rendered through interpolation only.

## 3. Mockup mapping
| Mockup region | Component (file under `src/app`) |
|---|---|
| 00 s1 app shell (toolbar, "Area: X" label, sidenav, role text, logout) | `core/layout/shell.component.ts` (presentational: user, role, area label, nav groups as inputs; logout output), `core/layout/shell-container.component.ts` (wires session and router; area label from the URL prefix; moves focus to the h1/main after each navigation), `core/layout/nav-items.ts` (role to groups, URL prefix to area label) |
| 00 s2 status badge | `shared/status-badge/status-badge.component.ts` |
| 00 s3 money | `shared/pipes/money.pipe.ts` |
| 00 s4 dates, age | `shared/pipes/date-time.pipe.ts`, `shared/pipes/age.pipe.ts` |
| 00 s5 timeline | `shared/claim-timeline/claim-timeline.component.ts` plus child `timeline-entry.component.ts` |
| 00 s6 loading, empty, error | `shared/error-panel/error-panel.component.ts`, `shared/loading-bar/loading-bar.component.ts`, `shared/empty-state/empty-state.component.ts` |
| 00 s6 snackbar messages | `core/notification/notification.service.ts` (wraps `MatSnackBar`, `role="status"`) |
| 01 v2 login card, fields, banner, demo picker | `features/login/login.page.ts` (container), `login-form.component.ts` (presentational, typed form, output `submitted`) and `demo-account-picker.component.ts` (dev only, shown when `demoAccounts` is non-empty) |
Not built here: 00 s7 confirmation dialog, s9 tables (first used by the queue screens; added by the spec that first needs them).
No deviation from the approved mockups (00 v1, 01 v2). The v1/backend differences (login identifier and path) were resolved by the human in 01 v2 (section 11: Q-F1, Q-F2).

## 4. Routes, guards and structure
```
/login                 public, loginRedirectGuard
/claimant   (lazy)     authGuard + roleGuard('Claimant')  -> features/claimant/claimant.routes.ts
/staff      (lazy)     authGuard + roleGuard('Officer')   -> features/staff/staff.routes.ts
/manager    (lazy)     authGuard + roleGuard('Manager')   -> features/manager/manager.routes.ts
''                     redirect to landing for the role (or /login)
**                     redirect to landing (or /login)
```
- Each role area has a `*.routes.ts` whose `**` route renders `shared/area-placeholder/area-placeholder.component.ts` (an `h1`; title bound from route data) with a per-route document title. Later feature specs replace the placeholder; the lazy boundary and guards are final here. The shell route carries `canActivate` and `canActivateChild` with `authGuard`.
- Deep links per 00: officer `/staff/claims/:id`, manager `/manager/claims/:id` (defined by later specs).
- Guards are functional (`CanActivateFn`), read `AuthService` signals, use `Router.createUrlTree`; `roleGuard` takes the allowed role via route `data` and throws if it is missing or not a known role (a configuration error, not a user error). UX only: nothing relies on them for security.
- `core/` layout: `config/app-config.ts` (injection token reading the environment; `AppConfig` = `{ gatewayBaseUrl, demoAccounts }`, `createAppConfig` rejects a non-absolute URL and, when `production`, a non-https one), `auth/` (`auth.service.ts`, `token-decoder.ts`, `token-store.ts` (sessionStorage wrapper), `clock.ts` (`NOW` token), `messages.ts`, `identity-api.ts`, `auth.guard.ts`, `role.guard.ts`, `login-redirect.guard.ts`, `roles.ts`), `http/` (`jwt.interceptor.ts`, `problem-details.interceptor.ts`, `app-error.ts`, `problem-details-mapper.ts`), `layout/` (`shell`, `shell-container`, `nav-items`), `notification/`.
- No feature folder imports another; shared code is in `shared/` or `core/`.
- Providers in `app.config.ts`: `provideZonelessChangeDetection`, `provideRouter` with `withComponentInputBinding`, `provideHttpClient(withInterceptors([jwtInterceptor, problemDetailsInterceptor]))`, global error listeners. No animations provider (Angular Material 20 does not need one). The generated client's base-URL configuration is added in step 10.
- Zoneless is a deliberate choice: it is the Angular 20 direction, signals plus `OnPush` already drive all state so Zone.js adds nothing, and it removes a dependency and a class of change-detection surprises. Tests therefore run zoneless too (`src/test-setup.spec.ts`).

### 4.1 Auth service contract
- State (signals): `session` (readonly signal of `Session | null`), `isAuthenticated`, `user` (computed `{ id, name, market, roles }`), `roles`, `landingUrl`.
- Session checks: `activeToken()` returns the token or null (no side effects; used by the JWT interceptor); `checkSession()` returns `'active' | 'absent' | 'expired'` and clears an expired session (used by the guards).
- Methods: `login(email, password): Observable<void>` (delegates the HTTP call to the generated Identity client, see 5.1), `logout()`, `hasRole(role)`.
- `decodeToken(jwt): DecodedToken | null` (`token-decoder.ts`) reads the payload only (base64url JSON, no signature verification: the client cannot and need not verify; the backend validates). Claims: `sub`, `name`, `market`, `role` as string or array (normalised to a de-duplicated array of known roles; unknown values dropped), `exp`. Returns `null` for malformed tokens, missing `sub`/`exp`, or no known role.
- The decoded claims are used for display and routing only, never for an authorisation decision beyond UX.
- Storage: token held in a private signal (memory); mirrored to `sessionStorage` under one key as the documented dev fallback; read once at startup. Never `localStorage`. A single expiry timer is not used; expiry is checked on guard evaluation and in the JWT interceptor (no timers, deterministic tests).

## 5. API usage
### 5.1 Client generation: BLOCKED
The Angular client is generated from the Gateway's merged `GET /openapi/v1.json` (backend identity-gateway SPEC AC-8, REVIEWED 2026-10-28). That document is served by the Gateway in Development only and is built from committed `contracts/openapi/*.yaml`. At the time of writing `ChubbBackEnd/contracts/openapi/` does not exist and no code exists for Identity or Gateway. Therefore:
- Generation into `src/app/api/` is **blocked** until the backend identity slice (steps 5 to 7 of its plan) delivers `/openapi/v1.json` containing `POST /auth/token`. Nothing is hand-written or invented in the meantime; `src/app/api/` stays empty and untouched by hand once generated.
- Every step that needs generated types or operations (login HTTP call, the timeline entry and claim status types, `ClaimStatus` for the badge) is marked blocked in section 10. The scaffold, config, guards, interceptors, decoder, pipes, shell, and the login form UI with a stubbed `AuthService` boundary can proceed and be tested without it.
- Generator (A-F3): `@openapitools/openapi-generator-cli`, generator `typescript-angular`, `serviceSuffix=Api`, `providedIn=root`, `ngVersion` 20, input the Gateway `GET /openapi/v1.json`, output `src/app/api/`, run as the `package.json` script `generate:api`; recorded in the README (TASKS section 6). Until then `core/auth/identity-api.ts` is a one-method port with local types.

### 5.2 Endpoints used by this slice (from the REVIEWED backend spec; to be confirmed against the generated client)
| Operation | Caller | Request | Success | Errors and UI message |
|---|---|---|---|---|
| `POST /auth/token` (Identity via Gateway, anonymous) | login page | `{ email, password }` only | 200 `{ accessToken, tokenType: "Bearer", expiresIn: 1800 }` | 400 `validation-error`: field messages; 401 `invalid-credentials`: "Email or password is incorrect."; 413 and 5xx/network: "We could not sign you in. Please try again."; token with no known role: "Your account has no access to this application." |
No other endpoint is called. There is no `GET /auth/me`; claims come from the token (Q6 closed in the backend spec). Timeline entries and claim data arrive from later features' facades.
Request hygiene: login sends only `email` and `password`; no role, market or identity field is ever sent.

### 5.3 Problem-details mapping (00 section 6)
| HTTP | `AppError.kind` | Default message |
|---|---|---|
| 401 | `unauthenticated` | "Your session has expired. Please log in again." (not for the login call) |
| 403 | `forbidden` | "You are not allowed to do that." (specific reason only for an allow-listed problem `type`, e.g. `maker-cannot-check`, defined by the screen spec that uses it) |
| 404 | `not-found` | "We could not find that claim." |
| 409 | `conflict` | Screen-specific text supplied by the caller; default "This item was changed by someone else. The view has been refreshed." |
| 422 / 400 validation | `validation` | `fieldErrors` mapped from `errors{}`; unmapped in a banner |
| 5xx, status 0, timeout | `server` / `network` | "Something went wrong. Please try again." |
Reads `type`, `status`, `errors`, and the correlation id from the `X-Correlation-Id` response header only (exposed by the Gateway CORS policy; A-F5), shown only if it parses as a GUID. A non-JSON or malformed body falls back to the status mapping. Nothing from `detail` is displayed by default.

## 6. State and forms
- `AuthService`: signals as in 4.1; `login` uses `exhaustMap`-safe composition at the call site (login form container uses `exhaustMap` on submit events) and updates the session in a `tap`; no nested subscribes; subscription ended with `takeUntilDestroyed` in the container.
- `LoginFormComponent`: typed `FormGroup<{ email: FormControl<string>; password: FormControl<string> }>` via `nonNullable`, `Validators.required` on both with the messages in AC-3; `autocomplete="username"` and `current-password`; password show/hide `mat-icon-button` with `aria-label` and `aria-pressed`; autofocus on the first field on load; error banner `role="alert"` receives focus on failure.
- `LoginPage` signals: `isSubmitting`, `errorMessage`. Form disabled and `aria-busy` while submitting; `mat-progress-bar` shown. Already-logged-in redirect through `loginRedirectGuard`.
- Demo-account picker (01 v2): rendered only when `AppConfig.demoAccounts` is non-empty, which is a build-time choice (`environment.development.ts` lists the six seeded emails from `src/environments/demo-accounts.ts`; `environment.ts` has an empty list), so production bundles never contain them. Selecting an account prefills the email control only, announces it politely and moves focus to Password; with the panel closed (arrow keys) it fills on `selectionChange`, with the panel open it reports after the panel closes (mat-select restores focus to itself while closing). It is disabled while submitting. No password is stored in the bundle.
- Login 400 `validation-error`: `AppError.fieldErrors` for `email`/`password` (case-insensitive) are shown as field messages; with none mapped, the generic "We could not sign you in. Please try again." banner.
- Timeline states: `loading`, `entries`, `error` inputs; the empty/error/loading rendering is inside the component, Retry is an output.
- Shell: nav items computed from roles; active item `aria-current="page"` plus non-colour indicator; collapses under 960px.
- No polling in this slice.

## 7. Trail and visibility
- `app-claim-timeline` is the only place trail entries are rendered. `audience = staff` (officer and manager screens) shows all entries with Public/Internal/Refused/Correction badges, actor name and role, reason, maker, checker, proposal id and the corrected-by flag.
- `audience = claimant` shows only entries with Public visibility, no badges, no counts, no gaps, no ids, role-only actor text ("by Officer"), no Correction entries, never any Internal text. It renders what the server returns and additionally drops Internal entries as defence in depth (the server is authoritative; the filter is never relied on).
- Claimant relabel (BR-33): the status badge with `audience = claimant` shows "Decision under review" for PendingDecisionApproval. Whether the claimant sees actor role text (Q7) and earlier answers (Q22) were accepted as the designer assumed (role text shown).
- Entry types come from the generated timeline contract (blocked, 5.1); until then tests use local fixtures typed against a small test-only interface that is deleted when the generated type lands.

## 8. Security and accessibility
**Security**
- JWT interceptor attaches the token only when the request URL's origin equals the configured Gateway origin; URL parsed with `new URL`, not `startsWith` on strings (guards against `https://gateway.evil.com` and userinfo tricks); skips when no session or token expired.
- Token only in memory plus sessionStorage; never `localStorage`, URL, log, error text, `AppError` or snackbar. No `console.*`. Login failures never reveal whether the email exists (single message).
- Decoded claims are display/routing only; guards are UX; no role claim sent back to the server.
- No server-owned fields in any request from this slice. Environment files hold only the Gateway URL (and a `production` flag); no secrets, no seeded passwords in the bundle.
- No `innerHTML`, `bypassSecurityTrust*`, `eval`. Timeline and shell text via interpolation. Logout clears memory and sessionStorage and navigates to `/login`.
- 401 handling clears the session exactly once (guard against redirect loops from concurrent failing requests) and applies only to Gateway-origin requests other than `POST /auth/token`.
- `createAppConfig` rejects a non-https Gateway URL in production builds.
- Dependency hygiene: `npm audit` reviewed; `scripts/security-check.sh` (secret scan, audit) to exit 0 at hand-off (TASKS section 7).
**Accessibility**
- Login per 01: visible `mat-label`s, "(required)" in label text, `aria-describedby` for errors, banner `role="alert"` with focus, Enter submits, visible focus, contrast AA.
- Shell landmarks `header`, `nav`, `main`; one `h1` per page; per-route document titles; focus moves to the `h1` (or `main`) after each navigation; toolbar truncates long names (no overflow at 360px); menu button has `aria-expanded`; 'Jump to latest' is at least 40px; `lang="en"`; skip link to `main`; nav keyboard operable; mobile menu button has an accessible name.
- Badge and timeline badges: text plus icon plus colour; icons `aria-hidden`; theme tokens only, no hardcoded colours (guidelines section 10); `<time datetime>` carries ISO UTC.
- Error panel `role="alert"`; loading text in an `aria-live="polite"` region; snackbars `role="status"`.

## 9. Test plan
Mock HTTP with `HttpTestingController`; deterministic (fake clock via an injectable `Clock` token or fixed `exp` values); no network.
| Criterion / risk | Test type | Test name |
|---|---|---|
| AC-1, AC-5 landing by role (4 role sets) | unit | `AuthService_Login_RedirectsToLandingForEachRoleSet` / `landingUrlFor_DualRole_ReturnsStaff` |
| AC-1 claims decoded (string and array `role`) | unit | `TokenDecoder_Decode_RoleAsStringOrArray_ReturnsRoleArray` |
| decoder rejects bad tokens | unit | `TokenDecoder_Decode_MalformedOrMissingClaims_ReturnsNull`; `..._UnknownRoleOnly_ReturnsNull` |
| AC-2 no known role | component | `LoginPage_TokenWithNoKnownRole_ShowsNoAccessAndKeepsNoSession` |
| AC-2 wrong credentials | component | `LoginPage_401_ShowsGenericBannerAndFocusesIt_KeepsEmail` |
| AC-2 server error | component | `LoginPage_ServerError_ShowsTryAgainMessage` |
| AC-3 validation and double submit | component | `LoginForm_EmptyFields_ShowsMessagesLinkedByAriaDescribedBy`; `LoginPage_SubmitTwiceWhilePending_SendsOneRequest` |
| AC-3 payload hygiene | component | `LoginPage_Submit_SendsOnlyEmailAndPassword` |
| Demo picker build-time | component | `LoginPage_DemoPicker_WhenAccountsConfigured_IsRendered`; `..._NoAccountsConfigured_IsNotRendered`; `..._Selection_FillsEmailAnnouncesAndFocusesPassword`; `..._WhileSubmitting_IsDisabled` |
| AC-4 guards | unit | `authGuard_NoSession_RedirectsToLogin`; `roleGuard_WrongRole_RedirectsToLandingWithSnackbar`; `roleGuard_RightRole_Allows`; `loginRedirectGuard_Authenticated_RedirectsToLanding` |
| AC-4 routes lazy and guarded | unit | `Routes_RoleAreas_AreLazyAndGuarded` |
| AC-5 shell nav | component | `Shell_DualRole_ShowsOfficerAndManagerGroups`; `Shell_Claimant_ShowsOnlyClaimantItems` |
| AC-6, S1 token only to Gateway | unit | `JwtInterceptor_GatewayRequest_AddsBearer`; `..._OtherOrigin_NoHeader`; `..._LookalikeHost_NoHeader`; `..._NoSession_NoHeader`; `..._ExpiredToken_NoHeader` |
| AC-7 mapping, all statuses | unit | `ProblemDetailsMapper_Map_Status401_403_404_409_422_5xx_Network` |
| AC-7 no raw detail leak | unit | `ProblemDetailsMapper_Map_DoesNotExposeServerDetail`; `..._MalformedBody_FallsBackToStatusMessage` |
| AC-7 401 flow | unit | `ProblemDetailsInterceptor_401_ClearsSessionAndRedirectsOnce`; `..._LoginCall401_DoesNotTriggerSessionExpired` |
| AC-8, AC-9 expiry and restore | unit | `AuthService_Init_ExpiredStoredToken_NoSession`; `..._ValidStoredToken_RestoresSession`; `AuthService_Logout_ClearsMemoryAndSessionStorage` |
| Token never in localStorage | unit | `AuthService_Login_NeverWritesLocalStorage` |
| AC-10 badge | component | `StatusBadge_AllNineStatuses_ShowLabelIconAndAccessibleName`; `StatusBadge_ClaimantAudience_PendingDecisionApproval_ShowsDecisionUnderReview` |
| AC-11 money | unit | `MoneyPipe_Transform_FormatsSgdIdrWithCode`; `..._Null_ReturnsEmpty` |
| dates and age | unit | `DateTimePipe_Transform_FormatsLocal`; `AgePipe_Transform_DaysHoursAndHoursOnly` |
| AC-12, US-03/09, BR-09 timeline staff | component | `Timeline_StaffAudience_ShowsAllEntriesWithVisibilityBadgesActorsReasonMakerChecker` |
| AC-12 timeline claimant | component | `Timeline_ClaimantAudience_ShowsOnlyPublic_NoBadgesIdsOrNames`; `..._InternalEntryFromServer_IsNotRendered`; `..._CorrectionEntry_IsNotRendered` |
| AC-12 timeline states and order | component | `Timeline_Loading_Empty_Error_States`; `Timeline_Entries_RenderedOldestFirstInOrderedList`; `Timeline_ErrorRetry_EmitsRetry` |
| AC-13 escaping | component | `Timeline_SummaryWithHtml_IsRenderedAsText` |
| Shell a11y basics | component | `Shell_HasLandmarksSkipLinkAndAriaCurrent` |
| Config | unit | `AppConfig_Provided_ExposesGatewayBaseUrlAndDemoAccountsOnly`; `AppConfig_Production_HttpUrl_Throws`; `Routes integration: SessionExpiresBetweenAreas_NavigationEndsOnLoginWithExpiredMessage`; `LoginPage_400_ShowsFieldMessages`; `LoginPage_DemoPicker_KeyboardSelectionWithPanelClosed_FillsEmail`; `ProblemDetailsInterceptor_401FromOtherOrigin_DoesNotEndSession`; `npm run check:bundle` (production dist has no `chubb.test`) |
Tests that need generated types (timeline entries, claim status, login operation) are written against fixtures and finished when the client exists (5.1).

## 10. Implementation plan
Each step is one small conventional commit with its tests. Steps marked [BLOCKED] wait for the generated client.
1. `chore:` scaffold with `npx @angular/cli@20` (standalone, SCSS, routing, strict), Angular Material and theme tokens, ESLint (angular-eslint), Prettier, `tsconfig` flags per guidelines section 2, lockfile, `.gitignore`.
2. `feat:` environment config: `environment.ts`/`environment.development.ts` with Gateway URL (+ `production` flag) and `AppConfig` token. (Gateway URL and CORS origin `http://localhost:4200` to be confirmed with the backend README.)
3. `feat:` `core/auth`: `roles`, `TokenDecoder`, `SessionStorage` wrapper, `AuthService` (login call behind a small port until generated, see Q-F3), landing-by-role. Tests.
4. `feat:` functional interceptors (JWT, problem details), `AppError`, mapper, `NotificationService`. Tests.
5. `feat:` guards (`authGuard`, `roleGuard`, `loginRedirectGuard`) and lazy role routes with placeholder landing pages. Tests.
6. `feat:` shared pipes (money, date-time, age) and `app-status-badge`. Tests. [status type BLOCKED on generated `ClaimStatus`; use the 9 literal values from 00 until then]
7. `feat:` shell (toolbar, sidenav, role text, logout, skip link) and `app-error-panel`, loading bar, empty state. Tests.
8. `feat:` login page per 01 with demo picker (dev only). Tests. [login HTTP wiring BLOCKED on the generated Identity operation]
9. `feat:` `app-claim-timeline` (staff and claimant audiences). Tests. [entry type BLOCKED on generated timeline schema]
10. [BLOCKED] `chore:` generate client into `src/app/api/` from the Gateway `/openapi/v1.json`, commit, document the command in the README; replace test-only types and the login port with the generated ones.
11. Run `ng build` (no warnings), lint, Prettier check, tests, `scripts/security-check.sh`; update this spec if the design moved; hand off to `code-reviewer`, `security-reviewer`, `ux-accessibility-reviewer`.
Estimate: roughly 70 to 90 minutes for steps 1 to 9, plus about 15 minutes for step 10 once the OpenAPI exists. Cut line: the demo-account picker and age/date polish first; never the interceptor, guards or role routes (TASKS cut order).

## 11. Risks, assumptions, open questions
**Assumptions:** Q1 to Q3, Q7 designer assumptions accepted by the human on 2026-10-28; token claims are `sub`, `name`, `market`, `role` (string or array), `exp` (backend spec); six seeded users and one shared dev password from the backend README (never in this repo's bundle); the Gateway is the only origin called; CORS allows `http://localhost:4200`; `expiresIn` is 1800 s and there is no refresh, so expiry means a new login.

**Risks:** (1) generated client blocked on the backend, so login and the timeline types cannot be finished or contract-tested yet; (2) the login mockup and backend differences are resolved in 01 v2; (3) sessionStorage is readable by injected script, accepted as the documented dev fallback; (4) client-side role decoding can be mistaken for security, mitigated by labelling it UX only and by backend 403 handling; (5) timeline entry shape unknown until the contract exists, so the component may need rework.

**Resolved questions:**
- **Q-F1 (resolved by the human, mockup 01 v2):** the field is "Email" only, the call is `POST /auth/token` with `{ email, password }`, the message is "Enter your email.".
- **Q-F2 (resolved by the human, mockup 01 v2):** the demo-account picker is wanted in dev only, prefills the email only, the password comes from the README. Implemented as a build-time choice (see section 6). The hint "Password: see the README." is on the card.
- **Q-F3 to Q-F7:** answered by the architect below (A-F3 to A-F7).

**Architect answers (2026-10-28).**
- **A-F3 (Q-F3): yes, a one-method port now; openapi-generator `typescript-angular`.** Step 3 defines `core/auth/identity-api.ts`: an abstract class used as the DI token, `issueToken(credentials: { email: string; password: string }): Observable<{ accessToken: string }>`, with these two local types only. `AuthService` depends on it; tests provide a fake. No hand-written `HttpClient` call to `/auth/token` and no production provider until step 10; step 10 adds `core/auth/identity.facade.ts` (thin wrapper over the generated operation) provided for `IdentityApi`, and replaces the local types with the generated ones. Expiry comes from the token's `exp` claim, not `expiresIn` (one source). Generator: `@openapitools/openapi-generator-cli` (devDependency, generator version pinned in `openapitools.json`), generator `typescript-angular`, input the Gateway `GET /openapi/v1.json`, output `src/app/api/`, `serviceSuffix=Api` (so the generated `AuthApi` cannot clash with our `AuthService`), `providedIn=root`, `ngVersion` 20; run as the `package.json` script `generate:api` (set `useDocker: true` in `openapitools.json` if no local Java; Docker is already required for the backend); `src/app/api/` excluded from ESLint and Prettier, committed, documented in the README. Base URL via the generated `Configuration`/`BASE_PATH` from `AppConfig`. Why not NSwag: its Angular template reads every response as `Blob` (`responseType: 'blob'`) and throws its own `ApiException`, so our problem-details interceptor would have to parse Blobs and errors would be handled twice; it emits one large file with classes and `fromJS` boilerplate instead of interfaces and union types; and it puts a .NET runtime in the frontend toolchain. Why not wait entirely: the guards, interceptor, decoder and login form are independent of the wire types, and the port is one file. Why not a temporary hand-written client: invented contracts are exactly what ADR-003 forbids.
- **A-F4 (Q-F4): confirmed, no further hardening for the demo.** Memory signal is the source of truth; `sessionStorage` holds only the raw token under one key (never decoded claims), is read once at startup through `TokenDecoder` (malformed, expired or no known role means the key is removed), and is cleared on logout and on the 401 flow. Wrap storage access so a throwing or unavailable `sessionStorage` degrades to memory only. No cross-tab sync (each tab signs in; acceptable). Client clock skew needs no handling: a token the server rejects early or late goes through the 401 flow. Production gap (BFF with httpOnly cookie or OIDC code+PKCE, plus a CSP) recorded in backend `docs/security/SECURITY-REQUIREMENTS.md` sections 2 and 6. Why not memory only: every reload would log the user out mid-demo. Why not `localStorage`: persists after the tab closes and is shared across tabs.
- **A-F5 (Q-F5): the `X-Correlation-Id` response header is the only source.** The Gateway sets it on every response including errors (backend identity-gateway AC-11) and exposes it via CORS. Problem bodies are not guaranteed to carry it, and ASP.NET's `traceId` extension is a different id, so do not read either. Drop "or the problem body when present" from 5.3 when coding step 4. Network errors (status 0) have no id; the error panel then shows none. Display it only if it parses as a GUID. The client does not generate or send its own id in this slice (the Gateway generates one; not needed for a demo without client logging).
- **A-F6 (Q-F6): agreed as proposed.** `landingUrl` returns the area root (`/claimant`, `/staff`, `/manager`; dual role `/staff`), so 01 is followed literally; each area's `''` child later redirects to its 00 landing (`claims`, `queue`, `pending`) in the spec that builds that screen. This is consistent with both approved mockups, so no deviation. "Report form if none" is a claimant-screen behaviour, not a route redirect.
- **A-F7 (Q-F7): 5 s, polite, no action.** `MatSnackBar` with `duration: 5000`, `politeness: 'polite'` (announced through the CDK live announcer, `role="status"` on the container), no action button; the redirect itself is the outcome, so the message is informational and a timeout is acceptable. Same settings for the session-expired message. `ux-accessibility-reviewer` verifies at the screen review.
- **Notes for coding (non-blocking):** decode the JWT payload with base64url plus `TextDecoder` (UTF-8 names), not plain `atob`; detect the login call for the 401 exception by Gateway origin plus path `/auth/token` and method POST (generated call sites may not pass an `HttpContext`); the JWT interceptor need not attach a token to `POST /auth/token`; match problem `type` values exactly as they appear in the generated contract; `AppConfig` must reject a non-absolute Gateway URL (the origin check depends on it).

## 12. Review record
| Reviewer | Date | Verdict (REVIEWED / CHANGES REQUESTED) | Notes |
|---|---|---|---|
| architect | 2026-10-28 | REVIEWED | Fits CLAUDE.md, AGENTS.md, CODING-GUIDELINES sections 2 to 11, mockups 00 and 01, backend identity-gateway SPEC (REVIEWED), ADR-003 (amended: one client from the Gateway's merged `/openapi/v1.json`) and ADR-008 (claims `sub`, `name`, `market`, `role` string or array; guards UX only). Contract usage is correct: only `POST /auth/token` with `email` and `password`, no `/auth/me`, no server-owned fields, token only to the Gateway origin by parsed origin, uniform login failure, 401 handled once, nothing hand-written in `src/app/api/`. Correction entries are Internal (BR-74), so the claimant-side drop is defence in depth, not a new rule. Q-F3 to Q-F7 answered in section 11 (A-F3 to A-F7); the developer applies the small text consequences when coding the affected step (5.1 generator and command, 5.3 header-only correlation id, step 3 port file name). Frontend threat row and the browser-token/CSP production gap added to backend `docs/security/SECURITY-REQUIREMENTS.md`. **Pending the human (not decided here): Q-F1** (mockup 01 `POST /auth/login` and "Email or username" vs the backend `POST /auth/token` with email) **and Q-F2** (demo-account picker). Steps 1 to 7 and 9 may start now; step 8's field label, validation message and demo picker wait for Q-F1/Q-F2; login wiring and step 10 remain blocked on the generated client. |

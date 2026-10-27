# ChubbFrontEnd

Angular 20 single-page app for the Chubb claims platform. One app serves three role-based areas: claimant, claims officer and claims manager. It calls only the backend Gateway in `../ChubbBackEnd`.

**Status: foundation only.** Area screens are placeholders, and login cannot sign in yet (see [Blocked](#blocked)).

## Prerequisites

- Node.js 22 (tested with Node 22.22.2 and npm 10.9.7)
- Google Chrome for unit tests (tested with Chrome 154). Set `CHROME_BIN` if it is not on `PATH`.
- The backend Gateway on http://localhost:8080 for anything that calls the API (see `../ChubbBackEnd/README.md`).

## Run

```bash
npm ci
npm start        # ng serve on http://localhost:4200 (development configuration)
```

The Gateway must allow the origin `http://localhost:4200`. The backend compose default does.

## Commands

| Command | What it does | Last result (2026-10-28) |
|---|---|---|
| `npm ci` | Clean install from `package-lock.json` | Passed; 0 vulnerabilities |
| `npm start` | Dev server on port 4200 (`ng serve`) | `/login` returned HTTP 200 |
| `npx ng test --watch=false --browsers=ChromeHeadless` | Unit tests (Karma and Jasmine) | 92 of 92 passed |
| `npm run build` | Production build into `dist/chubb-claims-frontend` | Passed |
| `npm run check:bundle` | Fails if the production build contains `chubb.test` | Passed, after a build (see [Known gaps](#known-gaps)) |
| `scripts/security-check.sh` | Secret scan, `npm audit --audit-level=high`, Prettier, dist leak check | `RESULT: FAILED`: gitleaks MISSING. npm audit, Prettier and the dist check passed |

`npm test` runs `ng test` in watch mode. Use the headless command above for one-off runs.

## Built

- **Scaffold:** Angular 20 standalone components, signals, zoneless change detection, Angular Material.
- **Auth:** `AuthService` (login through an `IdentityApi` port, token decoding, expiry check, logout), `authGuard`, `roleGuard`, `loginRedirectGuard`, landing page by role.
- **HTTP:** JWT interceptor, which sends the token only to the Gateway origin (matched on the parsed origin). Problem-details interceptor maps 400/422, 401, 403 and 409.
- **Shell:** toolbar with the "Area: X" label, role navigation and logout.
- **Shared:** claim timeline (Public and Internal badge, shown to staff only), status badge for all nine statuses, money, date and age pipes, error panel, empty state and loading bar.
- **Login page:** Email and password form, with a dev-only demo-account picker.
- **Area routes:** `/claimant`, `/staff` and `/manager` are lazy-loaded. Their screens are placeholders.

## Blocked

- **API client generation.** `src/app/api/` does not exist yet. The client is to be generated from the Gateway's merged OpenAPI at `http://localhost:8080/openapi/v1.json` (Development only). That document currently contains only `POST /auth/token`, because the Claims, Reporting and Notification contracts are not written yet. The generator script is not in `package.json` yet.
- **Real login.** `AuthService` has no `IdentityApi` implementation, so sign-in shows "We could not sign you in" until the generated client is wired (foundation spec, step 10).
- **Claim data screens** (timeline entry types, claim status types) wait for the Claims contract.

## Authentication and token storage

- The token is held in memory and mirrored to `sessionStorage` under one key. That mirror is a documented dev fallback, so a page reload does not sign the user out. It is never written to `localStorage`, a URL, a log or an error message.
- **Production target:** a BFF that keeps the token in an httpOnly, SameSite cookie, or the OIDC code flow with PKCE and memory-only tokens. A Content-Security-Policy is also needed; none is served today. Both are listed as production gaps in `../ChubbBackEnd/docs/security/SECURITY-REQUIREMENTS.md` (section 6).
- Role decoding in the browser is for layout only. The backend enforces every role check.

## Gateway and CORS

- Only the Gateway is called. `src/environments/environment.development.ts` sets `http://localhost:8080`.
- The Gateway allows `http://localhost:4200` and exposes the `X-Correlation-Id` header. Other origins get no allow-origin header (checked).
- `src/environments/environment.ts` (production) has the placeholder `https://gateway.example.com`. A production build rejects a non-https Gateway URL. Replace it before deployment.

## Demo accounts (dev only)

- The six seeded users are listed in `src/environments/demo-accounts.ts`. Only `environment.development.ts` imports that list. `environment.ts` has an empty list, so the picker is hidden and the emails are not in the production bundle.
- The picker fills in the Email field only. The password is the shared dev password documented in `../ChubbBackEnd/README.md`.

## Known gaps

- `npm run check:bundle` passes when `dist/` is missing, because `! grep` treats grep's "no such file" error as success. Run `npm run build` first. Found on 2026-10-28 and not fixed here.
- The picker's hint says "Password: see the README". In this repo, that README does not contain the password. It is in the backend README.
- gitleaks is not installed, so `scripts/security-check.sh` exits 1 on this machine.
- Sessions last 30 minutes (the token lifetime). There is no refresh, so an expired session means signing in again.

## Related

- Backend and run instructions: `../ChubbBackEnd/README.md`
- Foundation spec: `docs/specs/foundation/SPEC.md`
- Mockups and approvals: `docs/mockups/` (`APPROVALS.md`)
- Task list: `docs/planning/TASKS.md`
- AI working journal: `../ChubbBackEnd/docs/journal/AI-JOURNAL.md`

# CLAUDE.md – ChubbFrontEnd

Angular frontend for the Chubb APAC claims platform (take-home assessment). Spec: `../Assessment/AssessmentSpec.docx`. Task list: `docs/planning/TASKS.md`.
The backend is the priority; build the frontend after the Claims service is demoable. A partial frontend is acceptable.

## Stack (agreed)
- Angular 20, standalone components, signals, new control flow (`@if`, `@for`), strict TypeScript
- Angular Material for UI, SCSS
- Reactive forms, `HttpClient` with functional interceptors
- API client generated from the backend OpenAPI spec (openapi-generator or NSwag) into `src/app/api/`, committed. Never hand-edit generated code.
- Tests: Jest or Karma/Jasmine for units (use the CLI default if unsure)
- Node 22 is installed; the Angular CLI is not (use `npx @angular/cli@20`)
- All calls go through the backend Gateway only (single base URL from environment config)

## Scope
Phase 1 screens only (claimant, officer, manager; trail and maker-checker). Payment, ledger and pool fund screens are Phase 2: designed, not built. Backend design: `../ChubbBackEnd/docs/architecture/ARCHITECTURE.md`; stories: `../ChubbBackEnd/docs/product/user-stories.md`.

## One app, three roles
- Roles: Claimant, Officer, Manager. Mock login against the backend Identity service; store the JWT in memory plus sessionStorage.
- Lazy-loaded feature areas with role guards: `/claimant`, `/staff`, `/manager`. Redirect by role after login.
- Shared: status badge, money pipe (by currency), error/loading states, problem-details error mapping.

## Screens
- Claimant: report incident (dynamic motor/property fields, market select), my claims, claim detail with timeline, respond to info request, see decision.
- Officer: incoming queue with market/type filters and pick-up, claim detail, request info, approve/reject (reason required)/settle, own workload.
- Manager: outstanding claims by status/market/type, liability exposure by market and type, team workload and performance.
- Manager dashboard refreshes by SSE or 5–10s polling ("real-time").

## Layout
```
src/app/
  api/          generated client (do not edit)
  core/         auth service, guards, interceptors, config
  shared/       status badge, money pipe, common components
  features/
    claimant/   staff/   manager/
```

## Conventions
- Follow `docs/guidelines/CODING-GUIDELINES.md` (binding for all code). Agent roster and workflow: `AGENTS.md`.
- Feature code calls the generated client through thin facade services; components stay presentational where practical.
- Use signals for state; avoid heavy state libraries.
- No business rules in the UI that the backend does not enforce. The UI mirrors allowed actions from claim status but the backend is authoritative.
- Small conventional commits (`feat:`, `fix:`, `test:`, `docs:`, `chore:`). Append to the shared AI journal in the backend repo (`../ChubbBackEnd/docs/journal/AI-JOURNAL.md`) or keep `docs/AI-JOURNAL.md` here, whichever the user decides.
- Do not add features outside `docs/planning/TASKS.md`. Cut COULD items first; polish is last.

## Build order
1. Scaffold app, Material, routing, config, auth and guards
2. Generate API client once the backend OpenAPI exists
3. Claimant flow, then Officer flow, then Manager dashboard
4. Tests for guards, claim form, dashboard
5. README and walkthrough notes

## Dependencies on backend
- OpenAPI spec from the Gateway, the seeded users and credentials (from the backend README), and CORS enabled for the dev origin.

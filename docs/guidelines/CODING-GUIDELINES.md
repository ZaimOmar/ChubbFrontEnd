# Coding Guidelines – ChubbFrontEnd (Angular 20 / TypeScript)

Binding for every coding agent (`frontend-developer`, `frontend-qa-engineer`) and checked by `code-reviewer`, `security-reviewer` and `ux-accessibility-reviewer`. Goal: code a new engineer can read once and defend in the walkthrough. Development of a screen starts only after its mockup is approved.

## 1. Principles
1. Correct first, then clear, then fast. Do not optimise without a measured reason.
2. Simple over clever. No speculative abstractions, no state library, no wrapper for its own sake.
3. The backend is authoritative. The UI reflects allowed actions; it never invents rules.
4. Every view handles loading, empty and error states.
5. Every change is small, tested and reviewable on its own.

## 2. Project setup (enforced)
- TypeScript `strict: true`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`; Angular `strictTemplates`.
- ESLint (angular-eslint) and Prettier configured; lint, format and `ng build` must pass with no warnings.
- Lockfile committed; no unused dependencies; `npm audit` reviewed.
- Generated API client in `src/app/api/` is never edited by hand. Regenerate from the Gateway OpenAPI spec.

## 3. Structure
```
src/app/
  api/        generated client (do not edit)
  core/       auth service, guards, interceptors, config, error mapping
  shared/     presentational components, pipes (status badge, money), directives
  features/
    claimant/   staff/   manager/      lazy-loaded routes, one folder per role
      <feature>/ pages/ (routed containers) components/ (presentational) <feature>.facade.ts
```
- Feature folders do not import from each other; shared code goes in `shared/` or `core/`.
- One component, pipe or service per file, named `thing.component.ts`, `thing.pipe.ts`, `thing.facade.ts`.

## 4. Naming
- Classes `PascalCase` with role suffix (`ClaimListComponent`, `ClaimsFacade`). Selectors prefixed `app-`. Files `kebab-case`.
- Signals are nouns (`claims`, `isLoading`); computed values describe the derived thing (`openClaims`). Observables end in `$` only if exposed.
- Booleans read as questions (`isLoading`, `canApprove`). No abbreviations except well-known ones.

## 5. Components
- Standalone, `ChangeDetectionStrategy.OnPush`, `inject()` for DI, `input()`/`output()` signal APIs.
- Containers (pages) fetch via facades and pass data down; presentational components take inputs, emit outputs and make no HTTP calls.
- Keep templates small (about 50 lines). Extract a child component instead of nesting. No logic in templates beyond simple conditions; use `computed`.
- Use `@if`, `@for` (always with `track`), `@switch`. No `*ngIf`/`*ngFor`.
- Templates: no function calls that do work; use signals/computed/pipes.

```ts
// Good
@Component({
  selector: 'app-claim-actions',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (canApprove()) { <button mat-flat-button (click)="approve.emit()">Approve</button> }
    @if (canReject())  { <button mat-stroked-button (click)="reject.emit()">Reject</button> }
  `,
})
export class ClaimActionsComponent {
  readonly status = input.required<ClaimStatus>();
  readonly approve = output<void>();
  readonly reject = output<void>();
  protected readonly canApprove = computed(() => this.status() === 'UnderReview');
  protected readonly canReject = computed(() => this.status() === 'UnderReview');
}
```

## 6. State and RxJS
- Local state with signals; derived state with `computed`; side effects with `effect` sparingly. Facades expose read-only signals and methods.
- RxJS only for streams (HTTP, polling, SSE). Never nest subscribes; compose with `switchMap`, `exhaustMap` (submits), `combineLatest`.
- Clean up with `takeUntilDestroyed()` or `toSignal`. No manual `subscribe` in components where `toSignal`/`async` works.
- Polling uses `timer` + `switchMap` with `takeUntilDestroyed`, paused when the tab is hidden if cheap to do so.

## 7. Forms
- Typed reactive forms (`FormBuilder.nonNullable`). Validation rules mirror the API contract (required, max length, positive amount).
- Show error messages next to fields, tied to the control with `aria-describedby`. Disable submit while pending to prevent double submits (`exhaustMap`).
- Dynamic motor/property fields via separate sub-forms, not hidden inputs.

## 8. HTTP, errors, auth
- All calls go through facade services that wrap the generated client. No `HttpClient` in components.
- Functional interceptors: attach JWT only to the Gateway origin; map RFC 7807 problem details to a typed `AppError`; handle 401 (redirect to login), 403, 404, 409 (e.g. "claim already picked up", offer refresh), 5xx (generic message).
- Never display raw server messages that could leak internals. Never log tokens or claim/personal data.
- Guards are UX only; the backend enforces access.

## 9. Types
- No `any`. Use generated types, `unknown` plus narrowing, or small local types. Prefer `readonly`, union types for statuses, and exhaustive `switch` with a `never` check.
- Money is displayed through one `MoneyPipe` using `Intl.NumberFormat` with the claim's currency; never format by hand. Dates through one pipe, UTC from the API shown in local time consistently.

## 10. UI, accessibility, styling
- Angular Material components, theme tokens for colour; no hardcoded colours or magic pixel values; SCSS per component, no global overrides without reason.
- Semantic HTML, a label for every input, visible focus, full keyboard operation, contrast AA, status never by colour alone (badge has text).
- Confirmation dialog for reject and settle. Announce async results (`aria-live`) for polling dashboards.
- Responsive at common widths; follow the approved mockup exactly. Deviations go back to `ui-ux-designer` and the human.

## 11. Security
- No `innerHTML` with untrusted data; no `bypassSecurityTrust*`; no `eval`. Claim text is rendered only through Angular's escaping.
- Token in memory (sessionStorage only as documented dev fallback); never in URLs or logs. Environment files hold only public config (gateway URL).
- Do not send server-owned fields (status, assignee, reserve) in requests.

## 12. Performance (only what is cheap and obvious)
- Lazy-load role areas; `track` in `@for`; `OnPush`; paginate lists using the API's paging; avoid re-creating objects in templates.

## 13. Comments and documentation
- Comments explain *why*. No commented-out code, no `console.log`, no TODO without a reason. Public facade methods have a one-line doc comment if the name is not enough.

## 14. Tests (see `frontend-qa-engineer`)
- Unit/component tests for guards, interceptors, pipes, the claim form (validation, motor vs property), officer actions by status, and the dashboard (loading/empty/error). Mock HTTP with `HttpTestingController`; query by role/label; deterministic; no real network or timers.

## 15. Git
- Small conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`), imperative subject under 72 chars. One concern per commit. Never commit `.env` or secrets.

## 16. Pre-handoff checklist (every coding agent, every change)
- [ ] The screen's mockup is APPROVED and the implementation matches it
- [ ] `ng build` no warnings; ESLint and Prettier clean; tests green
- [ ] Standalone + OnPush + signals; `@for` has `track`; no nested subscribes; no leaked subscriptions
- [ ] Loading, empty, error (incl. 409) states handled; forms validate with accessible messages
- [ ] No `any`, `console.log`, `innerHTML`/`bypassSecurityTrust*`, dead code, secrets or unrelated changes
- [ ] Generated API code untouched; all HTTP via facades
- [ ] Ready for `code-reviewer`, `security-reviewer`, `ux-accessibility-reviewer`

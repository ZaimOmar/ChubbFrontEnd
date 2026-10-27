# 01 Login (v2)

Changes from v1: field is "Email" only (no username); endpoint fixed to `POST /auth/token`; demo-account picker specified (dev builds only, prefills email only, six seeded users); dual-role landing confirmed as Officer area.

- **Purpose:** Mock login as a seeded user; redirect to the role's area.
- **Persona:** All (Claimant, Officer, Manager, dual-role user).
- **Priority:** MUST P1. **Story:** US-23 (AC: valid seeded credentials give a JWT and the role's area; wrong-role area redirects/403). Rules: BR-02, BR-32.
- **API:** Identity via Gateway `POST /auth/token` (anonymous), body `{ "email": string, "password": string }`; 200 `{ accessToken, tokenType: "Bearer", expiresIn: 1800 }`; 400 `validation-error`; 401 `invalid-credentials`; 413. Source: `../ChubbBackEnd/docs/specs/identity-gateway/SPEC.md` (AC-1, AC-2, AC-3). No `/auth/me`: the frontend decodes token claims (`sub`, `name`, `market`, `role[]`). Token kept in memory + sessionStorage only.
- **Route:** `/login` (public). Shared patterns: see 00.

## Layout
```
+--------------------------------------------------+
|                 Chubb Claims                     |
|                                                  |
|   +------------------------------------------+   |
|   | Sign in                              (h1) |   |
|   |                                          |   |
|   | Email (required)                         |   |
|   | [______________________________]         |   |
|   | Password (required)                      |   |
|   | [______________________________] [eye]   |   |
|   |                                          |   |
|   |                         [ Sign in ]      |   |
|   |  - - - - - - - - - - - - - - - - - - -   |   |
|   | DEV ONLY (not in production builds)      |   |
|   | Demo account                             |   |
|   | [Select a demo account            v]     |   |
|   | Fills the email only. Password: README.  |   |
|   +------------------------------------------+   |
+--------------------------------------------------+
```
The picker sits below the Sign in button, after the real form in tab order, in a visually separated "Dev only" block, so the production form is unchanged by its absence. Selecting an option sets the Email field value and moves focus to the Password field.

## Demo-account picker (dev builds only)
`mat-select` labelled "Demo account". Options (label shows role, then the display name; value is the email):

| Option label | Prefills Email with |
|---|---|
| Claimant (SG) - Alex Claimant | `claimant@chubb.test` |
| Claimant 2 (HK) - Bao Claimant | `claimant2@chubb.test` |
| Officer - Olivia Officer | `officer@chubb.test` |
| Officer 2 - Omar Officer | `officer2@chubb.test` |
| Manager - Marcus Manager | `manager@chubb.test` |
| Officer + Manager (dual-role) - Dana Dual | `officer.manager@chubb.test` |

Rules:
- Prefills the Email field only. It never sets, stores or embeds a password; the shared dev password comes from the README (and `.env.example`) and is typed or pasted by the developer.
- Rendered only when the Angular environment flag for dev is true (for example `environment.production === false`); the block, the option list and the email literals are excluded from production builds (guarded by the environment flag so the build can tree-shake them). Never shown in a deployed/production environment.
- The picker is not a form control of the login form (not submitted, not validated); it only patches the Email control.
- Reselecting the same option re-applies the email.

## Components (Angular Material)
`mat-card`, `mat-form-field` + `matInput` (x2), `mat-icon-button` (show/hide password, `aria-label="Show password"`, `aria-pressed`), `mat-flat-button` Sign in, `mat-progress-bar`, error banner, dev-only `mat-select` "Demo account" (inside a `mat-divider`-separated block, `@if (!environment.production)`).

## Fields and validation
| Field | Rule | Message |
|---|---|---|
| Email | required; valid email format (API returns 400 on bad format, max 254 chars) | "Enter your email." / "Enter a valid email address." |
| Password | required | "Enter your password." |

## Actions
Sign in: always enabled except while submitting. On success redirect by decoded `role` claim: Claimant `/claimant`, Officer `/staff`, Manager `/manager`. The dual-role user (token `role` contains both Officer and Manager) lands in the Officer area `/staff`; the navigation shows both Officer and Manager groups (see 00). Enter key submits.

## States
- Loading: button shows spinner, form (and picker) disabled, `aria-busy`.
- Empty: n/a.
- Error 401: banner "Email or password is incorrect." (never says which). Focus moves to banner.
- Error 400: field messages as above. Error 413/5xx/network: "We could not sign you in. Please try again."
- 409: n/a. 403 after login (token has no known role): "Your account has no access to this application."
- Already logged in: visiting `/login` redirects to landing.

## Accessibility
- Visible labels on all fields; autocomplete `email` (or `username`) for Email and `current-password` for Password; input `type="email"`.
- Focus lands on Email on load; error banner `role="alert"` and receives focus on failure; Email is not cleared on error.
- Demo picker: has a visible label "Demo account" and a hint "Fills the email only"; the "Dev only" heading is text, not colour or icon alone; reachable by keyboard after Sign in (Tab order: Email, Password, show/hide, Sign in, Demo account); opens with Enter/Space/arrow keys (native `mat-select` behaviour); on selection, announce via a polite live region "Email filled with officer@chubb.test" and move focus to Password.
- Option labels state the role in words (not colour), so screen readers read "Officer + Manager (dual-role)".
- Contrast per 00; the dev-only block uses a text label, not just a dashed border.

## Open questions
Q1 and Q3 from v1 are resolved in this version per the human's delegation (picker included, email only, passwords from README; dual-role lands in Officer area); human to confirm with v2 approval.

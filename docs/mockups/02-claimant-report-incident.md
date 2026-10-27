# 02 Claimant: Report incident (v1)

- **Purpose:** Submit a motor or property claim; get a claim number and status Submitted.
- **Persona:** Claimant. **Priority:** MUST P1.
- **Story:** US-01 (ACs: valid input gives claim number, status Submitted, currency of the policy's market, one Public "Claim received" entry; invalid input gives validation errors and no claim). Rules: BR-04, BR-08, BR-22, BR-23, BR-25, BR-75.
- **API:** `POST /claims` (claimant). Currency derived server-side from market; status, number, reserve, actor are server-owned and never sent.
- **Route:** `/claimant/report`. Shared patterns: 00.

## Layout
```
Report an incident                                               (h1)
+------------------------------------------------------------------+
| Policy details                                                   |
| Policy number (required)  [ POL-SG-100234 ]                      |
| Market (required)         [ Singapore (SGD)          v ]         |
| Claim type (required)     (o) Motor   ( ) Property               |
+------------------------------------------------------------------+
| Incident details                                                 |
| Incident date (required)  [ 27/10/2026 ] [cal]                   |
| Description (required)    [                                 ]    |
|                           [                                 ] 0/2000|
| Estimated amount (required)  SGD [ 10,000.00 ]                   |
+------------------------------------------------------------------+
| Motor details  (shown only when type = Motor)                    |
| Vehicle registration (required)  [ SGX1234A ]                    |
| Accident location (required)     [ ______________ ]              |
| Third party involved?            [ ] Yes                         |
+------------------------------------------------------------------+
| Property details (shown only when type = Property)               |
| Property address (required)      [ ______________ ]              |
| Cause of damage (required)       [ Fire / Water / Theft / Other v]|
+------------------------------------------------------------------+
                                      [ Cancel ]  [ Submit claim ]
```
Success view (replaces form, same route, focus on heading):
```
(check icon) Claim received                                      (h1)
Your claim number is  CLM-SG-2026-000123   [Copy]
Status: [ Submitted ]   Amount claimed: SGD 10,000.00
[ View my claim ]   [ Report another incident ]
```

## Components
`mat-card` sections, `mat-form-field` + `matInput`, `mat-select` (market), `mat-radio-group` (type), `mat-datepicker` (max = today), `textarea matInput` with `mat-hint` counter, `mat-checkbox`, `mat-flat-button`/`mat-stroked-button`, `mat-progress-bar`, error summary, `app-status-badge`, `money` pipe.

## Fields and validation
Motor/property fields are dynamic: switching type shows the matching group, clears the other group and removes its validators. Exact extra field names are placeholders pending the OpenAPI schema (Q4); the client never invents fields the API lacks.

| Field | Rule | Message |
|---|---|---|
| Policy number | required, pattern per API | "Enter your policy number." / "Policy number format is not valid." |
| Market | required, one of SG, HK, MY, TH, ID, AU | "Choose a market." |
| Claim type | required | "Choose motor or property." |
| Incident date | required, not in the future | "Enter the incident date." / "Incident date cannot be in the future." |
| Description | required, 10 to 2000 chars | "Describe what happened (at least 10 characters)." |
| Estimated amount | required, > 0, max 2 decimals | "Enter an amount greater than 0." |
| Vehicle registration (motor) | required | "Enter the vehicle registration." |
| Accident location (motor) | required | "Enter where the accident happened." |
| Property address (property) | required | "Enter the property address." |
| Cause of damage (property) | required | "Choose the cause of damage." |

Selecting a market shows the currency in the amount prefix (BR-23); the currency is read-only. Server 422 errors map back to fields (e.g. "Policy not found for this market.").

## Actions and status
Submit claim: always available; creates Submitted claim. Cancel: back to My claims with unsaved-changes confirm if the form is dirty. No status-driven actions (new claim).

## States
- Loading: Submit shows spinner, form disabled.
- Empty: n/a (blank form).
- Error 422: summary + per-field messages, no claim created, entered values kept.
- Error 403 (policy not the user's): "This policy is not linked to your account."
- Error 5xx/network: banner "We could not submit your claim. Nothing was saved. Please try again."; values kept.
- 409: duplicate submission (double click) message "This claim was already submitted." with link to it (if API returns one; Q5).
- Success: view above; the displayed number and status come from the server response.

## Accessibility
Radio group has a legend "Claim type"; dynamic groups announced with `aria-live="polite"` ("Motor details added"); date picker keyboard operable plus typeable field; error summary focused on failed submit; success heading focused.

## Open questions
Q4 Exact motor/property extra fields (need OpenAPI). Q5 Duplicate-submission behaviour. Q6 Is policy number free text or chosen from the user's policies? (Mockup assumes free text.)

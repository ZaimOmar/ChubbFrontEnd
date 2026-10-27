# 12 Claimant: My claims (v1)

- **Purpose:** List my claims with status and open one. **Persona:** Claimant. **Priority:** SHOULD P1 (cut: merge into screen 03; if cut, landing goes straight to the report form and the last claim).
- **Story:** US-02 (AC: I see exactly my claims; another claimant's id gives 403/404). Rules: BR-12. **API:** `GET /claims/mine`. **Route:** `/claimant/claims`.

## Layout
```
My claims                                      [ Report an incident ]   (h1)
+---------------------------------------------------------------------+
| Claim number        | Type     | Amount claimed | Status          | Last update   |
| CLM-SG-2026-000123  | Motor    | SGD 10,000.00  | [Under review]  | 28 Oct 11:30  |
| CLM-SG-2026-000101  | Property | SGD 52,000.00  | [Approved]      | 20 Oct 09:00  |
+---------------------------------------------------------------------+
```
Claim number links to screen 03. Info-requested rows show an extra text "Action needed". Claimant status labels per 00 section 2 (pending shown as "Decision under review").

## Components
`mat-table`, `app-status-badge`, `money` pipe, `mat-paginator` if > 25, `mat-flat-button`.

## Actions
Open claim; Report an incident. No status-driven actions.

## States
Loading skeleton rows. Empty: "You have no claims yet." + [Report an incident]. Error: error panel with Retry. 403/401 per shared mapping. 409: n/a.

## Accessibility
Table caption "My claims"; "Action needed" is text with icon.

# 18 Role-aware Home / landing (v1, PENDING)

- **Purpose:** One obvious starting page per role showing what needs attention and the main next action.
- **Personas / routes:** Claimant `/claimant/home`, Officer `/staff/home`, Manager `/manager/home`. Shell and tokens per 00 v2. Stories: US-02, US-06, US-10, US-13, US-14, US-30 (summary views of already-designed screens 12, 04, 17, 10, 11, 08).
- **Rules:** Home only summarises; every tile/row links to the existing screen. Each block loads independently (own loading/empty/error), so one failing call never blanks the page.

## 18a Claimant Home
```
Welcome back, Sam                                                    (h1)
+----------------------------------------------+ +---------------------------+
| Something happened?                           | | Notifications (3 new)      |
| Report an incident in about 5 minutes.        | | * Claim CLM-SG-..118       |
| [ Report incident ]  (large primary button)   | |   was approved   2h ago    |
+----------------------------------------------+ | * Claim CLM-SG-..097       |
                                                  |   under review   1d ago    |
My claims                                [View all]| [View all notifications]   |
+------------------------------------------------+---------------------------+
| > CLM-SG-2026-000118  Motor  SGD 10,000.00  [Approved]       28 Oct 2026   >|
| > CLM-SG-2026-000097  Property SGD 4,200.00 [Under review]   26 Oct 2026   >|
+----------------------------------------------------------------------------+
```
- Claims list = shared clickable list (19, "compact" variant, latest 5). Chips use claimant labels. Row links to `/claimant/claims/:id`.
- Empty claims: illustration-free empty state "You have no claims yet." + [Report incident].
- Notifications: shows last 5, unread marked with bullet AND the text "New". **Contract gap:** no claimant `GET /claims` and no notifications endpoint in `claims.yaml` (SPEC section 1 defers both). Until they exist, the claims card and notifications card are not rendered, and Home shows the CTA plus "Open a claim you just reported" link to the last claim reported in this session (client memory only). Flagged as Q-H1.

## 18b Officer Home
```
Good morning, Aisha                                                  (h1)
+--------------+ +--------------+ +----------------+ +------------------+
| Incoming     | | Assigned to  | | Waiting on     | | Oldest incoming  |
| 12           | | me   5       | | checker   2    | | 3d 4h            |
| [Open queue] | | [View]       | | [View]         | | CLM-SG-..118  >  |
+--------------+ +--------------+ +----------------+ +------------------+
Next in queue (oldest first)                          [Open full queue]
 shared clickable list, 5 rows, with [Pick up] button per row (as 04)
My assigned claims                                   [View all]
 shared clickable list, 5 rows, status chip, "Action needed" text when
 UnderReview and no assessed amount ("Assess") or ready to propose ("Propose")
```
- Tiles are `<a>` cards (whole tile clickable, one `h2`, number is `--t-kpi`). Tile text includes the label so screen readers read "Incoming claims, 12".
- Data: `ListClaims status=Submitted sort=oldest pageSize=5` (+ total), `ListClaims assigneeId=me` (counts per status client-side from page of up to 100; flag if more). Workload tile count needs 17; until built, show counts derived above.
- Empty queue: "The queue is empty. Nice work." Error per block: error panel with Retry.

## 18c Manager Home
```
Overview                                                             (h1)
+----------------+ +----------------+ +-------------------+ +--------------+
| Pending        | | Outstanding    | | Exposure (USD,    | | Oldest       |
| approvals  4   | | claims   37    | | reporting rate)   | | pending 2d 1h|
| [Review]       | | [View]         | | USD 1,284,500.00  | |              |
+----------------+ +----------------+ +-------------------+ +--------------+
Pending approvals (oldest first)                      [View all]
 shared clickable list, 5 rows: claim, outcome+amount, proposed by, age, chip
 rows proposed by me show text "You proposed this" (cannot check)
Exposure by market (top 3)                       [See exposure]
 plain table: Market | Open claims | Liability (local) 
```
- Pending list data: `ListClaims status=PendingDecisionApproval sort=oldest` (G1/B1). Outstanding and exposure tiles need the dashboard endpoints of 10/11; **not in the Claims contract** (SPEC 1). Tiles for Outstanding/Exposure render only once those endpoints exist; until then Home shows Pending tiles/list only (Q-H2). USD always labelled "USD (reporting rate)".

## Components (Angular Material / plain CSS)
`mat-card` (tile, `appearance="outlined"`), `mat-button`/`mat-flat-button`, `mat-icon`, `mat-progress-bar`, CSS grid: 4 columns >=1200px, 2 columns >=600px, 1 column below. Tile = `<a class="tile">` containing `h2`, KPI, hint.

## States
Loading: skeleton block per card + `aria-busy`. Empty: per block sentence + next action. Error: `app-error-panel` + Retry per block. 409: only on Pick up in Officer list (banner as 04). 401: redirect to login.

## Actions by status
Home itself has none besides Pick up (Submitted rows). Navigation only otherwise.

## Accessibility
`h1` greets; blocks are `section aria-labelledby`. Tile and row link names include claim number or metric. Counts update via `aria-live="polite"`. Unread = text "New" + bullet. Keyboard: tiles and rows are single tab stops.

## Open questions
- Q-H1 Claimant claims list and notifications: need a claimant list endpoint and notifications API (not in contract); accept the reduced Home until then?
- Q-H2 Manager Outstanding/Exposure tiles: hide until dashboard endpoints exist (assumed)?
- Q-H3 Greeting by first name: contract has no names; show email local part or just "Welcome back"? (assumed "Welcome back").

# 17 Officer: My workload (v1)

- **Purpose:** My open claims by status with ageing; pending ones shown as "waiting on checker".
- **Persona:** Officer. **Priority:** SHOULD P1 (cut after US-17).
- **Story:** US-10 (AC: 3 assigned claims, 1 Settled gives 2 open grouped by status with ageing in days; Pending* shown as waiting on checker). Rules: BR-28.
- **API:** `GET /staff/workload`. **Route:** `/staff/workload`.

## Layout
```
My workload                                                   (h1)
Open claims: 4     Waiting on checker: 1
Under review (2)
| Claim              | Type  | Amount        | Age  | |
| CLM-SG-2026-000123 | Motor | SGD 10,000.00 | 3d   | [Open] |
Info requested (1)
| ...                                  | due 11 Nov 2026 |
Waiting on checker (1)   (hourglass icon)
| CLM-HK-2026-000041 | Property | HKD 52,000.00 | 1d | [Open] |
```
Groups use the status badge text; "Waiting on checker" replaces the Awaiting checker label for the officer's own claims. Age is days since submission (BR-28).

## Components
`mat-accordion`/`mat-expansion-panel` per status group (all open by default) or headed tables, `app-status-badge`, `money`, `mat-button`.

## Actions
Open claim only. No status-driven actions.

## States
Loading skeleton. Empty: "You have no open claims. Pick one up from the queue." + link. Error: error panel with Retry. 403: "Only officers can view a workload." 409: n/a.

## Accessibility
Group headings are `h2` with count in text; tables have captions.

# Mockup approvals

Gate rule: `frontend-developer` may build a screen only when its row says APPROVED for a specific version. Only the human marks APPROVED, with the date and any requested changes. The designer never edits the Status column to APPROVED. A revision bumps the version (v2, ...) and resets to PENDING.

| # | Mockup | File | Priority | Stories | Version | Status | Date | Changes requested |
|---|---|---|---|---|---|---|---|---|
| 00 | Shared patterns (navigation, status badge, money, dates, timeline, errors, dialogs, a11y) | 00-shared-patterns.md | MUST | US-03, 05, 09, 23 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 01 | Login | 01-login.md | MUST | US-23 | v2 | APPROVED | 2026-10-28 | v2 changes: field is Email only (no username); endpoint POST /auth/token {email, password}; dev-only demo-account picker (six seeded users, prefills email only, no passwords, hidden in production builds); dual-role lands in Officer area. v1 was approved 2026-10-28; v2 approved by the human ("approve login v2"). |
| 02 | Claimant: report incident | 02-claimant-report-incident.md | MUST | US-01 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 03 | Claimant: claim detail, timeline, decision display | 03-claimant-claim-detail-timeline.md | MUST (decision display SHOULD) | US-03, 05 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 04 | Officer: incoming queue and pick-up | 04-officer-queue.md | MUST | US-06 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 05 | Officer: claim detail with full trail | 05-officer-claim-detail-trail.md | MUST | US-09, 22 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 06 | Officer: set assessed amount | 06-officer-assess.md | MUST | US-26 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 07 | Officer: propose decision | 07-officer-propose-decision.md | MUST | US-27 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 08 | Manager: pending-approval queue, confirm, send back | 08-manager-pending-approvals.md | MUST | US-28, 29, 30 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 09 | Manager: claim trail view | 09-manager-claim-trail.md | MUST | US-09 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 10 | Manager: outstanding claims dashboard | 10-manager-outstanding.md | MUST | US-13 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 11 | Manager: liability exposure | 11-manager-exposure.md | MUST | US-14 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 12 | Claimant: my claims | 12-claimant-my-claims.md | SHOULD | US-02 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 13 | Claimant: respond to info request | 13-claimant-respond-info-request.md | SHOULD | US-04 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 14 | Officer: request information | 14-officer-request-info.md | SHOULD | US-07 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 15 | Officer: withdraw pending proposal | 15-officer-withdraw-proposal.md | SHOULD | US-31 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 16 | Release / reassign (officer, manager) | 16-reassign-release.md | SHOULD | US-12 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |
| 17 | Officer: my workload | 17-officer-workload.md | SHOULD | US-10 | v1 | APPROVED | 2026-10-28 | None; designer assumptions on open questions accepted |

Not designed (Phase 2 optional mockups, COULD): payee details, money view, settlement, payment exceptions, fund, ledger, reconciliation. COULD P1 items (notifications, document upload, team table, charts, SSE) not designed.

## Open questions for the human (consolidated)
- Q1 Demo-account picker on login, and where seeded passwords come from.
- Q3 Landing area for the dual-role user (assumed Officer area, nav shows both groups).
- Q4/Q5/Q6 Report form: exact motor/property extra fields (need OpenAPI), duplicate-submit behaviour, policy number free text vs picker.
- Q7 Claimant timeline: show actor role text ("by Officer")?
- Q8 May an officer preview an unassigned claim before pick-up?
- Q9 Correction command (US-18) has no UI task; keep out of Phase 1 UI?
- Q10 Show claimant name to officer.
- Q11 May the assessed amount be changed again before proposing?
- Q12/Q13 Approved amount always equals net payable; reject allowed without assessed amount?
- Q14/Q15 Show the maker's own pending claim in the manager queue with a "cannot check" hint (assumed yes); does the queue API return the rationale?
- Q16 Manager actions on Submitted (unassigned) claims (assumed none).
- Q17/Q18/Q19 Outstanding: zero-count rows, drilldown list (no task exists), show awaiting-checker subtotal.
- Q20/Q21 Exposure: rates from API or static note; "in settlement" is Phase 2.
- Q22 Does the claimant see answer text of earlier info responses?
- Q23/Q24 Reassign: officer-list endpoint; meaning of officer "release".
- Q25 Flag: TASKS section 1 lists "reassign" as a SHOULD screen under both officer (US-12) and manager; one shared dialog (16) is designed. Confirm that is acceptable.

# SPEC: <Feature / screen name>  (area: claimant | staff | manager | core | shared)

Copy this file to `docs/specs/<feature>/SPEC.md` and fill every section before writing code. Keep it short (1–2 pages); write "n/a" with a reason instead of deleting a section.

| Field | Value |
|---|---|
| Author | `frontend-developer` |
| Status | DRAFT → IN REVIEW → **REVIEWED** (by `architect`) → IMPLEMENTED |
| Approved mockup | `docs/mockups/<file>` version vX, APPROVED on <date> (**required**) |
| Phase | P1 build / P2 designed-not-built |
| Stories (US-xx) / BR-xx | |
| Tasks (docs/planning/TASKS.md) | |

## 1. Purpose and scope
What the screen/feature lets the persona do, in 3–5 lines. **In scope:** … **Out of scope:** …

## 2. Acceptance criteria
Given/When/Then from the stories; each maps to a test in section 9.

## 3. Mockup mapping
Which mockup regions become which components. Any deviation from the approved mockup is **not allowed** here; raise it with `ui-ux-designer` and the human first.

## 4. Routes, guards and structure
Route path, lazy module, role guard (UX only), folder layout, container vs presentational components, facade service.

## 5. API usage
Endpoints from the generated client (name them exactly as in the OpenAPI spec; if one is missing, stop and report). Request fields sent (never server-owned fields), response fields shown, error handling per status (400/401/403/404/409/5xx) and the user-facing message.

## 6. State and forms
Signals/computed per component, loading/empty/error states, typed form controls and validators with their messages, polling/refresh if any, double-submit prevention.

## 7. Trail and visibility
Which trail entries are shown to which role; Public vs Internal handling; nothing internal is rendered to a claimant.

## 8. Security and accessibility
Token handling, escaping of user text, no secrets/PII in logs; frontend security tests; labels, keyboard order, focus, contrast, status not by colour alone.

## 9. Test plan
| Criterion / risk | Test type (unit / component) | Test name |
|---|---|---|

## 10. Implementation plan
Ordered small steps (each a commit), files to create, estimate vs the cut line.

## 11. Risks, assumptions, open questions
Resolve with the owner before coding.

## 12. Review record
| Reviewer | Date | Verdict (REVIEWED / CHANGES REQUESTED) | Notes |
|---|---|---|---|

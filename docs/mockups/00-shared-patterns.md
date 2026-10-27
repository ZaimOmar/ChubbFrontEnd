# 00 Shared patterns (v1)

Defined once; every screen mockup refers here. Scope: Phase 1. Stories: US-03, 05, 09, 23. Rules: BR-01, BR-08, BR-09, BR-12, BR-23, BR-33.

## 1. App shell and navigation per role
One app, three lazy areas (`/claimant`, `/staff`, `/manager`). Shell = `mat-toolbar` (top) + `mat-sidenav` (left, collapses to a menu button under 960px).

```
+----------------------------------------------------------------------+
| [=] Chubb Claims        Area: Officer      Aisha Tan (Officer) [Logout] |  <- mat-toolbar
+-----------+----------------------------------------------------------+
| Incoming  |  <page title (h1)>                                        |
| My work   |  <content>                                                |
| ...       |                                                           |
+-----------+----------------------------------------------------------+
```

| Role | Side nav items (in order) | Landing |
|---|---|---|
| Claimant | Report incident, My claims | `/claimant/claims` (or report form if none) |
| Officer | Incoming queue, My workload | `/staff/queue` |
| Manager | Pending approvals, Outstanding, Exposure | `/manager/pending` |
| Dual-role user (Officer+Manager) | Both Officer and Manager groups, under headings "Officer" and "Manager" | `/staff/queue` (see open question Q3) |

- Active item uses `aria-current="page"` plus a visible indicator that is not colour only (bold + left bar).
- Role shown as text next to the user name in the toolbar. Logout clears memory and sessionStorage token.
- Wrong-role URL: redirect to own landing with a snackbar "You do not have access to that area." (guards are UX only; backend returns 403).
- A manager opening a claim from any list goes to `/manager/claims/:id` (trail view, screen 09). Officers use `/staff/claims/:id` (screen 05).

## 2. Status badge (one component, `app-status-badge`)
Always colour AND text label AND icon (`mat-icon`, `aria-hidden`); the text is the accessible name. Pending* never share a label with UnderReview/Approved (BR-77).

| Status | Label shown | Icon | Colour family (contrast >= 4.5:1 against badge bg) |
|---|---|---|---|
| Submitted | Submitted | inbox | grey |
| UnderReview | Under review | search | blue |
| InfoRequested | Info requested | help_outline | amber |
| PendingDecisionApproval | Awaiting checker (decision) | hourglass_top | purple |
| Approved | Approved | check_circle | green |
| Rejected | Rejected | cancel | red |
| PendingSettlementApproval | Awaiting checker (settlement) | hourglass_top | purple, hatched border |
| Settling | Settling | sync | teal |
| Settled | Settled | paid | dark green |

Claimant view relabels (BR-33): PendingDecisionApproval is shown as "Decision under review" (no "checker", no "awaiting"). PendingSettlementApproval and Settling are Phase 2 values; shown with the labels above only if they occur.

```
[ icon  Under review ]   rounded chip, 1px border same hue, text 14px
```

## 3. Money display
- Format: `{CCY} {amount with thousands separator, 2 decimals}`, e.g. `SGD 8,000.00`, `IDR 12,500,000.00`. Currency code always shown, never a bare symbol. Right-aligned in tables, tabular numerals.
- Currency comes from the claim (BR-23); never converted in claim views. USD appears only on manager dashboards, labelled "USD (reporting rate)" (BR-24).
- Pipe: `money` taking `(amount, currencyCode)`. Negative amounts not expected.
- Inputs: `mat-form-field` with a prefix showing the currency code (read-only text), numeric input, `inputmode="decimal"`.

## 4. Dates and times
- Display: `dd MMM yyyy, HH:mm` in the user's local time zone, e.g. `28 Oct 2026, 14:05`. Tooltip/title and `<time datetime>` carry the ISO UTC value.
- Dates only (incident date, due date): `dd MMM yyyy`.
- Age: `3d 4h` (days and hours), under 1 day `5h`. Ages are calendar time (BR-76).
- Date pickers: `mat-datepicker`, format hint `dd/mm/yyyy` shown under the field.

## 5. Shared timeline component (`app-claim-timeline`)
Used by claimant (03), officer (05), manager (09). Input `audience = claimant | staff`.

```
Claim timeline                                      (ordered oldest -> newest)
o--- 28 Oct 2026, 09:12   Claim received: CLM-SG-2026-000123
|    by Claimant
o--- 28 Oct 2026, 10:01   Claim picked up for review
|    by Officer
o--- 28 Oct 2026, 11:30   Decision under review
```
Staff audience adds per entry:
```
o--- 28 Oct 2026, 11:30  [Internal]  Decision proposed: approve SGD 7,500.00
|    by Aisha Tan (Officer, maker)   Proposal PRP-12
|    Reason: repair quote verified
o--- 28 Oct 2026, 14:02  [Internal]  Decision confirmed
|    maker Aisha Tan (Officer)  checker Mark Lee (Manager)   Proposal PRP-12
o--- 28 Oct 2026, 14:03  [Refused]   Refused: Aisha Tan tried to confirm own proposal
```
- Fields per entry: time, summary, actor (name + role), visibility badge (staff only), reason if any, maker/checker/proposal id when present, "corrected by <entry>" flag if corrected (BR-74).
- Visibility badge text: "Public" or "Internal" (staff only), with icon (visibility / lock). Refused entries are Internal with a distinct "Refused" label and warning icon (US-22). Correction entries labelled "Correction".
- Claimant audience: only Public entries, no badges, no counts, no gaps, no ids, no actor names (role only: "by Claimant", "by Officer"), never any Internal text. Renders what the server returns; no client-side filtering of Internal entries (defence in depth only).
- Semantics: ordered list `<ol>`, each entry `<li>` with `<time>`; badges have text. Newest at bottom (chronological) with "Jump to latest" link.
- States: loading (`mat-progress-bar` + skeleton rows, `aria-busy`), empty ("No activity yet."), error (inline `app-error-panel` with Retry).

## 6. Errors, loading and empty states (shared components)
- Loading: `mat-progress-bar` indeterminate at top of the content area; buttons that submit show `mat-spinner` (diameter 18) and are disabled; `aria-live="polite"` text "Loading...".
- Empty: icon + one sentence + next action.
- Error: `app-error-panel` (role="alert") with a friendly message mapped from RFC 7807 `title`/`detail`, a "Retry" button, and a correlation id in small text when the server gives one.
- Problem-details mapping (all screens):

| HTTP | Message shown | Where |
|---|---|---|
| 401 | "Your session has expired. Please log in again." then redirect to login | snackbar + redirect |
| 403 | "You are not allowed to do that." (or the specific reason where listed, e.g. maker-cannot-check) | inline banner |
| 404 | "We could not find that claim." | error panel |
| 409 | Conflict, screen-specific text; list auto-refreshes | inline banner (`role="alert"`) |
| 422 | Field errors from `errors{}` mapped to the matching control; unmapped ones in a banner above the form | per field |
| 5xx / network | "Something went wrong. Please try again." + Retry | error panel |

- 409 conflict banner pattern: warning banner (icon + text, not colour only), states what happened and what the UI did ("This claim was already picked up by another officer. The list has been refreshed."), dismissible, focus moved to it.

## 7. Confirmation dialogs (`mat-dialog`)
Used for: Confirm decision, Send back, Reject proposal submit (summarised), Withdraw proposal, Reassign. (Settle is Phase 2; there is no officer "settle" button, see TASKS removed items.)

```
+------------------------------------------+
| Confirm this decision?              [x]  |  <- h2, aria-labelledby
|------------------------------------------|
| CLM-SG-2026-000123                        |
| Outcome: Approve   SGD 7,500.00          |
| Proposed by Aisha Tan                    |
|                                          |
| This applies the decision exactly as     |
| proposed and cannot be undone.           |
|                       [Cancel] [Confirm] |
+------------------------------------------+
```
- Focus moves to the dialog heading on open; Escape and Cancel close; focus returns to the trigger button. Primary action is a text-labelled button (never icon only). Destructive actions (Reject, Send back, Withdraw) use a coloured button plus explicit verb in the label.
- Dialog with a reason field: `mat-form-field` textarea, required, min 10 chars, live counter "0/10 min", primary disabled until valid; error text appears on blur and on submit.

## 8. Forms (all screens)
- Typed reactive forms; every input has a visible `mat-label` (no placeholder-only labels); required fields marked "(required)" in the label text, not only an asterisk.
- Error messages in `mat-error`, linked by `aria-describedby`; on failed submit, an error summary at the top (role="alert") lists the problems with links to fields, and focus goes to it.
- Submit buttons disabled only while submitting; otherwise allowed so errors can be shown.
- Tab order follows visual order; buttons at the end of the form, primary last (right).

## 9. Tables
`mat-table` with a caption/`aria-label`, sticky header, sortable columns where stated (`matSort`, announced), `mat-paginator` (10/25/50) for lists over 25 rows. Row action buttons have text labels (or `aria-label` including the claim number). Rows with a link: claim number is the link.

## 10. Accessibility baseline
- WCAG 2.1 AA: contrast 4.5:1 text, 3:1 UI; visible focus ring on all controls; no information by colour alone (status, visibility, flagged amounts all carry text + icon).
- Landmarks: `header`, `nav`, `main`, one `h1` per page.
- Live regions: snackbars and conflict banners use `role="status"`/`role="alert"`.
- Touch targets at least 40px; layout works at 360px width (tables become stacked cards under 600px, COULD).
- Language `en`; timestamps readable by screen readers via `<time>` and full text.

## 11. Mockup template used by every screen file
Purpose, persona, story/ACs, API, route, layout, components, fields and validation, actions by status, states (loading/empty/error/409), accessibility, open questions.

## 12. Claim statuses and who may act (reference for all "actions by status" tables)
UI mirrors this; the backend is authoritative (BR-01, BR-02, BR-36).
- Claimant: respond to info request (InfoRequested only).
- Assigned officer: assess (UnderReview), request info (UnderReview), propose (UnderReview with assessed amount), withdraw (PendingDecisionApproval, own proposal), release/reassign request.
- Manager: confirm / send back (PendingDecisionApproval, not the maker), reassign (UnderReview, InfoRequested, PendingDecisionApproval).
- No action on Approved or Rejected in Phase 1 (Approved settlement is Phase 2). Rejected and Settled are final.

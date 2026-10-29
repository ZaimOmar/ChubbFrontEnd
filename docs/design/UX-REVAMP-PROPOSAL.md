# UX revamp proposal (needs human approval; mockups 21 to 25)

Look stays: indigo-600, slate, white rounded cards, JetBrains Mono for headings, labels, buttons and numbers, Roboto for prose, M3 rail, shimmer, paginated tables. What changes is composition: denser, role-specific, fewer navigations.

## 1. Decision: Option A (no top header)

Remove the top header. Brand, notifications, command palette, user and logout live in the rail. Breadcrumbs stay, but as the first line of each page's own title row, not as a bar.

Why A:
- Officers and managers work all day. A 56px bar is 7% of a 768px screen, permanently, to show a logo they already know. Removing it is the single biggest density win and costs nothing functional.
- Two chrome surfaces (dark bar, light rail) are the inconsistency. One surface (the rail) removes it.
- Claimants are occasional but see a rail with labels (see below), so they lose nothing.

Why not B (slim header, no breadcrumbs): a slim header still costs 40px, and dropping breadcrumbs hurts the one place users get lost: claim detail reached from three lists. With master-detail (section 4) the officer rarely leaves the list, so the claim number does not need a bar to live in.

Cost of A, stated honestly: the rail gets busier and must hold six things. Mitigated below. The breadcrumb now costs 20px inside the title row, which already exists, so net gain is about 56px.

Breadcrumb rule: max 3 crumbs, `Officer / Queue / CLM-2026-0012`. Each crumb is a link except the last. Title row = crumbs on the left, page actions on the right, 40px tall. Under 600px only "back arrow + parent name" shows.

## 1b. Cohesion (top priority: one product, not separate pages)

1. One shell. Same rail, same title row, same global actions for claimant, officer and manager. Only the nav group and default density differ by role.
2. One page anatomy on every screen, top to bottom:
   - Title area (40px): crumbs left, page actions right, h1 visually hidden or the card title.
   - Toolbar (40px, optional): view menu, density, refresh, result count, active filter chips.
   - Content: fills the viewport; panes scroll inside.
   - Sticky action footer (56px, only on forms, dialogs and detail panes with a primary action).
3. One component set, one behaviour: `app-claim-table` (header filters, sticky header, paginator footer, keyboard nav), `app-field`, section card, status badge, filter chip, KPI tile, empty/loading/error panels, confirm popover/dialog. No screen styles its own variant.
4. No dead ends:
   - Claim numbers are links everywhere (tables, timeline, notifications, KPI drill-downs, palette results).
   - Notifications deep-link to the role view of the claim (claimant: `/claimant/claims/:id`; officer: queue pane `?claim=`; manager: pending pane).
   - KPI tiles drill down to the same table pre-filtered (URL query), never to a generic page.
   - Detail returns to the exact list state: filters, sort, page and scroll position (kept in the URL and a `navState` service). Back crumb and `Esc` do the same.
   - Previous / Next claim buttons and `j/k` in the detail strip walk the current list order (the list's ids are kept in `navState`).
   - "Recent" in the palette: last 8 viewed claims (localStorage per user).
5. One vocabulary. Status labels, colours and icons come from one map (`claim-status.ts`). Terms: "Claim", "Officer", "Manager", "Propose", "Confirm", "Send back", "Reject". Claimant wording differs only where the approved audience map says so. Same verb on button, dialog title and toast.
6. Global actions in one place: palette (`Ctrl+K`), notifications, user menu, all in the rail. Nothing global in page toolbars.
7. One shortcut set, same in every role (section 9); `?` lists them.
8. Shared persisted state (localStorage, per user, cleared on logout except density): density, rail width, saved views, last-used market, recent claims, report draft. Filters live in the URL so they survive reload and share by link.

### Cohesion checklist (per screen, developer verifies)
- [ ] Uses the shell; no own header, no own footer.
- [ ] Title row with crumbs (max 3) and actions at the right; one h1.
- [ ] Anatomy order: title, toolbar, content, sticky footer; no page-level scroll at 1366x768.
- [ ] Only shared components; no local restyle of tables, fields, chips, badges.
- [ ] Every claim number is a link; every KPI drills to a pre-filtered list.
- [ ] Back (crumb, Esc, browser) restores list filters, sort, page.
- [ ] Prev/Next within the list on detail views.
- [ ] Status shown via the shared badge (text + icon), same wording as other roles.
- [ ] Loading, empty (with action), error (with correlation id), 409 states use the shared panels.
- [ ] Shortcuts from the shared set work and are not overridden.
- [ ] Respects density and rail state; no hard-coded sizes.
- [ ] Notification deep link to this screen works for its role.
- [ ] Keyboard order, focus return and labels pass axe.

## 2. App shell

Desktop (>= 960px): rail on the left, full height, sticky, no outer rounded card, white, 1px slate-200 right border. Two widths:
- Collapsed 64px (default for staff): icons only plus tooltips, as now.
- Expanded 208px (default for claimants, toggle with `[`): icon + mono 12px label. State saved in localStorage.

Rail top to bottom: brand tile (indigo, links home) / nav groups (divider between roles) / spacer / Search `Ctrl+K` / Notifications (badge) / avatar menu (name, role, Log out). Avatar opens a small menu; Log out is inside it (prevents mis-click) and also in the palette.

Content: slate-50, padding 16px (staff) or 24px (claimant). The app footer is removed; the copyright goes into the avatar menu.

Mobile (< 600px): rail becomes a top row of 40px (menu, brand, bell, avatar) and nav moves to a bottom nav (max 4). Existing horizontal rail is replaced.

Landing: officer lands on the queue (`/staff/queue`), manager on the command centre (`/manager/home`), claimant on Home. Officer Home KPI strip moves to the top of the queue (one line, section 5).

Mockup: 21.

## 3. Density strategy

Targets: no page-level scroll for core tasks at 1366x768 (usable body height about 600px after browser chrome) and 1920x1080. Inner panes scroll, the page does not.

- Page = flex column filling 100dvh. Title row 40px, content fills the rest, panes own their scroll (`overflow:auto`, sticky headers).
- Density toggle (Comfortable / Compact) in the avatar menu and table toolbar, saved per user. Comfortable: row 48px, field 56px. Compact: row 36px, field 40px, card padding 12px. Default Compact for Officer and Manager, Comfortable for Claimant. Implemented as one CSS custom property set on `<body data-density>`.
- Type: mono for headings, labels, buttons, ids, numbers, status. Roboto 13px for prose, descriptions, notes, notification text, table text columns (names, descriptions). Minimum text size 11px. Labels slate-500 (#64748b, 4.8:1) not slate-400.
- Drop the stepper from claim detail (status badge + timeline already say it); show a one-line status chip row.
- Drop outer page cards where a card wraps one table; the table is the card.

## 4. Forms (report incident as the model)

Single viewport, no stepper, no scroll at 1366x768.

Layout at >= 960px: card max 1040px, 12-column grid, two groups side by side.
- Left column "Policy and incident": Policy number (6), Market (6), Claim type segmented toggle (12), Incident date (6), Estimated amount with currency prefix (6), Description (12, 4 rows).
- Right column "Motor details" / "Property details" (swaps on type, same height, no layout jump): 2 fields plus a help panel.
- Sticky footer: Cancel, "Saved 10:42" draft indicator, Submit claim. Always visible.

Height budget: title row 40 + card header 56 + 3 field rows at 72 + description 120 + footer 64 = about 520px. Fits 600.

Rules:
- Claim type becomes a segmented toggle (existing M3 segmented style), above the grid, default none selected; right pane shows "Choose a type to add details" skeleton so the layout is stable.
- Market default: last used market (localStorage). Currency shown as prefix chip from market (SG: SGD) so the amount is never ambiguous.
- Inline validation: validate on blur, then on input after first error. Error text replaces the hint in the same line (no layout jump). Required marked with `*` in the label, legend "* required".
- On failed submit focus the first invalid field and announce "3 fields need attention" in a live region. Keep the banner only for server errors.
- Autosave draft: save form value to localStorage every 2 s after change (debounced), key per user; restore on load with a dismissible notice "Draft restored. Discard"; clear on success. Never store anything beyond the form fields. No server work.
- Shortcuts: `Ctrl+Enter` submit, `Esc` cancel (confirm if dirty), `Alt+1/2` focus left/right group.
- Below 960px: one column; sticky footer stays; motor/property group follows. Fields are 48px touch targets. Date and amount stay side by side down to 480px.
- Same grid pattern for propose decision (approve / reject) and dialogs: label left, control right is rejected; use 2 columns only when 4+ fields.

Mockup: 22.

## 5. Data tables (power users)

Applies to My claims, Incoming queue, Pending approvals, Home previews.

- Sticky header; the card fills the page; the paginator is a sticky footer. Rows scroll inside.
- Column filters in a second header row (inputs under each column title: claim number text, market select, type select, amount min/max popover, date range popover, status select). Replaces the separate filter bar. Active filter = indigo underline and a chip row above (kept from 15), "Clear all".
- Density toggle in toolbar (Compact / Comfortable).
- Keyboard: `j/k` or arrows move row focus (roving tabindex, `aria-selected`), `Enter` opens, `x` selects, `/` focuses the claim number filter, `r` refresh, `p` pick up (queue), `[` `]` previous and next page.
- Saved views: a "View" menu in the toolbar with presets stored in localStorage (name + URL query string). Defaults: Queue: "Oldest first", "Motor", "High value (> 10,000)". Cheap because filters already live in the URL.
- Bulk actions (only where valid): Incoming queue: select rows, "Pick up N" (only Submitted claims; server rejects conflicts, report per row result as a snackbar summary). Pending approvals: no bulk confirm (maker-checker needs a read of each claim); bulk is deliberately not offered.
- One target per row: the claim number is the link; the row click selects (opens the detail pane in master-detail); the action button never shares a click with row navigation.
- Page size default 25, options 25/50/100. Sort indicator visible; default sort stated in the toolbar ("Oldest first").
- Row amounts right-aligned, mono; ages shown relative with absolute date in tooltip.

Mockup: 25.

## 6. Officer workspace: master-detail

Route `/staff/queue` and `/staff/claims/:id` share one component; URL keeps deep links.

```
Left 42%: table (compact, filters in header, tabs: Incoming | Mine)
Right 58%: claim pane (sticky summary, tabs, quick actions)
```
- Selecting a row loads the pane without navigation (`?claim=id`, back button works). Pick up is a primary button in the pane header and `p` in the list; after pick-up the pane switches to assess/propose actions and the row moves to "Mine".
- "Incoming | Mine" tabs replace the separate Home and Queue; the KPI strip (Unassigned, Mine, Awaiting manager, Oldest age) is one 48px line above.
- Below 1100px width the pane becomes a full-page route (current behaviour). Deep link and mobile still work.
- Esc closes the pane, `j/k` change the claim and the pane follows after 150 ms.

Mockup: 23.

## 7. Claim detail (all roles, also the right pane)

- Sticky summary strip (56px): claim number, status badge, market, type, amount (claimed / assessed), age, assignee. Always visible.
- Quick actions in the strip, right: primary action by status (Pick up, Set assessed amount, Propose, Confirm) and a "More" menu (Request info, Withdraw, Reassign). Disabled actions show a tooltip with the reason (status or role).
- Tabs: Overview (incident description, motor/property details, financials), Timeline (the existing trail, with filter), Documents (only when the upload feature exists; do not render an empty tab now).
- Decision/next action card stays at the top of Overview, compact.
- Claimant view: same shape, read-only, with "What happens next" card and Respond button when info is requested.

## 8. Manager command centre

One screen, no scroll at 1366x768:

```
KPI row (4 tiles, 72px): Pending approvals | Oldest pending | Outstanding | Exposure
Left 60%: Pending approvals table, each row: Confirm | Send back inline
Right 40%: Exposure by market (bars, top 6) + Awaiting-checker by officer
```
- Tiles are filters, not links: clicking "Oldest pending" sorts and highlights the table; each tile does something different (fixes audit 19).
- Inline confirm: row button opens a small popover (not a page): shows claim number, amount, officer's proposal, rationale, and two buttons. Confirm requires one click plus the popover (no second modal). Send back requires a reason (min 10 chars), textarea in the same popover. Maker-checker: the maker's own claims show a disabled button with "You proposed this".
- 409 conflict (already actioned): row turns amber with "Already handled by Ana" and a Dismiss; table refreshes.
- Reject (final) always keeps the confirmation dialog (existing rule from 00 v1); Confirm/Send back use the popover.
- Exposure uses horizontal bars with the number printed (not colour only). A chart library is not used; CSS bars.

Mockup: 24.

## 9. Command palette and shortcuts

`Ctrl+K` (and `/` outside inputs) opens a `mat-dialog`-based palette: input, list, `Enter` to run, `Esc` to close.
- Navigate: destinations by role ("Go to Queue").
- Claims: type a claim number, jump to it (uses existing `GET /claims?claimNumber=`; debounce 250 ms; no new endpoint).
- Actions: Toggle density, Log out, Shortcuts help, Refresh.
Global: `g q` queue, `g h` home, `g p` pending, `?` shortcuts sheet, `[` toggle rail. All shortcuts are ignored while typing in an input; each has a visible equivalent button (WCAG 2.1.4: single-key shortcuts can be turned off in the shortcuts sheet).

## 10. States and micro-interactions

- Loading: shimmer skeleton shaped like the final layout (rows for tables, bars for panes). Never a blocking spinner for list reloads; keep old rows at 60% opacity while refreshing.
- Empty: icon, one sentence, one action ("Clear filters", "Report an incident"). Queue empty: "Queue clear. Next refresh in 60 s" plus saved views.
- Error: panel with message, correlation id (copy button), Retry. Field errors inline.
- 409 conflict: row-level or pane-level amber banner, names the cause, one action (Reload). Never a modal.
- Micro: 120 ms fade on pane swap, row highlight (indigo-50) for 1.5 s after a state change, toast on success with Undo only where the API allows (none today, so no Undo). Respect `prefers-reduced-motion`.
- Optimistic UI is not used: money and approval states wait for the server.

## 11. Accessibility

- Contrast: replace slate-400 text with slate-500; hints and table headers at least 11px. Verify with axe in CI.
- Rail expanded shows text labels; collapsed keeps aria-label and tooltip (focus-visible too).
- Master-detail: list is `role="grid"` with roving tabindex; pane is a labelled `region`; focus moves to the pane heading on open and returns to the row on Esc.
- Status never by colour alone (text label kept). Live region for filter result counts and draft saved.
- Touch targets 44px at <= 960px; keyboard order matches visual order; sticky footers do not hide focused fields (scroll-padding-bottom).

## 12. Dark mode

Only if cheap: all colours already come from CSS variables, so a `data-theme="dark"` slate-900/800 token set plus Material system tokens is about half a day, but it needs contrast checks on 7 status badges. Recommendation: do not build in the 1-day box. P2.

## 13. Build order and effort (1-day time-box = 8 hours)

| P | Item | Effort | Notes |
|---|---|---|---|
| P0 | Shell A: remove top bar, rail holds brand/bell/user, title row with breadcrumbs, drop footer, page fills viewport | 1.5 h | Moves existing pieces; breadcrumb code reused |
| P0 | Density tokens + type tweak (slate-500 labels, Roboto prose) | 1 h | styles.scss only |
| P0 | Report incident single-viewport grid, sticky footer, segmented type, focus first error, inline validation | 2 h | Same form model |
| P0 | Tables: sticky header, paginator footer, header-row filters (reuse filter bar logic), page size 25 | 2 h | |
| P1 | Draft autosave (report) | 0.5 h | localStorage |
| P1 | Sticky claim summary + tabs + drop stepper | 1.5 h | |
| P1 | Manager command centre layout + inline confirm popover | 2.5 h | Biggest P1 |
| P1 | Officer master-detail | 3 h | Needs route work |
| P1 | Command palette + g-shortcuts | 2 h | |
| P1 | Keyboard row navigation | 1 h | |
| P2 | Saved views, density toggle UI, bulk pick up | 2.5 h | |
| P2 | Expanded rail, mobile bottom nav | 1.5 h | |
| P2 | Dark mode | 4 h | |

One day = the four P0 items (6.5 h) plus draft autosave (0.5 h) and tests/axe pass (1 h). Everything else is next sprint.

### Do NOT build in the 1-day box
Master-detail, command palette, inline confirm popover, bulk actions, saved views, dark mode, expanded rail, documents tab, charts, Undo, any new endpoint, any change to API or idempotency code, optimistic updates.

## 14. Open questions
1. Officer landing on the queue instead of Home: acceptable?
2. Is a "Mine" tab in the officer list needed, or does Officer Home keep that role? (Needs `GET /claims?assignedToMe`; confirm the API.)
3. Bulk Pick up: allowed by the backend per-claim (409 on conflict)? Confirm no limit.
4. Is it acceptable that Confirm and Send back use an inline popover instead of dialogs (Reject-final keeps the dialog)?
5. Claimant default rail expanded: OK?
6. Draft autosave stores claim text locally in the browser: any privacy objection (shared computers)? Mitigation: clear on logout.
7. Remove the copyright footer line (move into the avatar menu)?

## 15. Summary of decisions needing human approval
1. Option A: remove the top header; rail owns brand, bell, search, user, logout; breadcrumbs move into the page title row.
2. Role-specific density: Compact for Officer/Manager, Comfortable for Claimant, toggle saved.
3. Report incident becomes a two-group single-viewport form with sticky footer and local draft.
4. Tables get header-row filters, sticky header, keyboard navigation; saved views and bulk pick up later.
5. Officer workspace becomes master-detail (P1, not in the 1-day box).
6. Manager gets inline Confirm/Send back popovers; Reject-final keeps its dialog.
7. Command palette and `g` shortcuts (P1).
8. Dark mode deferred.
9. Mono/Roboto split and slate-500 for text (small deviation from the reference for contrast).

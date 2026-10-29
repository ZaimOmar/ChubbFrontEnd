# 21 App shell, Option A (no top header) - v1 PENDING

Purpose: one shell for all roles. Stories: US-03, 05, 09, 23 (navigation). Supersedes the shell part of 00 v2 once approved.

## Desktop, officer, collapsed rail (64px)
```
+----+---------------------------------------------------------------------+
| [C]| Officer / Queue / CLM-2026-0012          [Refresh] [Pick up  p]     |  title row 40px
|----|---------------------------------------------------------------------|
| ▦  |  toolbar 40px (view, density, chips)                                |
| ⌂  |---------------------------------------------------------------------|
| ▤  |                                                                     |
|    |   content fills viewport, panes scroll inside                       |
|    |                                                                     |
|    |                                                                     |
|----|                                                                     |
| ⌕  |  Search Ctrl+K                                                      |
| 🔔3|  Notifications                                                      |
| (ZO)|  user menu: name, role, density, shortcuts, log out, (c) 2026       |
+----+---------------------------------------------------------------------+
```
Expanded (208px, `[`): icons plus mono 12px labels, group heading "OFFICER" 10px.

## Mobile (< 600px)
```
[≡] CHUBB            🔔  (ZO)     <- 40px top row
< Queue                           <- back + parent only
 content
[Home] [Queue] [Pending] [More]   <- bottom nav, max 4
```

## Components (Angular Material)
`mat-sidenav`-less fixed rail (plain nav), `mat-icon`, `matBadge`, `matTooltip`, `mat-menu` (user, notifications panel), `mat-dialog` (palette), `mat-tab` not used.

## Behaviour
- Rail items: aria-label always, tooltip on hover and focus-visible, `aria-current="page"`, active = indigo-600 tile.
- Bell: badge hidden at 0, `9+` over 9; menu list as today; item click deep-links to the role view.
- Avatar menu: Density (Compact/Comfortable), Keyboard shortcuts, Log out. Log out confirms only if a form is dirty.
- Crumbs: max 3, links except last; truncated with ellipsis; mobile shows back + parent.
- States: rail never loading (identity from token); notifications menu: shimmer, "No notifications.", error with Retry.
- Roles: claimant sees Home / Report / My claims, expanded by default. Officer Queue (landing) / Home. Manager Command centre (landing) / Pending. Dual-role: two groups with divider.
- API: `GET /notifications`, token claims for identity.
- A11y: skip link first, landmarks nav/main, focus ring 2px indigo-500, contrast slate-500 on white.

## Open questions
Footer removal; claimant default expanded rail.

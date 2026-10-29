# 25 Claims table with header-row filters - v1 PENDING

Shared component `app-claim-table` for My claims (claimant), Incoming/Mine (officer), Pending (manager). Refines 19. Stories: US-02, 06, 30. API: `GET /claims/mine`, `GET /claims` (server-side filter, sort, page; query params unchanged).

## Layout
```
Claimant / My claims
[View: All v]  Showing 1-25 of 132 - Newest first      [Compact|Comfortable] [Refresh]
Chips: [Market: SG x] [Type: Motor x]  Clear all
+---------------------------------------------------------------------------+
| CLAIM #  | MARKET | TYPE   | AMOUNT        | SUBMITTED   | STATUS          |  header (sticky)
| [search] | [All v]| [All v]| [min..max v ] | [from..to v]| [All v]         |  filter row
|----------|--------|--------|---------------|-------------|-----------------|
| CLM-0012 | SG     | Motor  |   SGD 4,200   | 3d ago      | [UNDER REVIEW]  |
| CLM-0013 | HK     | Prop   |   HKD 9,800   | 2d ago      | [SUBMITTED]     |
| ...                                                                        |
|---------------------------------------------------------------------------|
| Rows 25 v        1-25 of 132       |<  <  >  >|                           |  sticky footer
+---------------------------------------------------------------------------+
```
Only claim number is a link; row click selects/opens; actions (Pick up) are a separate column button.

## Behaviour
- Filters apply on change (text debounced 300 ms, Enter applies); page resets to 1; all state in URL; active filter column header gets an indigo underline and a chip.
- Sort by clicking header (arrow shown, aria-sort); default stated in toolbar.
- Keyboard: j/k or arrows move row, Enter open, x select, / focus claim filter, r refresh, [ ] page.
- Views menu: presets + "Save current view" (name, localStorage, per user).
- Bulk (queue only): checkbox column, footer "Pick up N".
- Density toggle: Compact 36px rows, Comfortable 48px; persisted.
- Amount right-aligned mono with currency; age relative with date tooltip; status badge with text.
- Columns drop by width: below 960px hide market/submitted; below 600px rows become 2-line cards (number + status, amount + age), filters move to a "Filters" button opening a bottom sheet.
- States: loading = skeleton rows (keep old rows dimmed on reload); empty = "No claims match" + Clear filters (or "Report an incident" for claimant with no claims); error = panel with Retry + correlation id; 409 on row action = row amber banner + refresh.
- Components: `mat-table`-compatible markup, `matSort`, `mat-paginator`, `app-field`, `mat-menu`, chips, `mat-checkbox`.
- A11y: real `<table>`, `scope="col"`, filter inputs labelled (visually hidden label "Filter by market"), roving tabindex on rows, result count in a polite live region.

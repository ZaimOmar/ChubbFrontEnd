# 00 Shared patterns v2: shell, visual system, accessibility (PENDING)

Supersedes nothing until approved; 00 v1 stays APPROVED and valid. v2 adds the shell polish, design tokens, and a11y rules. Plain CSS custom properties in `src/styles.scss` (extends the existing `--app-status-*` tokens). No new UI library; Angular Material components stay (toolbar, sidenav, list, table, card, button, chips-as-spans, dialog, snack-bar).

## 1. Shell (all roles, one `AppShellComponent`)
```
+--------------------------------------------------------------------------------+
| [skip to main content]  (visible on focus only)                                 |
| [=] Chubb Claims        Officer area       Aisha Tan · Officer  [Log out]       |  header, 64px, brand bg
+-------------+------------------------------------------------------------------+
| Home        |  Breadcrumb: Home > Claims > CLM-SG-2026-000118                   |
| Claims      |  h1 page title                                                    |
| Incoming*   |  <content, max-width 1200px, centred, 24px padding>               |
| ...         |                                                                   |
+-------------+------------------------------------------------------------------+
 * role specific. 240px sidenav; under 960px becomes a drawer opened by [=]
```
Nav per role (first item is always **Home**; icon + text, active = bold + 4px left bar + `aria-current="page"`):

| Role | Items | Home route |
|---|---|---|
| Claimant | Home, Report incident, My claims | `/claimant/home` |
| Officer | Home, Incoming queue, My claims (assigned) | `/staff/home` |
| Manager | Home, Pending approvals, Outstanding, Exposure | `/manager/home` |
| Dual role | Officer group then Manager group under headings; Home goes to Officer home with a "Switch to Manager view" link on the home page | `/staff/home` |

Landing after login and the `''` redirect become the role Home (replaces report/queue/pending as landing; those pages stay as nav items). Brand text/logo click goes Home. Toolbar shows user name plus role as text. Items with no built screen yet are not shown (see open question Q-N1).

## 2. Colour tokens (CSS custom properties, `:root`)
Text/background pairs are chosen for AA (contrast values computed against the listed surface).

| Token | Value | Use | Contrast note |
|---|---|---|---|
| `--c-brand` | `#0B2A5B` | header bg, h1, primary buttons bg | white on it 14:1 |
| `--c-brand-hover` | `#123A7A` | button hover | white 10:1 |
| `--c-accent` | `#0A5CC9` | links, focus ring base | on white 6.2:1 |
| `--c-surface` | `#FFFFFF` | cards, table | |
| `--c-bg` | `#F4F6FA` | page background | text `--c-text` 15:1 |
| `--c-text` | `#1B2433` | body text | 15:1 on bg |
| `--c-text-muted` | `#4A5568` | secondary text, captions | 7:1 on white (never lighter) |
| `--c-border` | `#C5CDDA` | card/table borders | 3:1 UI minimum on white is met by `--c-border-strong` for inputs |
| `--c-border-strong` | `#6B7587` | input borders, row focus | 4.6:1 |
| `--c-row-hover` | `#EAF1FC` | row hover bg | text 13:1 |
| `--c-focus` | `#0A5CC9` + 2px white gap | focus ring | 3:1+ on all surfaces |
| `--c-danger` | `#A61B1B` | reject/send-back buttons, error text | white 7:1 |
| `--c-warning-bg` / `-fg` | `#FFF1C2` / `#5C4300` | banners (409) | 8:1 |
| `--c-success-bg` / `-fg` | `#C8F0D0` / `#0D4A1F` | success banners | 8:1 |

Status chip colours: reuse the existing `--app-status-*` pairs unchanged (grey Submitted, blue UnderReview, amber InfoRequested, purple PendingDecisionApproval, green Approved, red Rejected, teal Settling, dark green Settled). Chip = icon + text label + 1px border in fg colour, 14px/500, radius 16px, padding 4px 10px. Claimant relabel of PendingDecisionApproval to "Decision under review" (blue family) stays (BR-33).

## 3. Typography (Roboto already loaded)
| Role | Size / weight / line | Use |
|---|---|---|
| `--t-h1` | 28px / 500 / 36px | page title, one per page |
| `--t-h2` | 20px / 500 / 28px | card titles |
| `--t-h3` | 16px / 500 / 24px | sub sections |
| `--t-body` | 16px / 400 / 24px | default (not smaller than 14px anywhere) |
| `--t-small` | 14px / 400 / 20px | table cells, captions, chips |
| `--t-kpi` | 32px / 600 / 40px, `font-variant-numeric: tabular-nums` | tile numbers, money |

## 4. Spacing, shape, elevation
4px base scale: `--s-1:4 --s-2:8 --s-3:12 --s-4:16 --s-5:24 --s-6:32 --s-7:48`. Card: radius 12px, 1px `--c-border`, padding `--s-5`, no shadow at rest, `0 2px 8px rgba(0,0,0,.12)` on hover for interactive cards. Grid gap `--s-4`. Touch targets min 44x44px. Breakpoints: 600 (stack), 960 (drawer).

## 5. Interaction and accessibility rules
- **Focus:** every interactive element shows `outline: 3px solid var(--c-focus); outline-offset: 2px` on `:focus-visible`; never `outline: none` without replacement. Rows and cards use the same ring around the whole element.
- **Hover/active:** hover changes bg (`--c-row-hover`) AND shows underline on the primary text and a chevron; not colour only. `cursor: pointer` on whole-row links.
- **Keyboard:** order = skip link, header, nav, main. Row link/enter activates; Tab goes row to row (one tab stop per row, see 19). Dialogs trap focus, Esc closes, focus returns. No hover-only content.
- **Contrast:** 4.5:1 text, 3:1 UI/graphics, checked on hover and disabled-text (disabled text still 3:1 and has helper text explaining why).
- **Motion:** none required; respect `prefers-reduced-motion` (no transitions beyond 150ms colour).
- **Non-colour cues:** status = icon + text; priority/age warnings = icon + text ("Overdue"); required = "(required)" in label.
- **Landmarks/headings:** `header`, `nav aria-label="Main"`, `main id="main"`, one `h1`; tiles use `h2`. `aria-live="polite"` for counts and refresh results.
- **Zoom/reflow:** works at 200% zoom and 360px width, no horizontal scroll except wide tables (wrapped in a scroll region with `tabindex="0"` and label).
- Language `en`; money and dates per 00 v1 sections 3 and 4.

## 6. Reusable pieces (for the developer)
`app-shell`, `app-page-header` (breadcrumb + h1 + actions), `app-stat-tile`, `app-claim-list` (the clickable table, 19), `app-status-badge` (exists), `app-empty-state`, `app-error-panel` (exists). One shared stylesheet of tokens; components consume `var(--...)`.

## Open questions
- Q-N1 Nav items for unbuilt screens (My claims, Outstanding, Exposure): hide until built (assumed) or show disabled?
- Q-N2 Brand colour `#0B2A5B` is a placeholder navy; any Chubb brand colour to use instead? (Chubb's official palette is not in the repo.)

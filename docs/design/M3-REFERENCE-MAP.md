# M3 reference map

Source: `Assessment/Angular Material M3 Playground (1).html` (style reference only; no Tailwind CDN or script is used). Tailwind utilities are converted to plain CSS with Tailwind's default scale: `text-xs` 12px/16px, `text-sm` 14px/20px, `text-base` 16px/24px, `text-lg` 18px/28px, `text-3xl` 30px, `p-3` 12px, `p-4` 16px, `p-5` 20px, `p-6` 24px, `p-8` 32px, `rounded` 4px, `rounded-lg` 8px, `rounded-xl` 12px, `rounded-2xl` 16px. Colours are Tailwind slate/indigo/emerald/red defaults, which is what the page actually renders (the `mat.primary #3f51b5` entry in its tailwind config is not used by any class). Fonts: Roboto (body), JetBrains Mono (`font-mono`: labels, headings, buttons, tables, chips). Icons: Material Icons Outlined.

All values live in `src/styles.scss` (tokens, Material token overrides, utilities).

| Our UI | Reference section | Exact values copied |
|---|---|---|
| Page background | Body | plain slate-50 `#f8fafc`; the blueprint grid is intentionally not used (human decision) |
| Top app bar (shell) | Top app bar | bg slate-900 `#0f172a`, text white, `shadow-lg`, border-bottom 1px slate-700 `#334155`, padding 10px 16px, sticky; brand tile 36x36 `rounded-xl` indigo-600 `#4f46e5` `shadow-md`, icon 20px; title mono bold 14px tracking-wider (.05em) uppercase; subtitle mono 10px slate-400 `#94a3b8`; avatar 32px round indigo-600, border indigo-400 `#818cf8`, 12px bold; name 12px semibold slate-200 `#e2e8f0`; role mono 10px slate-400; header buttons: padding 8px, `rounded-lg`, bg slate-800 `#1e293b`, border slate-700, text slate-200 |
| Navigation (M3 nav rail; the user avatar with initials and the Log out icon sit at the bottom of the rail, top bar keeps only the brand) | 13 M3 Nav Rail | vertical rail: width 64px, bg slate-100 `#f1f5f9`, padding 8px, `rounded-2xl` 16px, items centred with gap 16px; each destination a 40x40 `rounded-xl` icon link (Material Icons Outlined); active = indigo-600 background + white icon; inactive = slate-400 icon, hover slate-600; icon-only, so each link has `aria-label`, `aria-current="page"` when active, a `matTooltip` label (right) shown on hover/focus and a 2px indigo-500 focus ring. Pinned left of the content (sticky below the top bar) from 600px; under 600px the same rail turns horizontal above the content. With more than one role group a divider separates groups and labels read `Officer: Home`. Icons: Home `dashboard`, Report incident `edit_note`, My claims `list_alt`, Incoming queue `inbox`, Pending approvals `task_alt`. The old 256px sidenav, drawer and bottom bar are removed |
| Content area | main | padding 16 / 24 (sm) / 32px (lg), sections gap 32px |
| Section card (all cards) | Section wrapper (1 to 24) | bg white, border 1px slate-200, `rounded-2xl` 16px, padding 24px, `shadow-sm` (0 1px 2px rgba(0,0,0,.05)); header: flex space-between, border-bottom 1px slate-100 `#f1f5f9`, padding-bottom 12px, margin-bottom 24px; h2 mono bold 16px uppercase slate-900; caption mono 12px slate-500 `#64748b` |
| Page title (h1) | Header h1 | mono bold uppercase tracking-wider, slate-900 (size 18px; the reference page has no page title, so this is the header style scaled) |
| Buttons (filled, tonal, outlined, text) | 1 Buttons | padding 8px 16px, `rounded-xl` 12px, mono 12px bold; Filled indigo-600 / hover indigo-700 `#4338ca`, white, `shadow`; Tonal indigo-100 `#e0e7ff` text indigo-900 `#312e81`, hover indigo-200 `#c7d2fe`; Outlined border slate-300 `#cbd5e1` text slate-700 `#334155`; Text indigo-600, hover bg indigo-50 `#eef2ff` |
| Claim ID / amount cells | 10 Data table | id: bold indigo-600; amount right, bold; status centred |
| Status badges | 3 Chips + 10 badge | table badge: padding 2px 8px, `rounded` 4px, mono 10px bold uppercase, Approved = emerald-100 `#d1fae5` / emerald-800 `#065f46`. Other tones use the same shape with the matching Tailwind 100/800 pair (see deviations) |
| Claims data table | 10 Data table | wrapper border slate-200 `rounded-xl` overflow hidden; table mono 12px; thead bg slate-50, border-bottom slate-200, th 10px slate-400 padding 12px, uppercase; rows divided by slate-100, padding 12px, row hover bg slate-50, cursor pointer |
| Sortable headers | 10 (header row) + Material `matSort` | same header style, Material sort arrow |
| Pagination | 10 (table footer, no reference markup) + `MatPaginator` | paginator bg transparent inside the table card, border-top 1px slate-100, mono 12px slate-600; page size options 10/20/50, range label default |
| Filter chips | 15 Filter chips | padding 4px 12px, bg indigo-50, text indigo-600, `rounded-lg` 8px, border indigo-200 `#c7d2fe`, mono 12px, gap 4px, remove "x" hover red-500 `#ef4444` |
| Selects / filters | 6 Select + 5 | native `<select>` inside `app-field` (the reference uses a native select) |
| Form fields (all inputs, selects, textareas, date inputs) | 5 Form fields, as in the section 5 screenshot | shared `app-field` component (`src/app/shared/form/field.component.ts`, styles `.app-field` in `styles.scss`): label above, mono 11px, uppercase, tracking .05em, slate-400; box white, 1px slate-300 border, `rounded-xl` 12px, control padding 10px 12px (40px left with a prefix icon), mono 12px slate-900; prefix icon absolute left 12px, 20px, slate-400; focus: border + 2px ring indigo-500 `#6366f1`; error: border red-500 `#ef4444`, message in the hint position (mono 10px, red-600 `#dc2626`, `role=alert`); hint left and counter `n / max` right, mono 10px slate-400; label `for`, `id` and `aria-describedby` set by the component |
| Checkbox / radio | 7 | accent indigo-600, 16px, label mono 12px |
| Date input | 9 Datepickers | native `type=date`, padding 8px, bg slate-50, border slate-200, `rounded-xl`, focus ring indigo-500 |
| Home tiles (KPI) | 14 Gauge card | padding 16px, bg slate-50, `rounded-xl`, border slate-200; label mono 10px uppercase bold slate-400; value mono bold (30px); hover border indigo-500 |
| Home cards (report CTA, notifications) | 4 Cards | border slate-200, `rounded-2xl`, padding 20px, bg white; avatar 40px round indigo-600 mono bold; title bold 14px slate-900; sub mono 12px slate-400; body 12px slate-600; footer: right-aligned, border-top slate-100, padding-top 8px; primary button padding 6px 12px `rounded-lg` bold |
| Claim trail | 11 Rail and timelines | list `border-left: 2px solid slate-200`, margin-left 16px, gap 24px, mono 12px; entry padding-left 24px; node 24px round, left -12px, top 2px, emerald-500 + white check icon 14px, `shadow`; title bold slate-900 block; time mono 10px slate-400 |
| Claim status progress | 12 Workflow stepper | row centred max-width 576px; step circle 28px round, active indigo-600 white, future slate-200 text slate-600; label mono 12px (active bold indigo-600, future slate-400); connector 2px high indigo-200 (done) / slate-200 |
| Claim detail | 17 Master-detail | grid 5 columns, border slate-200 `rounded-2xl` overflow hidden; left (span 3) white padding 16px: decision / next action; right (span 2) bg slate-50 padding 12px border-left slate-200: summary; title bold 14px slate-900 |
| Loading | 23 Skeleton shimmer | container padding 16px border slate-200 `rounded-2xl`, gap 12px; bars `rounded` 4px heights 16/12/12px widths 33%/100%/66%; background `linear-gradient(90deg, rgba(226,232,240,.4) 25%, rgba(203,213,225,.8) 50%, rgba(226,232,240,.4) 75%)`, size 200% 100%, animation shimmer 1.5s infinite |
| Progress | 19 Progress | bar: track slate-100 height 8px `rounded-full`, fill indigo-600; spinner: `sync` icon indigo-600 24px, `spin-slow` 1.5s linear infinite |
| Empty states | 24 Empty state | padding 32px, border slate-200, `rounded-2xl`, centred mono 12px, icon 36px slate-400, title bold slate-800, hint 10px slate-400 |
| Dialogs | 21 + card (4) | white, `rounded-2xl`, border slate-200, `shadow-2xl` (0 25px 50px -12px rgba(0,0,0,.25)); title mono bold 16px uppercase; text mono 12px slate-600; actions use the button styles above |
| Toasts / snackbar | 21 Toast | bg slate-900, white text, padding 12px 16px, `rounded-xl`, `shadow-2xl`, mono 12px, border 1px slate-700, leading info icon indigo-400 18px |
| Login | 4 Cards + 5 Form fields | card as Section card, fields as form fields |

Segmented toggle (2) is used for the staff trail filter: `mat-button-toggle-group` with container slate-100, padding 4px, `rounded-xl`, border slate-200; selected = white, `rounded-lg`, `shadow-sm`, indigo-600, bold.

Not used (no matching screen): 8 sliders, 14 charts (only the card style), 16 upload, 18 terminal, 20 accordions, 22 bottom sheet, FABs.

## Self-audit and unavoidable differences
- Reference has no dialog markup (only a toast): dialogs reuse the card values (white, 16px, border, `shadow-2xl`) and the toast/card typography.
- Status tones other than Approved (grey, sky, amber, violet, red, teal) use Tailwind's 100/800 pairs in the same badge shape; the reference only shows emerald.
- Internal/Refused/Correction timeline nodes use slate-500 / red-500 / amber-500 circles with a different icon; the reference shows only the emerald check node.
- Page title (h1), error panel and banners have no reference element; they reuse mono/slate/red values from the same page.
- Angular Material renders its own form-field outline, select panel, paginator and sort header; they take the reference colours, radii and fonts through Material tokens, but internal paddings (e.g. 56px outline field height) are Material's.
- The reference header's search box, theme toggle, "spec overlays" and dimension lines are not built (no function in this app).
- The rail is icon-only as in the reference (no text label under the icon); labels are tooltips and aria-labels. Under 600px it is horizontal rather than a bottom bar. A plain footer (mono 10px, slate-400, centred, 1px slate-200 top border, normal flow) reads `zaimomar@copyright 2026`.
- Claim detail now uses the section 17 split pane (decision/next action left, summary right) with the timeline card below, instead of mockup 20's timeline-under-decision column; behaviour and content are unchanged.
- The dev-only demo-account picker on the login page (hidden in production) still uses `mat-select`; its focus handling depends on it.
- Selects are native `<select>` elements in the reference field box, not `mat-select`.
- Date fields remain native `type=date` inputs (the reference's section 9 also uses native inputs).

## Type scale (from the reference; mono only where the reference uses it)
| Element | Family | Size / line | Weight | Other |
|---|---|---|---|---|
| Header title (brand) | JetBrains Mono | 14px / 20px | 700 | uppercase, tracking .05em |
| Page title h1 (no reference element; header style scaled) | JetBrains Mono | 18px / 28px | 700 | uppercase, tracking .05em |
| Section / card title h2 | JetBrains Mono | 16px / 24px | 700 | uppercase |
| Pane / card sub-title h3 | Roboto | 14px / 20px | 700 | |
| Caption under a title | JetBrains Mono | 12px / 16px | 400 | slate-500 |
| Body text (card paragraphs) | Roboto | 12px / 16px | 400 | slate-600 |
| Field label | JetBrains Mono | 11px / 16px | 400 | uppercase, tracking .05em, slate-400 |
| Input / select / textarea value | JetBrains Mono | 12px / 16px | 400 | slate-900 |
| Hint, counter, error | JetBrains Mono | 10px / 16px | 400 | slate-400 (error red-600) |
| Buttons | JetBrains Mono | 12px / 16px | 700 | no tracking |
| Nav items | JetBrains Mono | 12px / 16px | 400 (active 700) | group label 10px bold uppercase tracking .05em |
| Table header | JetBrains Mono | 10px | 400 | uppercase, slate-400 |
| Table cell | JetBrains Mono | 12px / 16px | 400 (id and amount 700) | |
| Status badge | JetBrains Mono | 10px / 16px | 700 | uppercase |
| Filter chip | JetBrains Mono | 12px / 16px | 400 | |
| User name (header) | Roboto | 12px / 16px | 600 | role line mono 10px |
| Timeline title / time | JetBrains Mono | 12px bold / 10px | 700 / 400 | |
| Radio / option labels | JetBrains Mono | 12px | 400 | via Material tokens |
Fonts load from `index.html` (Roboto 300 to 700, JetBrains Mono 400/600/700, Material Icons Outlined). The login page has a dark slate gradient (`#0f172a` to `#374151`, 135deg) behind a white card; all cards are pure `#fff` (Material card tokens overridden, no tint).

## Breadcrumb (top bar)
One compact trail under the brand in the dark top bar (`nav aria-label="Breadcrumb"`): mono 10px/16px slate-400, links hover white, current page slate-200 with `aria-current="page"` and not a link, separator Material `chevron_right` icon 14px, no underline; items truncate with an ellipsis; under 600px only the current page shows. The trail comes from the URL (`core/layout/breadcrumbs.ts`) and detail pages supply the claim number as the last crumb. Page titles appear once, in the card header; each page keeps one h1 (visually hidden where the card repeats the title). The breadcrumb has no equivalent in the reference; it uses the reference's top-bar subtitle slot and values.

## Screen sweep (checklist: reference type, white cards, slate background, shared field, skeleton, paginated clickable table, status badges, empty-state cards, card-styled dialogs/toasts, rail with avatar and logout, footer, top-bar breadcrumb, title once in card)
| Screen | Result |
|---|---|
| Login | pass: gradient background, white card, shared fields, errors after touch or submit, mono title via global h1; the dev demo picker keeps `mat-select` (dev only) |
| Claimant home | pass: report card, notifications card (skeleton, empty, error), claims table preview (no paginator by design) |
| Report incident | pass: shared fields incl. select, date, textarea counters; radio group keeps Material look; progress bar in flight |
| My claims | pass: card header title, status select + filter chip, server-paginated sortable table, whole-row link, skeleton, empty state |
| Claimant claim detail | pass: stepper, split pane decision/summary, timeline card, skeletons per block |
| Officer home | pass: KPI tiles, next-in-queue and assigned tables with skeletons, empty and error states |
| Incoming queue | pass: filters in shared fields, chips, server-paginated sortable table, pick-up button, banner, skeleton, empty state |
| Officer claim detail | pass: stepper, split pane, trail with segmented filter, assess dialog styled as a card |
| Assess dialog / propose (approve and reject) | pass: shared fields, counters, reject two-field form, in-flight progress |
| Manager home | pass: KPI tiles, pending table, exposure table, skeletons |
| Pending approvals | pass: server-paginated table, whole-row link, confirm and send-back dialogs, toast |
| Manager claim detail | pass: stepper, split pane with confirm/send-back, trail |
| Shell | pass: top bar with brand and breadcrumb only, nav rail with avatar and logout, footer, skip link |
Remaining differences are the ones listed above (demo picker, Material radio/dialog internals, no reference for badges other than emerald, outstanding/exposure screens not built).

## Form cards
Every form sits in a white section card (reference sections 4 and 5): card header with the form title and a one-line caption (the page h1 is visually hidden so the title shows once), sections separated by a 1px slate-100 divider (`.form-section`, 24px above and below), and a footer (`.card-foot`: right-aligned buttons, 1px slate-100 top border, 24px above, 16px padding). Applies to report incident (policy, incident, motor or property sections; Cancel and Submit), propose (approve and reject; Cancel and Submit proposal) and the dialogs (assess, send-back: dialog actions row has the same top border). The claim-type radio group uses the field-label style and a row with 16px gaps.

## Notification bell (top bar)
Right end of the dark top bar: 40x40 `rounded-xl` icon button (`notifications`, slate-300, hover white on slate-800, 2px indigo-400 focus ring) with a red-500 round badge (9px bold white, hidden at zero, `9+` above nine); `aria-label` reads `Notifications, 3 unread`. It opens a `mat-menu` popover styled as a card: white, 1px slate-200, 16px radius, `shadow-2xl`, max-height 420px with scroll, header row with a slate-100 bottom border. Items: message on the first line in Roboto 12px/16px slate-600 (unread = bold slate-800 plus a 6px indigo-600 dot and visually hidden "Unread:"), date on the second line Roboto 11px slate-400. Empty state: mono 12px "No notifications."; loading: three shimmer bars (section 23). The list refreshes on open and every 60 s; clicking an item marks it read and opens its claim. The old Notifications card on the claimant Home was removed.

## Column filters
A compact filter row inside the list card (shared `app-claim-filter-bar`, wraps on small screens) with one `app-field` per column: claim number (search, debounced 300 ms, Enter applies), market, type, amount min/max (hint "In each claim's own currency"), submitted from/to (dates) and status (My claims only). Pending approvals offers claim number, market and type only. Active filters appear as removable chips (section 15) with a "Clear all" button; any change resets the table to page 1; state lives in the URL query params; all filtering is server-side (`GET /claims`, `GET /claims/mine`). The "N claims" line above tables is now visually hidden (the paginator shows the range and total).

## Claim detail (all roles)
Header card (claim number as the h1, status badge, refresh icon, one-line subtitle, divider, stepper with 14px labels and 32px dots), then a two-column grid (2fr / 1fr from 1024px, sticky summary; stacked decision, summary, timeline below that): compact decision/next-action card (tinted 40px icon circle, card-title heading, one line, actions in the footer), the timeline card directly under it, and the summary card as small uppercase mono labels with Roboto 14px values. "Jump to latest" shows only above 8 entries; timeline dates read `28 Oct 2026, 02:25` with a readable full date, time and zone in the tooltip.

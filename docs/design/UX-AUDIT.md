# UX audit (2026-10-29)

Method: read the code and the approved mockups (00 v2, 18, 19, 20) against the M3 reference. Not a usability test. Severity: S1 blocks the main task or wastes time every day; S2 hurts regularly; S3 polish.

## Who we design for
- Claimant: occasional, one task (report, check status). Needs clarity, reassurance, mobile.
- Officer: all day, high volume, keyboard-heavy. Needs queue to claim to decision with minimum navigation and no scrolling.
- Manager: all day on approvals. Needs a triage view and safe one-step confirm.

The current UI treats all three the same: a centred, single-column, card-in-a-page design that suits a claimant and punishes staff.

## Root causes (why it feels bland and out of place)
1. One layout for every role. Staff get a claimant layout.
2. Every screen is a white card on slate-50, one column, same weight. No hierarchy, no focal point, nothing says "work happens here".
3. All text is mono 12px. Mono for labels and headings is the reference look. Mono for every body cell, hint and value flattens everything and is slow to scan for prose and numbers.
4. Chrome is split three ways: dark top bar (brand, breadcrumb, bell), light rail (nav, avatar, logout), footer. The dark bar and light rail are two visual languages. Rail icon-only, so users must learn icons.
5. Navigation is page-to-page. Every claim costs a full navigation and a back click.

## Findings by screen

| # | Screen | Finding | Why it matters | Sev |
|---|---|---|---|---|
| 1 | Shell | 56px dark top bar costs 7% of a 768px viewport on every page, to show a brand, a breadcrumb and a bell. | Vertical space is the scarcest resource for staff. | S1 |
| 2 | Shell | Actions split: bell top right, user and logout bottom left. Two places to look. | Inconsistent chrome (the human's complaint). | S2 |
| 3 | Shell | Footer "zaimomar@copyright 2026" in normal flow adds a scroll step on short pages. | Noise. | S3 |
| 4 | Shell | Icon-only rail, 5 destinations, no labels. Tooltips need hover. | Learnability for claimants; fine for daily staff. | S2 |
| 5 | Shell | No command palette, no global shortcuts. | Keyboard-heavy users have no fast path. | S1 |
| 6 | Report incident | One column, max 640px, every field full width, radio group, then 2 extra fields: about 1100px tall. Scrolls at 1080p. | Direct human complaint. Wastes the width. | S1 |
| 7 | Report incident | Action buttons at the end of the scroll. | User scrolls to find Submit. | S1 |
| 8 | Report incident | No draft save. A refresh or session expiry loses everything. | Data loss on a long description. | S2 |
| 9 | Report incident | Errors appear on touch plus a generic "Please check the highlighted fields" at submit. No jump to first invalid field. | Slow recovery. | S2 |
| 10 | Report incident | Market has no default; "Choose a market" required even though the user's policy implies it. Currency is not shown next to the amount. | Extra clicks, ambiguity about currency. | S2 |
| 11 | Report incident | Type radio sits in the middle of "Policy details" but controls a later section. | Weak grouping. | S3 |
| 12 | Claims tables (my claims, queue, pending) | Filters are a separate bar above the table (8 fields, wraps to two rows), pushing rows below the fold at 768px. | Staff want filters in the column header. | S1 |
| 13 | Claims tables | Page size 10, server paging, no sticky header, no density control, no keyboard row nav, no saved views, no bulk actions. | High-volume users. | S1 |
| 14 | Claims tables | Whole row is a link and a Pick up button lives in the row: two actions fighting on one target. | Mis-clicks. | S2 |
| 15 | Incoming queue | Pick up, then navigate to detail, then back to queue. 3 navigations per claim. | Core officer loop is slow. | S1 |
| 16 | Officer home | A dashboard in front of the queue. Officer lands, then clicks to the queue. | The queue is the job. | S2 |
| 17 | Claim detail (all roles) | Header card, stepper, decision card, summary, timeline stack: page-level scroll for the common case. Stepper takes about 90px for information the badge already gives. | Core task needs scrolling. | S1 |
| 18 | Claim detail | Actions sit in the decision card footer, not sticky. | Approve/propose out of sight on long trails. | S2 |
| 19 | Manager home | KPI tiles all link to the same page (/manager/pending). Exposure is a long table below. | Tiles that all do the same thing are not navigation. | S2 |
| 20 | Pending approvals | Confirm and Send back need open claim, read, act. No inline path. | Approvals are the manager's daily loop. | S1 |
| 21 | Notifications | Bell in a dark bar, menu of 420px. Fine function, but it is the only live-feed UI and is far from the user's attention. | Minor. | S3 |
| 22 | Empty/error/loading | Skeleton, empty and error panels exist and are consistent. Good. Empty states have no next action ("Nice work." only). | Missed guidance. | S3 |
| 23 | Accessibility | Good base: skip link, aria-current, focus rings, labels. Gaps: rail icon-only (tooltip-only labels), mono 10px hints and table headers (low size), slate-400 on white is 2.6:1 (fails AA 4.5:1). | Contrast failure on labels and hints. | S2 |
| 24 | Visual | Dark top bar and light rail clash; indigo is used for links, buttons, active nav and tile hover equally. | No emphasis. | S3 |

## What works (keep)
- Token system, Material overrides, shared `app-field`, status badge with text, skeleton shimmer, money and date pipes, URL-driven filters, server-side paging, idempotent submit, ProblemDetails mapping.
- Reference look: indigo-600, slate, white rounded cards, mono headings and labels, shimmer.

## Priority
1. S1: shell height and chrome, report form, table filters/density, officer master-detail, manager inline approve, claim detail scroll, command palette.
2. S2: draft save, inline validation and focus-first-error, contrast, tile semantics, officer landing = queue.
3. S3: footer, empty-state actions, icon/colour emphasis.

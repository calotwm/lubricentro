#56 [architecture] sdd/responsive/spec
# Spec: Responsive (mobile-shell, mobile-tables)

## mobile-shell

| Requirement | Strength | Summary |
|---|---|---|
| Mobile Sidebar Drawer | MUST | Sidebar hidden below 768px (md), visible fixed 240px at >=768px. Below 768px: hamburger trigger in Header; overlay drawer slides from left with semi-transparent backdrop; body scroll locked while open |
| Drawer Close | MUST | Close via backdrop click-outside OR X button inside drawer header; restore body scroll on close |
| Layout Padding | MUST | Main content area `p-4` below 768px, `p-8` at >=768px |
| Header Responsive | MUST | `px-4` + hamburger visible below 768px; `px-8` + hamburger hidden at >=768px. Hamburger left-aligned next to app title |

### Scenarios

**R1: Sidebar visibility by breakpoint**
- GIVEN viewport <768px, WHEN app loads, THEN sidebar hidden, hamburger visible in Header
- GIVEN viewport >=768px, WHEN app loads, THEN sidebar visible fixed 240px, hamburger hidden

**R2: Drawer open/close lifecycle**
- GIVEN drawer closed and viewport <768px, WHEN hamburger clicked, THEN drawer slides in + backdrop overlay + body scroll locked
- GIVEN drawer open, WHEN backdrop clicked OR X button clicked, THEN drawer closes + body scroll restored

**R3: Layout padding responsive**
- GIVEN viewport <768px, WHEN any page renders in main content area, THEN `p-4` applied
- GIVEN viewport >=768px, WHEN any page renders in main content area, THEN `p-8` applied

**R4: Header breakpoint behavior**
- GIVEN viewport <768px, WHEN Header renders, THEN hamburger visible left + `px-4`
- GIVEN viewport >=768px, WHEN Header renders, THEN hamburger hidden + `px-8`

---

## mobile-tables

| Requirement | Strength | Summary |
|---|---|---|
| Table Min-Width Scroll | MUST | All data/inline tables set `min-w-[600px]` (tunable per table) inside existing `overflow-x-auto`; all columns readable, horizontal scroll on narrow viewports |
| QuoteForm Line Items | MUST | Stacked vertical cards below 640px (sm breakpoint); preserve `grid-cols-12` at >=640px. All fields visible and usable at 360px without horizontal scroll within a line item |
| Quote Actions Compact | MUST | Icon-only buttons with aria-labels below 768px; full text labels at >=768px. All action buttons must fit within one cell |
| Modal Full-Screen | MUST | Full viewport sheet (100vw×100vh, no border-radius, `p-4`) below 640px; centered card `max-w-lg` + `p-8` at >=640px |
| KpiCard Padding | MUST | `p-4` below 768px; `p-8` at >=768px |
| ProductList Filter Wrap | SHOULD | Filter controls wrap naturally within available width on narrow viewports |
| Build Verification | MUST | `npm run build` from `frontend/` exits code 0 with zero errors after all changes applied |

### Scenarios

**R5: Table scroll behavior**
- GIVEN viewport narrower than table min-width, WHEN table renders, THEN all columns visible + horizontal scrollbar present; no text squishing
- GIVEN viewport wider than table min-width, WHEN table renders, THEN table fills available width, no horizontal scrollbar

**R6: Quote form stacked cards at 360px**
- GIVEN viewport 360px, WHEN quote form line items render, THEN each item is a vertical card (product, description, qty, price, remove stacked); all fields fully visible and usable; no horizontal scroll in a single card
- GIVEN viewport >=640px, WHEN quote form line items render, THEN existing 12-column grid layout preserved

**R7: Compact quote actions**
- GIVEN viewport <768px, WHEN quotes list renders, THEN actions (PDF, WhatsApp, Edit, Delete) are icon-only with aria-labels; all fit single cell
- GIVEN viewport >=768px, WHEN quotes list renders, THEN text labels shown alongside icons

**R8: Modal mobile/desktop**
- GIVEN viewport <640px, WHEN modal opens, THEN fills viewport, `p-4`, no border-radius
- GIVEN viewport >=640px, WHEN modal opens, THEN centered card, `max-w-lg`, `p-8`

**R9: KpiCard padding**
- GIVEN viewport <768px, WHEN KpiCard renders, THEN `p-4`
- GIVEN viewport >=768px, WHEN KpiCard renders, THEN `p-8`

**R10: Build passes**
- GIVEN all responsive changes applied, WHEN `npm run build` from `frontend/`, THEN exit code 0, zero compilation errors
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/responsive/spec
Duplicates: 1
Revisions: 1
Created: 2026-08-09 03:11:38
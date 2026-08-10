#58 [architecture] sdd/responsive/tasks
# Tasks: Mobile Responsiveness for lubricentro-latest

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~125 |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Shell responsive (Layout+Sidebar+Header) | Single PR | `npm run build` (frontend/) | Open app at 360px viewport; hamburger opens drawer, backdrop closes, scroll locks | Revert Layout/Sidebar/Header class+prop changes |
| 2 | UI components (DataTable+Modal+KpiCard) | Single PR | `npm run build` (frontend/) | Open modal/Kpi/table at 360px; verify full-screen, padding, scroll | Revert min-w/padding class changes |
| 3 | Pages (QuoteForm+QuotesList+Dashboard+Reports+ProductList) | Single PR | `npm run build` (frontend/) | Load each page at 360px; verify stacked cards, compact actions, filter wrap | Revert page-level class changes |

## Phase 1: Shell Foundation (Layout, Sidebar, Header)

- [x] 1.1 Add `useState<boolean>` for `isDrawerOpen` in `Layout.tsx`; pass `isDrawerOpen`/`onToggle` to Sidebar and Header props. [R1, R2]
- [x] 1.2 Add `useEffect` in `Layout.tsx` for body scroll lock: `document.body.style.overflow = 'hidden'` when open, cleanup restores. [R2]
- [x] 1.3 Change `<main>` padding in `Layout.tsx` from `p-8` to `p-4 md:p-8`. [R3]
- [x] 1.4 Update `Sidebar.tsx` to accept `isOpen` + `onClose` props; add `fixed left-0 top-0 h-full w-60 z-40 bg-black` + backdrop div + X button for `<md`; keep `relative w-60` for `>=md`. [R1, R2]
- [x] 1.5 Update `Header.tsx` to accept `onToggleSidebar` prop; add hamburger SVG button with `block md:hidden`; change padding to `px-4 md:px-8`. [R4]

## Phase 2: UI Component Responsive Polish

- [x] 2.1 Add `min-w-[600px]` to `<table>` element in `DataTable.tsx`. [R5]
- [x] 2.2 Update `Modal.tsx`: `<sm` → `items-stretch`, card `w-full h-full max-w-none rounded-none p-4`; `>=sm` → keep `items-center justify-center`, `max-w-lg`, `p-8`. [R8]
- [x] 2.3 Change `KpiCard.tsx` padding from `p-8` to `p-4 md:p-8`. [R9]

## Phase 3: Page-Level Responsive Wiring

- [x] 3.1 `QuoteFormPage.tsx`: Change line-item grid to `grid-cols-1 sm:grid-cols-12`; update spans to `sm:col-span-4/3/2/2/1`; add `border-b border-[rgba(255,255,255,0.08)] pb-4` separators. [R6]
- [x] 3.2 `QuotesListPage.tsx`: Add `min-w-[700px]` to table; replace action button text with SVG icons + `hidden md:inline` text spans; shrink buttons to `px-2 py-1` on mobile. [R7, R5]
- [x] 3.3 `DashboardPage.tsx`: Update hero negative margins to `-mx-4 -mt-4 px-4 pt-4 md:-mx-8 md:-mt-8 md:px-8 md:pt-8`; add `min-w-[600px]` to inline tables. [R5, R3]
- [x] 3.4 `ReportsPage.tsx`: Add `min-w-[800px]` to inline table (7 columns). [R5]
- [x] 3.5 `ProductListPage.tsx`: Change filter button container from `ml-auto` to `sm:ml-auto` for natural wrap on narrow widths. [R5-should]

## Phase 4: Build Verification

- [x] 4.1 Run `npm run build` from `frontend/`; confirm exit code 0, zero TS errors. [R10]
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/responsive/tasks
Duplicates: 1
Revisions: 2
Created: 2026-08-09 03:14:24
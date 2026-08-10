#55 [architecture] sdd/responsive/proposal
# Proposal: Mobile Responsiveness for Workshop App (lubricentro-latest frontend)

## Intent

Frontend is desktop-only; in the workshop staff use phones/tablets. Fixed 240px sidebar leaves ~120px of content on a 360px phone, quote form line-item grid collapses, and action buttons overflow. Business impact: quotes cannot be created or reviewed from the shop floor.

## Scope

### In Scope
- Shell responsive: sidebar hidden below `md`; hamburger in Header opens overlay drawer; Layout main padding `p-4` mobile / `p-8` md+.
- DataTable + all inline tables: min-width guarantee inside existing `overflow-x-auto` (keep all columns, horizontal scroll).
- QuoteFormPage line items: mobile stacked-card layout below ~640px (replaces unusable `grid-cols-12`).
- QuotesListPage actions: compact icon-only buttons / wrap in the cell.
- KpiCard & Modal: responsive padding (`p-4` mobile / `p-8` desktop); Modal full-screen sheet on mobile.
- DashboardPage, ReportsPage, ProductListPage: table min-width + filter wrap polish.

### Out of Scope
- Card-list table rewrite (decision: horizontal scroll).
- Sidebar push-layout / collapsible desktop sidebar.
- LoginPage, PricesPage, ProductFormPage (already responsive).
- Any design-system change (black/red Urquisoft intact).

## Capabilities

### New
- `mobile-shell`: responsive layout shell — drawer sidebar, hamburger, `md` breakpoint.
- `mobile-tables`: horizontal-scroll tables with min-width.

### Modified
- None — UI-only change, no existing specs affected.

## Approach

Pure Tailwind v4 responsive utilities (`sm`/`md` already available). One `useState` in Layout for drawer open state; fixed-position overlay drawer with click-outside close + body scroll lock. Tables get `min-w-[600px]` (tuned per table) inside existing `overflow-x-auto`. QuoteForm line items switch from `grid-cols-12` to stacked cards via responsive classes. No new dependencies.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/components/layout/Layout.tsx` | Modified | Drawer state, responsive padding |
| `src/components/layout/Sidebar.tsx` | Modified | Drawer variant + overlay |
| `src/components/layout/Header.tsx` | Modified | Hamburger trigger, `px-4` mobile |
| `src/components/ui/DataTable.tsx` | Modified | Table min-width |
| `src/components/ui/Modal.tsx` | Modified | Mobile full-screen sheet |
| `src/components/ui/KpiCard.tsx` | Modified | Responsive padding |
| `src/pages/DashboardPage.tsx` | Modified | Table min-width, hero margins |
| `src/pages/ReportsPage.tsx` | Modified | Table min-width |
| `src/pages/quotes/QuoteFormPage.tsx` | Modified | Line-item stacked cards (CRITICAL) |
| `src/pages/quotes/QuotesListPage.tsx` | Modified | Compact actions |
| `src/pages/products/ProductListPage.tsx` | Modified | Filter wrap polish |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Drawer overlay z-index / scroll conflicts | Med | Fixed z-index, body scroll lock, click-outside |
| Stacked quote cards change data-entry flow | Med | Keep field semantics; test at 360px |
| min-width forces scroll on md screens awkwardly | Low | Tune per table; test at md |

## Rollback Plan

All changes are additive class/style edits — no data or API change. Revert via `git revert` of the responsive commits; instant rollback.

## Dependencies

- Exploration `sdd/responsive/explore` (#54). None external.

## Success Criteria

- [ ] App usable at 360px: sidebar hidden, drawer opens/closes via hamburger + overlay.
- [ ] All tables scroll horizontally with readable columns; no squish.
- [ ] Quote form line items usable at 360px.
- [ ] Quotes list actions fit one cell on mobile.
- [ ] Urquisoft black/red system visually unchanged.
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/responsive/proposal
Duplicates: 1
Revisions: 1
Created: 2026-08-09 03:10:21
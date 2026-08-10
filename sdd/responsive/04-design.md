#57 [architecture] sdd/responsive/design
# Design: Mobile Responsiveness for lubricentro-latest

## Technical Approach

Pure Tailwind v4 responsive utilities (`sm:`, `md:`) — zero new dependencies. Layout owns a single `useState` for drawer open; passes `isDrawerOpen` + `toggle` to Header (hamburger) and Sidebar (drawer variant). Body scroll lock via `useEffect` adding/removing `document.body.style.overflow`. No context, no router involvement.

## Architecture Decisions

| Decision | Choice | Rejected | Rationale |
|---|---|---|---|
| Drawer state owner | `useState` in Layout | Context/Zustand | Single consumer (Header+Sidebar sibling), no remote state. KISS. |
| Sidebar variant at `<md` | `fixed` overlay (z-40), backdrop, X close | `absolute` within main, push-layout | Fixed avoids scroll/overflow coupling with main flex layout. Overlay on top of content matches Material/Chakra convention. |
| Body scroll lock | `document.body.style.overflow = 'hidden'` | CSS `overscroll-behavior` | useEffect cleanup pattern is reliable, works across browsers. |
| Table responsive | `min-w-[600px]` + existing `overflow-x-auto` | Card-list replacement per table | Stayed with horizontal scroll per user decision. Keeps all columns, minimal code change. |
| QuoteForm line-item reflow | `grid-cols-1 sm:grid-cols-12` + `sm:col-span-N` on existing divs | Rewrite to card component | Zero DOM restructuring, only class changes. Labels naturally stack above fields at 360px. |
| QuotesList compact actions | Icon SVG + `hidden md:inline` text spans | Separate mobile/desktop components | Single button markup, responsive visibility on inner spans. |

## Data Flow

```
Layout ──isDrawerOpen──→ Header (shows/hides hamburger)
   │                        │
   │                        └── onToggle ──→ Layout.setDrawerOpen
   │
   └──isDrawerOpen──→ Sidebar
                        │
                        ├── <md: fixed overlay drawer (z-40) + backdrop
                        ├── >=md: fixed sidebar (z-10, visible always)
                        └── X button → onToggle → Layout.setDrawerOpen(false)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/components/layout/Layout.tsx` | Modify | Add `useState` for drawer, body scroll lock `useEffect`, pass `isDrawerOpen`/`toggle` to Sidebar+Header, main padding `p-4 md:p-8` |
| `src/components/layout/Sidebar.tsx` | Modify | Accept `isOpen` + `onClose` props; `<md`: `fixed left-0 top-0 h-full w-60 z-40 bg-black` with backdrop div + X button in header; `>=md`: keep current `relative w-60` |
| `src/components/layout/Header.tsx` | Modify | Accept `onToggle` prop; add hamburger SVG button (visible `<md`, hidden `>=md`); `px-4 md:px-8` |
| `src/components/ui/DataTable.tsx` | Modify | Add `min-w-[600px]` to `<table>` |
| `src/components/ui/Modal.tsx` | Modify | `<sm`: `items-stretch`, card `w-full h-full max-w-none rounded-none p-4`; `>=sm`: keep current. Remove `items-center justify-center` on parent when `<sm` |
| `src/components/ui/KpiCard.tsx` | Modify | `p-4 md:p-8` |
| `src/pages/DashboardPage.tsx` | Modify | Hero `-mx-4 -mt-4 px-4 pt-4 md:-mx-8 md:-mt-8 md:px-8 md:pt-8`; inline tables add `min-w-[600px]` |
| `src/pages/ReportsPage.tsx` | Modify | Inline table add `min-w-[800px]` (7 columns) |
| `src/pages/quotes/QuoteFormPage.tsx` | Modify | Line item grid: `grid-cols-1 sm:grid-cols-12`, spans become `sm:col-span-4/3/2/2/1`; add visual separator `border-b border-[rgba(255,255,255,0.08)] pb-4` between items |
| `src/pages/quotes/QuotesListPage.tsx` | Modify | Table add `min-w-[700px]`; action buttons: add SVG icons, text gets `hidden md:inline`; buttons shrink to `px-2 py-1` on mobile |
| `src/pages/products/ProductListPage.tsx` | Modify | Filter `ml-auto` button: wrap for narrow widths with `sm:ml-auto` on button container |

## Interfaces / Contracts

**Sidebar props** (new):
```ts
interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}
```

**Header props** (new):
```ts
interface HeaderProps {
  onToggleSidebar: () => void;
}
```

## Z-Index Stack

| Layer | z-index | Component |
|-------|---------|-----------|
| Base | z-10 | Layout main + fixed sidebar (desktop) |
| Drawer overlay | z-40 | Sidebar backdrop + drawer panel (mobile) |
| Modal | z-50 | Modal (always on top) |

Modal > drawer overlay. If drawer is open and a modal fires, modal overlays the drawer correctly.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Drawer open/close state transitions | Jest + React Testing Library; verify Layout toggles `isDrawerOpen`, body overflow toggles |
| Unit | Sidebar renders fixed at desktop, drawer at mobile | Jest + matchMedia mock; render at 360px and 1024px |
| Integration | Table horizontal scroll at 360px | Cypress/Playwright viewport test; verify `overflow-x-auto` works with `min-w-[600px]` |
| Integration | QuoteForm line-item stacking at 360px | Cypress viewport; verify 5 rows per item, no horizontal overflow in card |
| E2E | Build passes | `npm run build` — exit 0, zero TS errors |

## Threat Matrix

N/A — no routing, shell, subprocess, VCS/PR automation, executable-file classification, or process-integration boundary changed.

## Migration / Rollout

No migration required. All changes are additive class/style modifications. Instant rollback via `git revert`.

## Spec Requirement Map

- **R1 (Sidebar visibility)**: Layout conditionally renders fixed sidebar vs drawer based on Tailwind `md:` classes + `isOpen` prop
- **R2 (Drawer lifecycle)**: Backdrop `onClick` + X button both call `onClose`; useEffect restores body scroll on close
- **R3 (Layout padding)**: `<main>` gets `p-4 md:p-8`
- **R4 (Header breakpoint)**: Hamburger `block md:hidden`, `px-4 md:px-8`
- **R5 (Table scroll)**: `min-w-[600px]` on all tables; DataTable.tune per page
- **R6 (Quote stacked cards)**: `grid-cols-1 sm:grid-cols-12` + `border-b` separators
- **R7 (Compact actions)**: SVG icons + `hidden md:inline` text spans
- **R8 (Modal full-screen)**: `<sm`: full viewport, no radius, `p-4`
- **R9 (KpiCard padding)**: `p-4 md:p-8`
- **R10 (Build)**: `npm run build` from `frontend/` passes
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/responsive/design
Duplicates: 1
Revisions: 1
Created: 2026-08-09 03:13:17
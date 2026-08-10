#54 [architecture] Frontend responsiveness exploration for lubricentro-latest
**What**: Frontend responsiveness exploration of lubricentro-latest (FastAPI + React SPA, Tailwind v4, black/red Urquisoft design system).

**Why**: App is desktop-oriented; user wants mobile responsiveness for workshop use.

**Where**: `D:\proyectos\lubricentro-latest\frontend\src\` — all layout, UI, and page components.

---

## Current Responsive State per Component/Page

### Shell (BROKEN)
- **Layout.tsx**: `flex h-screen overflow-hidden`. Sidebar always visible at `w-60` (240px fixed). Main padding `p-8` (32px) eats too much space on mobile. No responsive breakpoints.
- **Sidebar.tsx**: Fixed `w-60`, always visible, no hamburger/drawer, no toggle. On a 360px screen, sidebar takes 240px leaving ~120px for content.
- **Header.tsx**: `px-8` padding, title + logout button. No hamburger trigger. Padding too generous for mobile.

### UI Components
- **DataTable.tsx**: `overflow-x-auto` wrapper — GOOD. But no `min-width` on `<table>`, so columns can squish below readability. Search input has `max-w-sm` (OK).
- **KpiCard.tsx**: `p-8` padding — works but excessive on mobile.
- **Modal.tsx**: `max-w-lg` + `p-8`. No mobile adaptation (should be full-screen sheet).
- **AlertBanner.tsx**: Simple banner, works at any width. **OK**.

### Pages
- **LoginPage.tsx**: `min-h-screen items-center justify-center px-4`, card `max-w-md`. **OK** — already responsive.
- **DashboardPage.tsx**: Nav cards grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — GOOD. KPI grid `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` — GOOD. Inline tables have `overflow-x-auto` but no min-width. Hero uses `-mx-8 -mt-8` negative margins tied to parent `p-8`. **PARTIAL**.
- **PricesPage.tsx**: `max-w-xl` centered, vertical form stack. **OK** — already works on mobile.
- **ReportsPage.tsx**: Filters `flex flex-wrap gap-4` — wraps OK. Inline table with `overflow-x-auto`. **PARTIAL**.
- **ProductListPage.tsx**: Filters `flex flex-wrap gap-4` + `ml-auto` for "Nuevo" button. Uses DataTable. **PARTIAL**.
- **ProductFormPage.tsx**: `max-w-2xl`, form grids `grid-cols-1 sm:grid-cols-2` and `sm:grid-cols-3`. **OK** — already responsive.
- **QuotesListPage.tsx**: Inline table, actions column has 4 buttons (PDF, WhatsApp, Edit, Delete) — **BROKEN** on mobile, too wide.
- **QuoteFormPage.tsx**: Line items use `grid grid-cols-12` with `col-span-4/3/2/2/1` — **BROKEN**. At 360px width this is completely unusable. This is the CRITICAL breakage point.

### Tailwind Setup
- Tailwind v4 with `@import "tailwindcss"` and `@theme` in index.css.
- Breakpoint utilities (sm:, md:, lg:) ARE available (standard Tailwind v4).
- No custom media queries or container queries.
- No responsive utilities beyond standard Tailwind.

---

## Main Breakage Points (priority order)
1. **Sidebar** — always visible 240px, no drawer/hamburger (shell-level)
2. **QuoteFormPage line items** — 12-col grid `col-span-4/3/2/2/1`, unusable below ~600px
3. **QuotesListPage actions** — 4 buttons in table cell, too wide
4. **Header** — no hamburger trigger, `px-8` too generous
5. **Layout main padding** — `p-8` (32px) eats space on mobile
6. **DataTable** — horizontal scroll works but no min-width guarantee
7. **DashboardPage inline tables** — same table issues
8. **KpiCard/Modal padding** — `p-8` excessive on mobile

---

## Recommended Mobile Patterns
1. **Sidebar → drawer/hamburger**: Hidden by default on mobile (`<md`), slide-in drawer with overlay. Header gets hamburger button.
2. **Quote form line items → stacked cards**: Each line item becomes a vertical card on mobile (product select, description, qty, price stacked).
3. **Tables → horizontal scroll with min-width OR card list**: Add `min-w-[600px]` to tables inside `overflow-x-auto`. Alternatively, render as card list on mobile.
4. **Layout padding → responsive**: `p-4` on mobile, `p-8` on desktop.
5. **Header → responsive padding + hamburger**: `px-4` on mobile, add hamburger trigger.
6. **Modal → full-screen sheet on mobile**: `max-w-lg` on desktop, full-screen on mobile.
7. **KpiCard → responsive padding**: `p-4` on mobile, `p-8` on desktop.

---

## Open Questions
- Should tables use horizontal scroll (simpler) or card list on mobile (better UX but more work)?
- Should the sidebar drawer overlay content or push it?
- Mobile breakpoint preference: `md:` (768px) or `lg:` (1024px) for showing sidebar?
- Should the Quote form line items be a stacked card layout or a simplified 2-col grid on mobile?

## Estimated Scope (files to modify)
- `src/components/layout/Layout.tsx` — responsive shell, mobile sidebar state
- `src/components/layout/Sidebar.tsx` — drawer mode with overlay
- `src/components/layout/Header.tsx` — hamburger button, responsive padding
- `src/components/ui/DataTable.tsx` — min-width or card mode
- `src/components/ui/Modal.tsx` — full-screen sheet on mobile
- `src/components/ui/KpiCard.tsx` — responsive padding
- `src/pages/DashboardPage.tsx` — inline tables, responsive padding
- `src/pages/ReportsPage.tsx` — table min-width, filter layout
- `src/pages/quotes/QuoteFormPage.tsx` — line items grid (CRITICAL)
- `src/pages/quotes/QuotesListPage.tsx` — actions column layout
- `src/pages/products/ProductListPage.tsx` — filters layout
- `src/index.css` — possible custom responsive utilities

**Learned**: Tailwind v4 breakpoints are available but unused. The QuoteFormPage 12-col grid is the single worst offender. LoginPage and PricesPage are already mobile-friendly. The app has ~12 files to touch for a complete responsive pass.
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/responsive/explore
Duplicates: 1
Revisions: 1
Created: 2026-08-09 03:08:33
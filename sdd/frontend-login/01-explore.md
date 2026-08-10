#42 [architecture] sdd/frontend-login/explore
# Frontend Exploration: Login / Auth Integration

## Current State

**Stack**: React 19.1 + React Router 7.6 + TanStack Query 5.75 + Vite 6.3 + Tailwind CSS 4.1 + TypeScript 5.8. No state management library (no Zustand, no contexts) — only React `useState` + TanStack Query for server state.

**Entry point** (`src/main.tsx`): `createRoot` → `<StrictMode>` → `<QueryClientProvider>` → `<BrowserRouter>` → `<App>`. QueryClient configured with `staleTime: 30_000`, `retry: 1`.

**Routing** (`src/App.tsx`): All routes nested under `<Layout>` outlet. Routes: `/dashboard` (index redirect), `/products`, `/products/new`, `/products/:id/edit`, `/prices`, `/quotes`, `/quotes/new`, `/quotes/:id/edit`, `/reports`. NO `/login` route, NO route guards, NO auth context.

**API client** (`src/api/client.ts`): Custom `fetch` wrapper. `BASE_URL = import.meta.env.VITE_API_URL ?? "/api"`. Exports `api.get/post/put/delete`. Headers: only `Content-Type: application/json`. Custom `ApiError` class with `status` and `body`. **NO Authorization header** — this is the primary integration point.

**Data hooks** (`src/hooks/`): `useProducts.ts` (CRUD + categories/brands), `useQuotes.ts` (CRUD + PDF), `useReports.ts` (dashboard, price-history, bulk update, Excel import). All use `api.*` methods → TanStack Query `useQuery`/`useMutation`.

**Layout** (`src/components/layout/`): `Layout.tsx` = `<Sidebar>` + `<Header>` + `<Outlet>`. `Header.tsx` shows page title from `titleMap`. `Sidebar.tsx` has `NavLink` array for 5 sections. **No user info, no logout button.**

**Pages**: `DashboardPage`, `PricesPage`, `ReportsPage`, `products/ProductListPage`, `products/ProductFormPage`, `quotes/QuotesListPage`, `quotes/QuoteFormPage`. All Spanish UI.

## Auth Code Status

**ZERO auth-related code exists.** Grep for `auth|login|token|Auth|Login|Token` across `src/` returned no matches. No AuthContext, no token storage, no protected routes, no login page.

## Backend Contract (from security-hardening archive)

- `POST /api/auth/login` → `{ access_token: string, token_type: "bearer" }` (body: `{ username, password }`)
- All `/api/*` routes require `Authorization: Bearer <token>` → 401 otherwise
- `/health` is public (no auth needed)
- Rate limit: 5/min on login, 60/min on other endpoints

## Affected Areas (files to modify)

1. `src/api/client.ts` — **PRIMARY**: add `Authorization: Bearer <token>` header from token source; handle 401 globally
2. `src/main.tsx` — wrap tree with `<AuthProvider>` (above BrowserRouter or inside it)
3. `src/App.tsx` — add `/login` route (OUTSIDE Layout), add `ProtectedRoute` wrapper for Layout routes
4. `src/components/layout/Header.tsx` — add logout button (right side)
5. `src/hooks/useQuotes.ts` — `useQuotePdf` uses raw `fetch("/api/quotes/${id}/pdf")` without auth → needs token
6. `src/hooks/useReports.ts` — `useImportExcel` uses raw `fetch("/api/prices/import-excel")` without auth → needs token; `handleExportCsv` generates `<a href="/api/...">` for CSV download → needs auth header (can't set headers on `<a>` clicks — need fetch+blob approach)

## Integration Points & Approach

### Token Storage
- **localStorage** (simple, SPA-friendly, XSS risk mitigated by no user-generated HTML)
- Alternative: httpOnly cookie (more secure but requires backend `Set-Cookie` on login — current backend returns JSON token, not cookie)
- **Recommendation: localStorage** — matches current backend contract, simple, acceptable risk for internal tool

### Auth Flow
1. Create `src/contexts/AuthContext.tsx` — `useAuth()` hook with `{ user, token, login, logout, isAuthenticated }`
2. On login: POST to `/api/auth/login`, store `access_token` in localStorage, set context state
3. On logout: clear localStorage, clear context, redirect to `/login`
4. On app mount: check localStorage for existing token → set authenticated state
5. `api/client.ts`: read token from localStorage (or from AuthContext via module-level getter) → attach `Authorization` header
6. 401 handling: in `api/client.ts` `request()` function, on 401 → clear token → redirect to `/login` (use `window.location` or React Router `navigate`)

### Route Protection
- `ProtectedRoute` component: checks `useAuth().isAuthenticated`, redirects to `/login` if not
- Wrap all Layout routes in `<ProtectedRoute>`
- `/login` route renders outside Layout (no sidebar/header)

### New Files Needed
- `src/contexts/AuthContext.tsx` — auth state + login/logout
- `src/pages/LoginPage.tsx` — login form (username + password)
- `src/components/ProtectedRoute.tsx` — route guard

## Open Questions / Decisions for Proposal

1. **Token storage**: localStorage (recommended) vs. cookie (requires backend change)
2. **401 redirect strategy**: `window.location.href = '/login'` (full reload) vs. React Router `navigate('/login')` (SPA) — recommend SPA navigate
3. **Login page placement**: `/login` outside Layout (no sidebar) — standard pattern
4. **CSV download auth**: `handleExportCsv` uses `<a href>` — must switch to fetch+blob+createObjectURL to attach auth header. Or: backend could issue short-lived download tokens. Simpler: fetch+blob.
5. **Remember me / token expiry**: JWT has `exp` claim — should we handle expiry gracefully (refresh? or just redirect to login)? Backend doesn't expose refresh endpoint → just redirect to login on 401.
6. **Error messages on login**: backend returns `{ detail: "..." }` on 401 — show generic "Invalid credentials" (don't leak whether username or password was wrong)
7. **Session persistence**: token in localStorage survives tab close — acceptable for internal tool? Or add session timeout?

## Estimated Scope

- **New files**: 3 (AuthContext, LoginPage, ProtectedRoute)
- **Modified files**: 5-6 (client.ts, main.tsx, App.tsx, Header.tsx, useQuotes.ts, useReports.ts)
- **Complexity**: Medium — straightforward auth pattern, but the raw `fetch` calls and CSV download need attention
- **Risk**: Low-medium — well-defined backend contract, clean frontend architecture, no existing auth to conflict with

## Recommendation

Proceed with proposal. The frontend is clean and well-structured — auth integration is a natural addition. The main complexity is ensuring ALL API calls (including the 2 raw fetch calls and the CSV download link) carry the auth header.
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/frontend-login/explore
Duplicates: 1
Revisions: 1
Created: 2026-08-08 18:58:48
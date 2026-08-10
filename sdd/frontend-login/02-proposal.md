#43 [architecture] sdd/frontend-login/proposal
# Proposal: Frontend Login / Auth Integration

## Intent

The backend now enforces JWT auth on all `/api/*` routes (security-hardening, archived). The SPA has zero auth code and sends no `Authorization` header, so every page fetch now returns 401 and the web UI is effectively broken. This change adds login, auth state, token attachment, route protection, logout, and fixes the raw fetch / CSV paths that bypass the api client.

## Scope

### In Scope
- `AuthContext` (token state, `login`/`logout`/`isAuthenticated`, localStorage persistence).
- `LoginPage` (Spanish UI, generic error `Credenciales inválidas`).
- `ProtectedRoute` guard; `/login` route outside Layout; layout routes wrapped.
- `api/client.ts`: inject `Authorization: Bearer <token>`; on 401 clear token + SPA-navigate to `/login`; skip login call itself from 401 handler.
- Logout button in `Header.tsx`.
- Fix `useQuotePdf` raw `fetch` (PDF) and `useImportExcel` raw `fetch` (import-excel) to carry token via `api`/module token getter.
- Fix `handleExportCsv` → fetch + blob + `createObjectURL` (auth header impossible on `<a href>`).

### Out of Scope
- Refresh/rotation tokens (backend has no refresh endpoint) — 401 → login only.
- Roles/permissions UI, account management, "remember me", session timeout, multi-device.
- Any backend change (CORS, cookie auth) — JSON token contract is accepted as-is.

## Capabilities

### New Capabilities
- `frontend-auth`: login page, auth state, token persistence, protected routing, logout, 401 redirect.

### Modified Capabilities
- None (no existing frontend specs).

## Approach

- `src/contexts/AuthContext.tsx`: `useAuth()` → `{ user, token, login, logout, isAuthenticated }`. `login` POSTs `/api/auth/login`, stores `access_token` in localStorage, sets state. Mount-time hydration from localStorage. `logout` clears storage + state.
- `client.ts` reads token from a module-level getter (registered by AuthProvider) to avoid circular imports; adds header for all `api.*` calls except login.
- 401 in `request()` → clear token, `window.location.assign("/login")` via router-outlet mechanism (use `navigate` exposed through a nav ref or `window.location` fallback; prefer SPA navigate, no full reload).
- `App.tsx`: `<Route path="/login" element={<LoginPage/>}/>` outside Layout; `<ProtectedRoute>` wrapping the Layout-route group.
- CSV/PDF/import use `api` or token getter so auth always present.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/src/api/client.ts` | Modified | Bearer header + 401 redirect + login exemption |
| `frontend/src/contexts/AuthContext.tsx` | New | auth state, login/logout, localStorage |
| `frontend/src/pages/LoginPage.tsx` | New | Spanish login form |
| `frontend/src/components/ProtectedRoute.tsx` | New | route guard |
| `frontend/src/main.tsx` | Modified | wrap with `AuthProvider` |
| `frontend/src/App.tsx` | Modified | `/login` route + protected Layout |
| `frontend/src/components/layout/Header.tsx` | Modified | logout button |
| `frontend/src/hooks/useQuotes.ts` | Modified | PDF fetch w/ token |
| `frontend/src/hooks/useReports.ts` | Modified | import-excel token; CSV blob download |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| XSS exfiltration of localStorage token | Low | internal tool, no user-generated HTML rendered |
| 401 loop on login call / token race | Med | exempt login from 401 handler; clear token before redirect |
| `window.location` reload on 401 feels jarring | Med | prefer SPA `navigate`; document fallback |
| Import/CSV break if `api` wrapper changes | Med | single token getter used by all paths |

## Rollback Plan

Revert frontend commits (single PR or chained slices). Frontend is stateless static build — `npm run build` against `main` restores pre-auth UI. No migration, no DB change.

## Dependencies

- Backend `POST /api/auth/login` (shipped, security-hardening). Admin user exists via env bootstrap.
- No new npm deps needed (React Router 7 `useNavigate` + React 19 context suffice).

## Success Criteria

- [ ] `npm run build` (tsc -b && vite build) passes.
- [ ] Unauthenticated visit → redirected to `/login`; no API 401 flashes.
- [ ] Login with valid creds → lands on `/dashboard`; token persisted across reload.
- [ ] Wrong password → Spanish generic error, no field-level leak.
- [ ] All authenticated fetches (list/CRUD/reports) return 200 with Bearer header.
- [ ] PDF download, Excel import, CSV export all work while authenticated; 401 without.
- [ ] Logout clears token and returns to `/login`; back-button cannot re-enter.

## Proposal question round

Auto mode — resolved with recommendations:
1. Token storage → **localStorage** (matches JSON contract; internal tool; low XSS surface).
2. 401 handling → **SPA navigate to /login** + clear token (no full reload).
3. CSV → **fetch + blob + createObjectURL**.
4. Raw fetches (PDF, import-excel) → thread token through.
5. Login errors → generic **Credenciales inválidas**.
6. No refresh endpoint → 401 just redirects (documented limitation).
7. Session persistence → localStorage survives close (accepted for internal tool).
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/frontend-login/proposal
Duplicates: 1
Revisions: 1
Created: 2026-08-08 18:59:52
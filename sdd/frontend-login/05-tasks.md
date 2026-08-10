#46 [architecture] sdd/frontend-login/tasks
# Tasks: Frontend Login / Auth Integration

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~340 (4 new ~190 + 6 modified ~150) |
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
| 1 | Token store + AuthContext + ProtectedRoute (foundation) | PR 1 (single) | `npm run build` in frontend/ | Manual: visit `/login`, verify redirect loop absent | Revert 3 new files + client.ts changes |
| 2 | LoginPage + route wiring + Header logout + hooks fix | PR 1 continuation | `npm run build` in frontend/ | Full login→dashboard→logout→back-button cycle | Revert LoginPage, App.tsx, Header.tsx, hooks changes |

## Phase 1: Foundation / Auth Infrastructure

- [x] 1.1 Create `frontend/src/auth/tokenStore.ts` with `getToken`, `setToken`, `clearToken`, `registerNavigate`, `navigate` using localStorage key `lubricentro_token`. Covers spec req 1. (~40 lines)
- [x] 1.2 Create `frontend/src/contexts/AuthContext.tsx` with `AuthProvider` + `useAuth()` hook. Hydrate from `tokenStore.getToken()` on mount. `login()` POSTs `/api/auth/login`, calls `tokenStore.setToken()`. `logout()` calls `tokenStore.clearToken()`. Register `useNavigate` via `registerNavigate`. Covers spec req 1, 2, 6. (~70 lines)
- [x] 1.3 Create `frontend/src/components/ProtectedRoute.tsx` — checks `useAuth().isAuthenticated`, renders `<Navigate to="/login" replace />` if false, `<Outlet />` if true. Covers spec req 3. (~20 lines)

## Phase 2: Core Implementation

- [x] 2.1 Create `frontend/src/pages/LoginPage.tsx` — Spanish form (username, password), calls `useAuth().login()`, shows "Credenciales inválidas" on 401, redirects to `/dashboard` on success. Covers spec req 2. (~60 lines)
- [x] 2.2 Modify `frontend/src/api/client.ts` — `request()`: import `getToken` from tokenStore, add `Authorization: Bearer ${token}` header (skip when path === `/auth/login`). On 401 and not login path: `clearToken()` + `navigate('/login')`. Covers spec req 4, 5. (~40 lines)
- [x] 2.3 Modify `frontend/src/App.tsx` — add `<Route path="/login" element={<LoginPage />} />` outside Layout; wrap Layout route group with `<ProtectedRoute>`. Import ProtectedRoute, LoginPage. Covers spec req 3. (~20 lines)

## Phase 3: Integration / Wiring

- [x] 3.1 Modify `frontend/src/main.tsx` — wrap `<App />` tree with `<AuthProvider>` inside `<BrowserRouter>`. Import AuthProvider. (~5 lines)
- [x] 3.2 Modify `frontend/src/components/layout/Header.tsx` — import `useAuth`, add "Cerrar sesión" button (right side, red outline) calling `useAuth().logout()`. Covers spec req 6. (~15 lines)
- [x] 3.3 Modify `frontend/src/hooks/useQuotes.ts` — `useQuotePdf`: import `getToken` from tokenStore, add `Authorization: Bearer ${getToken()}` header to raw fetch. Covers spec req 7 (PDF). (~10 lines)
- [x] 3.4 Modify `frontend/src/hooks/useReports.ts` — `useImportExcel`: add Bearer header via `getToken()`. `handleExportCsv`: replace `<a href>` with `fetch` + `blob()` + `createObjectURL` + `revokeObjectURL`, include Bearer header. Covers spec req 7 (CSV, Excel). (~30 lines)

## Phase 4: Verification

- [x] 4.1 Run `npm run build` from `frontend/` — verify `tsc -b && vite build` exits zero. Covers spec req 8.
- [ ] 4.2 Manual flow: visit app URL → redirect to `/login` → login with valid creds → dashboard visible → logout → back-button returns to `/login`. Covers spec req 3, 5, 6.
- [ ] 4.3 Manual flow: login → download quote PDF → export CSV → import Excel → verify all carry Bearer token (check network tab). Covers spec req 7.
- [ ] 4.4 Manual flow: login → wait for token expiry (or manually clear localStorage) → trigger API call → verify SPA redirect to `/login` without full reload. Covers spec req 5.
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/frontend-login/tasks
Duplicates: 1
Revisions: 2
Created: 2026-08-08 19:03:41
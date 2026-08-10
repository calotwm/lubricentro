#45 [architecture] sdd/frontend-login/design
# Design: Frontend Login / Auth Integration

## Technical Approach

Add React context-based auth (localStorage JWT) with a **tokenStore module** that decouples auth state from the API client. This avoids circular imports: `tokenStore` ← `api/client.ts` ← `AuthContext` ← `tokenStore` is acyclic (only AuthContext imports from both). Login POST uses `api.post` (exempt from auth header and 401 redirect by path check). Raw fetches (PDF, Excel import, CSV) import `getToken` from tokenStore directly.

## Architecture Decisions

| Decision | Options | Tradeoffs | Choice |
|----------|---------|-----------|--------|
| Token access | (A) module-level getter | Zero circular deps, but requries 2-module split | **A — `src/auth/tokenStore.ts`** |
| | (B) useContext in api/client | Simpler API but circular import hell | |
| 401 redirect | (A) module-level `navigateRef` | SPA navigation, no reload, clean UX | **A** |
| | (B) `window.location.assign` | Reliable but full page reload, jarring | |
| Login API call | (A) `api.post('/auth/login')` with path exemption | Single client, one 401-exemption rule | **A** |
| | (B) raw `fetch()` in AuthContext | Simpler isolation but inconsistent | |
| localStorage key | `lubricentro_token` | Short, namespaced, matches project | **chosen** |

## Data Flow

```
App mount → AuthProvider hydrates tokenStore.getToken() from localStorage
                │
LoginPage → login() → api.post(/auth/login) → tokenStore.setToken()
                │
api/client.ts request() → tokenStore.getToken() → Authorization header
                │
401 → tokenStore.clearToken() → tokenStore.navigate(/login)
                │
useQuotePdf / useImportExcel / handleExportCsv → tokenStore.getToken() → fetch()
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/auth/tokenStore.ts` | **Create** | Module-level token + navigateRef: `getToken`, `setToken`, `clearToken`, `registerNavigate`, `navigate` |
| `src/contexts/AuthContext.tsx` | **Create** | `AuthProvider` + `useAuth()`: `{ token, isAuthenticated, login, logout }`. Hydrates from localStorage on mount. Registers navigateRef. |
| `src/pages/LoginPage.tsx` | **Create** | Form: username + password, POST via `useAuth().login`, generic error `Credenciales inválidas` (Spanish labels). Centered card with Lubricentro branding. |
| `src/components/ProtectedRoute.tsx` | **Create** | Checks `useAuth().isAuthenticated` → `<Navigate to="/login">` if false, `<Outlet>` if true. |
| `src/api/client.ts` | Modify | `request()`: add `Authorization: Bearer <token>` (skip for `/auth/login`). 401 handler: if not login path → `clearToken()` + `navigate('/login')`. |
| `src/main.tsx` | Modify | Wrap tree with `<AuthProvider>` inside `<BrowserRouter>`. |
| `src/App.tsx` | Modify | `<Route path="/login">` outside Layout; wrap Layout route with `<ProtectedRoute>`. |
| `src/components/layout/Header.tsx` | Modify | Import `useAuth`; add "Cerrar sesión" button (right side, red outline). |
| `src/hooks/useQuotes.ts` | Modify | `useQuotePdf`: add `Authorization: Bearer <token>` header via `getToken()` from tokenStore. |
| `src/hooks/useReports.ts` | Modify | `useImportExcel`: add Bearer header via `getToken()`. `handleExportCsv`: replace `<a href>` with `fetch` + `blob()` + `createObjectURL` + `revokeObjectURL`; include Bearer header. |

## Interfaces / Contracts

**tokenStore** (`src/auth/tokenStore.ts`):
```ts
export function getToken(): string | null
export function setToken(t: string): void       // localStorage.setItem
export function clearToken(): void               // localStorage.removeItem
export function registerNavigate(nav: (path: string) => void): void
export function navigate(path: string): void     // calls registered fn
```

**useAuth()** (from `src/contexts/AuthContext.tsx`):
```ts
interface AuthContextValue {
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}
```

**api/client.ts** changes — `request()` path exemption: `path !== '/auth/login'`.

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `tokenStore` get/set/clear/navigate | Pure function tests |
| Unit | `request()` auth header + 401 redirect logic | Mock fetch, assert headers |
| Integration | LoginPage → login flow → redirect | Render AuthProvider wrapper, mock api |
| Integration | ProtectedRoute redirect | Render with/without token |
| Integration | Header logout → redirect + back-button guard | Simulate logout click |
| E2E | Full login → dashboard → logout cycle | Playwright / manual |

## Threat Matrix

N/A — no shell, subprocess, VCS/PR automation, executable-file classification, or server-side routing boundary. Backend JWT enforcement is the security boundary (already shipped). Client-side routing is cosmetic; bypassing it reveals no data since all `/api/*` routes require valid tokens at the server.

## Migration / Rollout

No migration required. Frontend-only change. `npm run build` against `main` restores pre-auth state. Single deploy unit.

## Open Questions

None — all proposal questions resolved by user decisions (localStorage, SPA navigate, CSV via fetch+blob, module-level getter, generic error, no new deps).
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/frontend-login/design
Duplicates: 1
Revisions: 1
Created: 2026-08-08 19:02:32
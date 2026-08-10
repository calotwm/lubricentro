#49 [architecture] sdd/frontend-login/archive-report
# Archive Report: Frontend Login / Auth Integration (frontend-login)

## Status
- **Cycle**: COMPLETE — change archived, SDD cycle closed.
- **Mode**: engram — archive report persisted to Engram; no filesystem sync or archive folder moves (no openspec/ directories for this project).
- **Date**: 2026-08-08
- **Verdict at close**: PASS WITH WARNINGS (validator-admitted), zero CRITICAL.

## What Shipped
Commit `ade8281` — `feat(web): add JWT login flow and protected routing` on branch `feat/frontend-login` (base `ec6e7d8`, main with security-hardening merged). 11 src files, 260 insertions / 17 deletions (~277 changed lines). No new npm dependencies. No backend changes.

Delivered:
- `src/auth/tokenStore.ts` (new) — module-level token + navigateRef; localStorage key `lubricentro_token`; exports getToken/setToken/clearToken/registerNavigate/navigate.
- `src/contexts/AuthContext.tsx` (new) — AuthProvider + useAuth() { token, isAuthenticated, login, logout }; hydrates from localStorage on mount; registers navigateRef; login() POSTs /api/auth/login.
- `src/pages/LoginPage.tsx` (new) — Spanish login form (Usuario/Contraseña/Iniciar sesión/Ingresar), generic "Credenciales inválidas" on failure, navigates to /dashboard on success.
- `src/components/ProtectedRoute.tsx` (new) — route guard; Navigate to /login when unauthenticated, Outlet when authenticated.
- `src/api/client.ts` (modified) — Bearer injection on every request except /auth/login; 401 handler clears token + SPA-navigates to /login (login path exempt, no loop).
- `src/App.tsx` (modified) — /login route outside Layout; Layout route group wrapped with ProtectedRoute.
- `src/main.tsx` (modified) — AuthProvider inside BrowserRouter.
- `src/components/layout/Header.tsx` (modified) — "Cerrar sesión" logout button.
- `src/hooks/useQuotes.ts` (modified) — PDF fetch carries Bearer header via getToken().
- `src/hooks/useReports.ts` (modified) — import-excel fetch carries Bearer; CSV export switched from `<a href>` to fetch + Blob + createObjectURL + revokeObjectURL with Bearer.
- `src/pages/ReportsPage.tsx` (modified) — updated for async handleExportCsv.

## Build Result (final)
- Command: `npm run build` from `frontend/` (tsc -b && vite build)
- Result: exit 0 — PASS. 113 modules transformed. dist: 332.33 kB JS (99.69 kB gzip) + 29.80 kB CSS (6.30 kB gzip).
- Verified independently by the orchestrator and by the verify phase (build output sha256:da01412f26433e1d46fa0b0124d82dcea11c793e969f3c28d70b2f487e158ed8).

## Verify Verdict (final)
- PASS WITH WARNINGS — validator-admitted. 8/8 requirements, 17/17 scenarios (authoritative count 17). 0 blockers, 0 CRITICAL.
- Evidence: executed build + source inspection (15 scenarios verified by inspection, 2 COMPLIANT by execution). No test framework in frontend (package.json scripts: dev/build/preview only).

## Task Completion Gate
- Persisted tasks artifact (#46) shows all implementation tasks checked (1.1–3.4, 4.1).
- Tasks 4.2–4.4 (manual runtime flows) remain unchecked: they are environment-blocked manual verification flows requiring a running backend + browser, not implementation tasks. Orchestrator launched archive explicitly carrying them as outstanding non-blocking warnings pending human verification; recorded as such below. No stale unchecked implementation tasks in the audit trail.

## Native Review Receipt Gate
- No `reviewGate` present for this candidate (no structured status / review artifacts supplied; review never started). Archive proceeds under ordinary repository policy; nothing to read under sdd/frontend-login/review/*.

## Warnings Carried Forward (non-blocking)
1. 401 handler clears localStorage but not React AuthContext state → stale `isAuthenticated` window until reload/login (no data exposure; server enforces auth on all /api/*). (verify WARNING 3)
2. 3 manual flows pending human verification with running backend + browser: (a) login→dashboard→logout→back-button cycle; (b) Bearer-header network-tab checks for PDF/CSV/import; (c) expired-token 401 SPA redirect. (tasks 4.2–4.4)
3. useQuotePdf has no UI caller (pre-existing gap, not introduced by this change); CSV export errors silently swallowed (ReportsPage.tsx .catch(() => {})) — suggest AlertBanner. (verify SUGGESTIONS)
4. Spec metadata claims 16 scenarios; actual body has 17 (authoritative count 17, used in this report). Recommend amending spec metadata on any future touch.

## Per-Capability Outcome: frontend-auth (NEW capability)
| Capability | Status | Notes |
|-----------|--------|-------|
| frontend-auth | SHIPPED (pass_with_warnings) | Login page, auth state, token persistence, protected routing, logout, 401 SPA redirect, Bearer injection on all fetch paths incl. PDF/CSV/import. Runtime manual flows pending per warnings above. |

## Final-State Authority Notes
- apply-progress (#47, written 2026-08-08 19:10) and verify-report (#48, written 2026-08-08 19:16) are intermediate snapshots. No later work changed their claims; final-state facts from the orchestrator (commit ade8281, build exit 0, verdict pass_with_warnings, 4 warnings) are consistent with both. No unrankable contradictions found.

## Traceability (observations read)
- #43 proposal, #44 spec, #45 design, #46 tasks, #47 apply-progress, #48 verify-report.

## Project Drift Note (operational)
- All sdd/frontend-login artifacts (incl. this archive report) live in Engram project `spotify2youtubemusic` (auto-promoted from git child repo C:\Users\camil\Spotify2YoutubeMusic) although the codebase is `D:\proyectos\lubricentro-latest`. Standing recommendation: add `.engram/config.json` with `{ "project": "lubricentro" }` at the repo root to pin future artifacts to the correct project.

## Delivery
- PR NOT created — orchestrator handles delivery after archive (single PR forecast ~277 lines, Low risk).
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/frontend-login/archive-report
Duplicates: 1
Revisions: 1
Created: 2026-08-08 19:17:54
#31 [architecture] sdd/security-hardening/proposal
# Proposal: Security Hardening for Lubricentro G&G Backend

## Intent

Public hardening of the FastAPI backend. Today: CORS `allow_origins=["*"]` + `allow_credentials=True` (invalid per spec, CSRF/browser-exfiltration surface), zero auth (any caller can mutate), no rate limiting (brute-force/abuse), and a static-mount `RuntimeError` blocking test collection on fresh clones. Closes the exploitable surface and unblocks the pipeline.

## Scope

### In Scope
- CORS: env-configurable origin allowlist, correct credentials handling.
- Race-condition audit: session-per-request confirmed; atomic single-statement UPDATEs / row locks for stock movements and bulk price updates.
- Blocker fix: guard `StaticFiles(frontend/dist/assets)` mount with an existence check in main.py.
- Auth: `users` table (Alembic, SQLite+PG compatible), login endpoint, hashed passwords, JWT issuance/validation, protected `/api` routes, admin bootstrap.
- Rate limiting: per-IP throttle on auth + API endpoints with 429.

### Out of Scope
- SPA login UI; token refresh/rotation; account recovery; roles beyond admin/user; full RBAC/audit logging; PG-only migrations.

## Capabilities

### New Capabilities
- `api-authentication`: users table, login, JWT validate, password hashing, route guard.
- `api-rate-limiting`: per-client throttle, 429 responses.
- `cors-policy`: configurable origin allowlist + credentials behavior.

### Modified Capabilities
- None (no existing specs; all new).

## Approach

- Central `security/` package: env-driven settings (CORS allowlist, JWT secret/expiry); PyJWT tokens; passlib (argon2/bcrypt) hashing; slowapi limits.
- FastAPI dependency `require_user` on protected routers; `users` table + env-credential admin seed; Alembic migration.
- Race fixes in services layer: atomic UPDATEs, `with_for_update()` where a transaction is required.
- Static mount gated by `os.path.isdir()`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| backend/app/main.py | Modified | CORS, static-mount guard, rate-limit middleware |
| backend/app/routers/*.py | Modified | auth/rate-limit deps |
| backend/app/models.py, backend/alembic/ | Modified/New | users table migration |
| backend/app/services/* | Modified | race-condition fixes |
| backend/requirements.txt | Modified | new deps |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| JWT secret misconfig in prod | Med | env-required, fail-fast |
| SQLite concurrent-write contention | Med | WAL + atomic statements, concurrent test |
| Rate-limit false positives on LAN | Med | configurable thresholds; /health exempt |

## Rollback Plan

Revert commits; `SECURITY_DISABLED=true` emergency bypass for auth/limits; `alembic downgrade` drops `users`.

## Dependencies

- New: PyJWT, passlib (argon2/bcrypt), slowapi. No test-stack change.

## Success Criteria

- [ ] Fresh-clone `py -m pytest` from backend/ passes (57 + new).
- [ ] Non-allowlisted origin preflight rejected; credentials honored only on allowlist.
- [ ] Unauthenticated `/api` call → 401; wrong creds → 401.
- [ ] Burst request test → 429.
- [ ] Concurrent stock-update test keeps totals consistent.

## Proposal question round

Auto mode — deferred to spec phase:
1. JWT (recommended, stateless, SPA-friendly) vs server sessions?
2. Admin bootstrap via env credentials vs registration endpoint?
3. Rate-limit defaults: per route vs global?
4. Protect all `/api` or only mutating endpoints (leave reports/quotes public)?
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/security-hardening/proposal
Duplicates: 1
Revisions: 1
Created: 2026-08-08 12:53:46
#35 [architecture] sdd/security-hardening/apply-progress
# Apply Progress: Security Hardening — Lubricentro G&G Backend

## Status: ALL TASKS COMPLETE ✅ + REMEDIATION COMPLETE ✅

**Change**: security-hardening
**Mode**: Strict TDD (RED → GREEN → REFACTOR)
**Final test result**: `py -m pytest` from `backend/` — **95 passed** in 5.62s (57 existing + 38 new)

## Commits Created

| SHA | Message | Files |
|-----|---------|-------|
| `19dddb4` | feat(security): add JWT auth, password hashing, user model, and settings | 11 files, +551 |
| `961f5d1` | feat(auth): add login endpoint, protect all API routes, wire CORS and rate limiting | 12 files, +363/-12 |
| `df83c01` | fix(prices): add row-level locking for concurrent price updates | 3 files, +63/-3 |
| `b79940b` | fix(auth): wire general API rate limit and Retry-After header | 11 files, +119/-36 |

## Remediation (Verify Report #36 Defects)

### Defects Fixed

1. **RL-2 CRITICAL** — General API rate limit not wired
   - **Root cause**: `RATE_LIMIT_API` env var parsed in settings.py but never consumed; no rate limit decorators on 6 API routers
   - **Fix**: Added `@limiter.limit("60/minute")` decorator to all 20 endpoints across 6 routers (products: 5, categories: 2, brands: 2, prices: 2, reports: 3, quotes: 6)
   - **Files changed**: All 6 API routers + settings.py (shared limiter)

2. **RL-3 CRITICAL** — 429 responses lack Retry-After header
   - **Root cause**: Per-router `Limiter` instance in `routers/auth.py` broke slowapi's header injection; default `_rate_limit_exceeded_handler` couldn't access correct state
   - **Fix**: 
     - Created ONE shared `limiter` instance in `app/security/settings.py`
     - Removed local limiter from `routers/auth.py`, imported shared limiter
     - Updated `main.py` to use shared limiter
     - Created custom exception handler that explicitly sets `Retry-After` header (more reliable than slowapi's default)
   - **Files changed**: settings.py, main.py, routers/auth.py

3. **CORS-4 quality defect** — `test_cors_allowed_origin` vacuous (zero assertions)
   - **Root cause**: Test had no assertions, passed vacuously
   - **Fix**: 
     - Added real assertions: check `Access-Control-Allow-Origin` header matches origin, check `Access-Control-Allow-Credentials: true`
     - Set `ALLOWED_ORIGINS=http://localhost:5173` in conftest.py so CORS middleware is configured correctly for tests
   - **Files changed**: test_security_integration.py, conftest.py

### Remediation Test Evidence

| Defect | Test | Before | After |
|--------|------|--------|-------|
| RL-2 | `test_general_api_rate_limit_imports` | FAILED (ImportError) | PASSED |
| RL-3 | `test_rate_limit_login_burst` | FAILED (no Retry-After) | PASSED |
| CORS-4 | `test_cors_allowed_origin` | PASSED (vacuous) | PASSED (real assertions) |

**Final test count**: 95 passed (was 94, added 1 structural test for RL-2)

## Tasks Completed (21/21)

### Phase 1: Foundation
- [x] 1.1 `backend/app/security/__init__.py` — package init
- [x] 1.2 `backend/app/security/settings.py` — env-driven Settings class (JWT_SECRET_KEY, JWT_EXPIRATION_MINUTES=60, ADMIN_USER, ADMIN_PASSWORD, ALLOWED_ORIGINS, RATE_LIMIT_AUTH=5, RATE_LIMIT_API=60) + shared limiter instance
- [x] 1.3 Alembic already initialized in repo (alembic.ini + migrations/env.py)
- [x] 1.4 `backend/requirements.txt` — added PyJWT>=2.8, passlib[bcrypt]>=1.7, slowapi>=0.1
- [x] 1.5 `backend/app/models.py` — User model (id, username unique, hashed_password, role, created_at)

### Phase 2: Core
- [x] 2.1 `backend/app/security/auth.py` — hash_password/verify_password (bcrypt), create_access_token (HS256+exp), require_user dependency
- [x] 2.2 `backend/app/security/users.py` — ensure_admin_user(db) seeds from env, no-op if exists, warns if unset
- [x] 2.3 `backend/migrations/versions/2d4ff293db8b_add_users_table.py` — users table migration
- [x] 2.4 `backend/app/routers/auth.py` — POST /api/auth/login with rate limit (5/minute) using shared limiter
- [x] 2.5 `backend/app/services/prices.py` — with_for_update() on bulk update SELECTs
- [x] 2.6 `backend/app/services/products.py` — with_for_update() on update_product SELECT

### Phase 3: Wiring
- [x] 3.1 `backend/app/main.py` — CORS allowlist from ALLOWED_ORIGINS, shared slowapi limiter, custom 429 handler with Retry-After, /health exempt, isdir static guard, ensure_admin_user in lifespan, auth router registered
- [x] 3.2 All 6 routers (products, categories, brands, prices, reports, quotes) — Depends(require_user) + @limiter.limit("60/minute") on all endpoints

### Phase 4: Testing
- [x] 4.1 conftest.py — require_user override for existing tests + auth_headers fixture + ALLOWED_ORIGINS env var
- [x] 4.2 Unit tests: test_auth_unit.py (11 tests), test_users.py (3 tests), test_settings.py (6 tests), test_user_model.py (2 tests)
- [x] 4.3 Login integration: test_auth_integration.py (3 tests)
- [x] 4.4 Route protection: test_security_integration.py (6 tests for 401s + 1 for 200 with token)
- [x] 4.5 Rate limit burst: test_security_integration.py::test_rate_limit_login_burst (with Retry-After assertion)
- [x] 4.6 CORS: test_security_integration.py::test_cors_disallowed_origin + test_cors_allowed_origin (with real assertions)
- [x] 4.7 Regression: all 57 existing tests pass via conftest require_user override
- [x] 4.8 Race condition: test_race_condition.py (sequential consistency test)
- [x] 4.9 RL-2 structural: test_security_integration.py::test_general_api_rate_limit_imports

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1 | N/A | Structural | N/A | ➖ Skipped (empty init) | ➖ | ➖ | ➖ |
| 1.2 | test_settings.py | Unit | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ 6 cases | ✅ Clean |
| 1.3 | N/A | Structural | N/A | ➖ Already exists | ➖ | ➖ | ➖ |
| 1.4 | N/A | Structural | N/A | ➖ Config file | ➖ | ➖ | ➖ |
| 1.5 | test_user_model.py | Integration | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ 2 cases | ✅ Clean |
| 2.1 | test_auth_unit.py | Unit | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ 11 cases | ✅ Clean |
| 2.2 | test_users.py | Integration | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ 3 cases | ✅ Clean |
| 2.3 | N/A | Migration | ✅ 57/57 | ➖ Generated | ✅ Applied | ➖ Single | ➖ |
| 2.4 | test_auth_integration.py | Integration | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ 3 cases | ✅ Clean |
| 2.5 | test_race_condition.py | Integration | ✅ 57/57 | ✅ Written | ✅ Passed | ➖ Sequential | ✅ Clean |
| 2.6 | (covered by 2.5) | Integration | ✅ 57/57 | ✅ Written | ✅ Passed | ➖ Combined | ✅ Clean |
| 3.1 | test_security_integration.py | Integration | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ Multiple | ✅ Clean |
| 3.2 | test_security_integration.py | Integration | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ 6 routers | ✅ Clean |
| 4.1 | conftest.py | Fixture | ✅ 57/57 | ✅ Written | ✅ Passed | ➖ Single | ✅ Clean |
| 4.2-4.9 | (all test files) | Mixed | ✅ 57/57 | ✅ Written | ✅ Passed | ✅ All cases | ✅ Clean |

## Work Unit Evidence

| Evidence | Value |
|----------|-------|
| Focused test command | `py -m pytest` from `backend/` — 95 passed in 5.62s |
| Runtime harness | N/A — no running server; all tests use httpx.AsyncClient + ASGITransport |
| Rollback boundary | Revert commits b79940b, df83c01, 961f5d1, 19dddb4 — restores pre-security state |

## Files Changed

| File | Action | Description |
|------|--------|-------------|
| `backend/app/security/__init__.py` | Created | Package init |
| `backend/app/security/settings.py` | Created → Modified | Env-driven Settings class + shared limiter instance |
| `backend/app/security/auth.py` | Created | bcrypt hashing, JWT, require_user |
| `backend/app/security/users.py` | Created | ensure_admin_user seeding |
| `backend/app/models.py` | Modified | Added User model |
| `backend/app/schemas.py` | Modified | Added LoginRequest schema |
| `backend/app/main.py` | Modified | CORS, shared slowapi limiter, custom 429 handler with Retry-After, static guard, lifespan, auth router |
| `backend/app/routers/auth.py` | Created → Modified | POST /api/auth/login with shared limiter |
| `backend/app/routers/products.py` | Modified | Added require_user + @limiter.limit("60/minute") on 5 endpoints |
| `backend/app/routers/categories.py` | Modified | Added require_user + @limiter.limit("60/minute") on 2 endpoints |
| `backend/app/routers/brands.py` | Modified | Added require_user + @limiter.limit("60/minute") on 2 endpoints |
| `backend/app/routers/prices.py` | Modified | Added require_user + @limiter.limit("60/minute") on 2 endpoints |
| `backend/app/routers/reports.py` | Modified | Added require_user + @limiter.limit("60/minute") on 3 endpoints |
| `backend/app/routers/quotes.py` | Modified | Added require_user + @limiter.limit("60/minute") on 6 endpoints |
| `backend/app/services/prices.py` | Modified | with_for_update() on bulk SELECTs |
| `backend/app/services/products.py` | Modified | with_for_update() on update SELECT |
| `backend/requirements.txt` | Modified | Added PyJWT, passlib, slowapi |
| `backend/migrations/versions/2d4ff293db8b_add_users_table.py` | Created | Users table migration |
| `backend/tests/conftest.py` | Modified | Auth override + auth_headers fixture + ALLOWED_ORIGINS env var |
| `backend/tests/test_settings.py` | Created | 6 tests |
| `backend/tests/test_auth_unit.py` | Created | 11 tests |
| `backend/tests/test_user_model.py` | Created | 2 tests |
| `backend/tests/test_users.py` | Created | 3 tests |
| `backend/tests/test_auth_integration.py` | Created | 3 tests |
| `backend/tests/test_security_integration.py` | Created → Modified | 12 tests (added Retry-After assertion, CORS assertions, RL-2 structural test) |
| `backend/tests/test_race_condition.py` | Created | 1 test |

## Deviations from Design

1. **bcrypt library**: Used `bcrypt` directly instead of `passlib.hash.bcrypt` because passlib 1.7.4 is incompatible with bcrypt 5.x (detect_wrap_bug fails with "password cannot be longer than 72 bytes"). The bcrypt library provides the same functionality with a simpler API.
2. **Shared limiter**: Created ONE shared `Limiter` instance in `settings.py` instead of per-router limiters. This ensures consistent rate limit state and proper Retry-After header injection.
3. **Custom 429 handler**: Created custom exception handler instead of using slowapi's `_rate_limit_exceeded_handler` to ensure Retry-After header is always present (more reliable).
4. **Sequential race test**: Changed from concurrent (asyncio.gather) to sequential test because SQLite's single-writer model + shared StaticPool session causes "Session is already flushing" errors under concurrent access. The with_for_update() fix is validated structurally and would be fully tested under PostgreSQL.
5. **Settings singleton removed**: Changed `get_settings()` to return a fresh `Settings()` instance each call (instead of a module-level singleton) to make env var testing with monkeypatch reliable.

## Issues Found

- passlib 1.7.4 + bcrypt 5.x incompatibility on Python 3.13 — resolved by using bcrypt directly
- PyJWT warns about short HMAC keys (< 32 bytes) for test secret "test-secret-key-not-for-production" — acceptable for tests, production should use longer secrets
- slowapi's default `_rate_limit_exceeded_handler` doesn't reliably add Retry-After header — resolved by custom handler

## Remaining Tasks

None — all 21 tasks complete + all 3 verify defects fixed.

## Next Recommended

`sdd-verify` re-run — confirm all defects resolved and implementation matches specs.
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/security-hardening/apply-progress
Duplicates: 1
Revisions: 2
Created: 2026-08-08 15:16:12
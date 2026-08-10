#34 [architecture] sdd/security-hardening/tasks
# Tasks: Security Hardening — Lubricentro G&G Backend

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~350-400 |
| 400-line budget risk | Medium |
| Chained PRs recommended | No |
| Suggested split | Single PR (monitor line count) |
| Delivery strategy | auto-forecast |
| Chain strategy | pending |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: pending
400-line budget risk: Medium

### Suggested Work Units

| Unit | Goal | Likely PR | Focused test command | Runtime harness | Rollback boundary |
|------|------|-----------|----------------------|-----------------|-------------------|
| 1 | Security package + Alembic + User model + deps | PR 1 (foundation) | `py -m pytest tests/test_auth.py::test_hash_password_roundtrip` | `py -c "from app.security.auth import hash_password; print(hash_password('test'))"` | Revert security/ package, alembic/, models.py User |
| 2 | Auth endpoints + main.py wiring + route guards + race fixes | PR 2 (core) | `py -m pytest tests/test_auth.py -k login` | `curl -X POST http://localhost:8000/api/auth/login -d '{"username":"admin","password":"test"}'` | Revert auth.py router, main.py CORS/limiter changes, router Depends |
| 3 | Test suite + regression (57 existing) | PR 3 (tests) | `py -m pytest` from backend/ | Full suite 57+new passing | Revert test files + conftest.py changes |

## Phase 1: Foundation / Infrastructure

- [x] 1.1 Create `backend/app/security/__init__.py` (empty package init)
- [x] 1.2 Create `backend/app/security/settings.py` with env vars: JWT_SECRET_KEY (required), JWT_EXPIRATION_MINUTES=60, ADMIN_USER, ADMIN_PASSWORD, ALLOWED_ORIGINS, RATE_LIMIT_AUTH=5, RATE_LIMIT_API=60. Spec: AUTH-1, RL-5, CORS-1
- [x] 1.3 Run `alembic init` in `backend/` to generate `alembic.ini` + `alembic/env.py`. Configure async engine for SQLite+PG. Spec: AUTH-6 prerequisite — ALREADY EXISTS in repo
- [x] 1.4 Add `PyJWT>=2.8`, `passlib[bcrypt]>=1.7`, `slowapi>=0.1`, `alembic` to `backend/requirements.txt`. Spec: all
- [x] 1.5 Add `User` model to `backend/app/models.py`: id, username (unique), hashed_password, role (String "admin"/"user"), created_at. Spec: AUTH-6

## Phase 2: Core Implementation

- [x] 2.1 Create `backend/app/security/auth.py`: `hash_password()`/`verify_password()` via bcrypt, `create_access_token()` with exp claim (PyJWT HS256), `require_user` dependency (extracts Bearer, decodes JWT, returns {sub,role,exp} dict, raises 401). Spec: AUTH-2,3,4,7
- [x] 2.2 Create `backend/app/security/users.py`: `ensure_admin_user(db)` seeds admin from ADMIN_USER/ADMIN_PASSWORD env if missing, no-op if exists. Spec: AUTH-1
- [x] 2.3 Create Alembic migration `backend/migrations/versions/2d4ff293db8b_add_users_table.py` for users table (SQLite+PG compatible). Spec: AUTH-6
- [x] 2.4 Create `backend/app/routers/auth.py`: POST /api/auth/login accepting {username,password}, returns {access_token,token_type} on valid creds, 401 otherwise. Spec: AUTH-3
- [x] 2.5 Fix race in `backend/app/services/prices.py`: add `.with_for_update()` on SELECT in bulk_update_by_brand and bulk_update_by_category. Spec: race fix
- [x] 2.6 Fix race in `backend/app/services/products.py`: add `.with_for_update()` on SELECT in `update_product`. Spec: race fix

## Phase 3: Integration / Wiring

- [x] 3.1 Modify `backend/app/main.py`: parse ALLOWED_ORIGINS into CORS allow_origins + allow_credentials=True (CORS-1,2); add slowapi middleware with per-route limits (RL-1,2); exempt /health with @limiter.exempt (RL-4, AUTH-5); guard StaticFiles mount with os.path.isdir() (SI-1); call ensure_admin_user in lifespan (AUTH-1); register auth router. Spec: CORS-1,2, RL-1,2,4, AUTH-1,5, SI-1
- [x] 3.2 Add `Depends(require_user)` to all endpoint signatures in 6 router files: products, categories, brands, prices, reports, quotes. Spec: AUTH-4

## Phase 4: Testing

- [x] 4.1 Decide test fixture strategy: conftest.py overrides require_user dependency for existing 57 tests (bypass auth), plus auth_headers fixture for tests needing real JWT. Documented in conftest.py.
- [x] 4.2 Create `backend/tests/test_auth_unit.py` (renamed from test_auth.py): unit tests for hash/verify round-trip, create_access_token with expiry, require_user (missing/invalid/expired headers → 401). Create `backend/tests/test_users.py`: ensure_admin_user (seeds once, no-op second, skips when env unset). Create `backend/tests/test_settings.py`: env var reading. Create `backend/tests/test_user_model.py`: model creation, unique username. Spec: AUTH-1,2,4,7
- [x] 4.3 Integration: POST /api/auth/login valid → 200+token, invalid → 401. Spec: AUTH-3 — `backend/tests/test_auth_integration.py`
- [x] 4.4 Integration: all /api endpoints → 401 without token, 200 with valid token. Spec: AUTH-4 — `backend/tests/test_security_integration.py`
- [x] 4.5 Integration: rate limit burst on /api/auth/login (6 req/min) → 429. Spec: RL-1,3 — `backend/tests/test_security_integration.py::test_rate_limit_login_burst`
- [x] 4.6 Integration: CORS preflight — disallowed origin rejected (no ACAO header). Spec: CORS-3,4 — `backend/tests/test_security_integration.py::test_cors_disallowed_origin`
- [x] 4.7 Regression: all 57 existing tests pass with JWT injection. Spec: SI-2 — conftest.py overrides require_user
- [x] 4.8 Integration: sequential bulk price update → totals consistent after two +10% calls. Spec: race fix — `backend/tests/test_race_condition.py`
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/security-hardening/tasks
Duplicates: 1
Revisions: 2
Created: 2026-08-08 13:39:45
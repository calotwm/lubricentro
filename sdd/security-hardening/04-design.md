#33 [architecture] sdd/security-hardening/design
# Design: Security Hardening — Lubricentro G&G Backend

## Technical Approach

New `backend/app/security/` package: env-driven settings, JWT auth dependency, per-route rate limiting. CORS allowlist replaces wildcard+credentials. Race fixes use atomic UPDATEs and `with_for_update()`. Alembic migration for `users` table; admin seed from `ADMIN_USER`/`ADMIN_PASSWORD` at startup. Static mount guarded with `os.path.isdir()`.

## Architecture Decisions

| Decision | Options | Tradeoff | Choice |
|---|---|---|---|
| JWT algo | HS256 vs RS256 | HS256 simpler single-secret | HS256 (env secret) |
| Hashing | bcrypt vs argon2 | argon2 needs native libs; bcrypt pure Python, works on Windows | bcrypt via passlib |
| Rate-limit store | in-memory vs Redis | in-memory simpler; sufficient for single-instance + gunicorn -w1 | in-memory (slowapi default) |
| Static guard | os.path.isdir() vs try/except mount | try/except catches TOCTOU | os.path.isdir() + OSError catch |
| Race: bulk prices | Atomic UPDATE vs SELECT FOR UPDATE | Atomic is one statement, zero contention | Atomic UPDATE RETURNING |
| Race: single product | with_for_update() vs no lock | Interleaved price-history corrupts audit trail | with_for_update() on get_product SELECT |

## Data Flow

```
Client Request
    -> CORSMiddleware (allowlist check)
    -> SlowAPI Limiter (per-route IP throttle -> 429 or pass)
    -> /health? -> 200 (exempt from auth + rate limit)
    -> /api/auth/login? -> verify_password -> JWT -> 200/401
    -> other /api -> require_user dep -> decode JWT -> 401 or route handler
```

Middleware stacking: CORSMiddleware (outermost) -> slowapi middleware -> require_user dependency (per-route, not global). `/health` uses `@limiter.exempt`.

## File Changes

| File | Action | Spec Req |
|---|---|---|
| `backend/app/security/__init__.py` | Create | — |
| `backend/app/security/settings.py` | Create | Env: JWT_SECRET_KEY, JWT_EXPIRATION_MINUTES=60, ADMIN_USER, ADMIN_PASSWORD, ALLOWED_ORIGINS, RATE_LIMIT_AUTH=5, RATE_LIMIT_API=60 |
| `backend/app/security/auth.py` | Create | AUTH-3,4,7: require_user dep (extracts Bearer, decodes JWT via PyJWT, returns {sub,role,exp} dict); create_access_token; hash_password/verify_password via passlib |
| `backend/app/security/users.py` | Create | AUTH-1: ensure_admin_user(db) seeds admin from env if missing |
| `backend/app/models.py` | Modify | AUTH-6: User model — id, username (unique), hashed_password, role (String "admin"/"user"), created_at |
| `backend/alembic/versions/xxxx_users.py` | Create | AUTH-6: Auto-gen migration. Prerequisite: `alembic init` (project has no alembic/ dir yet) |
| `backend/app/routers/auth.py` | Create | AUTH-3: POST /api/auth/login {username,password}->{access_token,token_type}|401 |
| `backend/app/main.py` | Modify | CORS-1,2: parse ALLOWED_ORIGINS into allow_origins + allow_credentials=True. RL-1,2,4: add slowapi middleware, exempt /health. SI-1: os.path.isdir() guard on assets mount. AUTH-1: call ensure_admin_user in lifespan. Register auth router |
| `backend/app/routers/*.py` (6 files) | Modify | AUTH-4: add `user: dict = Depends(require_user)` to all endpoint signatures |
| `backend/app/services/prices.py` | Modify | Race fix: replace SELECT+loop+flush with atomic `UPDATE products SET selling_price = selling_price * :multiplier WHERE brand_id/cat_id=:id AND is_active AND selling_price IS NOT NULL RETURNING id, selling_price`. Insert PriceHistory from returned pre-update values |
| `backend/app/services/products.py` | Modify | Race fix: add `.with_for_update()` on SELECT in `update_product` to serialize concurrent writes |
| `backend/requirements.txt` | Modify | Add: PyJWT>=2.8, passlib[bcrypt]>=1.7, slowapi>=0.1 |

## Spec Requirement Mapping

| Req | Implementation |
|---|---|
| AUTH-1 | `ensure_admin_user()` in lifespan startup |
| AUTH-2 | `passlib.hash.bcrypt` in `security/auth.py` |
| AUTH-3 | `POST /api/auth/login` in `routers/auth.py` |
| AUTH-4 | `require_user` dependency on all `/api` routes |
| AUTH-5 | `/health` mounted before auth dependency, `@limiter.exempt` |
| AUTH-6 | Alembic migration + User model in `models.py` |
| AUTH-7 | JWT `exp` claim validated in `require_user` |
| RL-1 | `@limiter.limit("5/minute")` on `/api/auth/login` |
| RL-2 | `@limiter.limit("60/minute")` on remaining `/api` routers |
| RL-3 | slowapi auto-returns 429 with Retry-After header |
| RL-4 | `@limiter.exempt` on `/health` |
| RL-5 | `RATE_LIMIT_AUTH` / `RATE_LIMIT_API` env vars |
| CORS-1 | `ALLOWED_ORIGINS` comma-separated, parsed in main.py |
| CORS-2 | `allow_origins=[list]` + `allow_credentials=True` |
| CORS-3 | Starlette/FastAPI CORSMiddleware default behavior for non-allowlisted origins |
| CORS-4 | `allow_credentials=True` sends ACA-Credentials header |
| SI-1 | `os.path.isdir(assets_path)` check before `StaticFiles` mount |
| SI-2 | Guard ensures fresh-clone pytest passes without manual dir creation |

## Testing Strategy

- **Unit**: `hash_password`/`verify_password` (round-trip), `create_access_token`/`decode` (expiry, tampered), `require_user` (missing/invalid/expired headers), `ensure_admin_user` (first call seeds, second call no-op).
- **Integration (new tests)**: `POST /api/auth/login` — valid creds → 200 + token, wrong password → 401. All existing /api endpoints → 401 without token. Protected endpoints → 200 with valid token. Rate limit burst → 429 + Retry-After. CORS preflight — allowed origin passes, disallowed rejected. Concurrent bulk price update — totals consistent after concurrent calls.
- **Regression**: All 57 existing tests must pass with auth bypass (test client fixture injects JWT header).

## Test Fixture Changes

`conftest.py` needs: `auth_headers` fixture (returns `{"Authorization": "Bearer <test_token>"}` using `create_access_token({"sub":"admin","role":"admin"})`). All 57 existing tests that call `/api/*` must add `auth_headers` to the `client.get/post` calls. Alternatively, add `auth_headers` as a default parameter in the `client` fixture or override `require_user` dependency in test setup.

## Threat Matrix

N/A — no routing (OS-level), shell commands, subprocesses, VCS/PR automation, executable-file classification, or process-integration boundary. Auth and rate limiting are HTTP middleware at the FastAPI/Starlette layer; no new OS-level routing.

## Migration / Rollout

- Run `alembic upgrade head` to create users table. 
- Set `ADMIN_USER`/`ADMIN_PASSWORD` env vars before deploy.
- Emergency bypass: `SECURITY_DISABLED=true` env var skips auth and rate limiting (to be implemented in `require_user` and limiter setup).
- Rollback: `alembic downgrade` + revert commits.

## Open Questions

- [ ] Test fixture strategy: inject JWT into all 57 existing tests vs. conditional auth bypass in test mode?
- [ ] Alembic `init` — generate `alembic.ini` + `env.py` from scratch (project has no alembic/ dir)?
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/security-hardening/design
Duplicates: 1
Revisions: 1
Created: 2026-08-08 13:37:36
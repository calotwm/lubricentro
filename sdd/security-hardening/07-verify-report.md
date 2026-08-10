#36 [architecture] sdd/security-hardening/verify-report
```yaml
schema: gentle-ai.verify-result/v1
evidence_revision: sha256:5306b9e2f30da792f4ea5400d4bab4f41b266f90e9f11eced368099e69788d50
verdict: pass_with_warnings
blockers: 0
critical_findings: 0
requirements: 18/18
scenarios: 13/13
test_command: "py -m pytest"
test_exit_code: 0
test_output_hash: sha256:5306b9e2f30da792f4ea5400d4bab4f41b266f90e9f11eced368099e69788d50
build_command: "py -m compileall -q app"
build_exit_code: 0
build_output_hash: sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
```

# SDD Verify Report — security-hardening (RE-RUN after remediation b79940b)

## Executive Summary

**Verdict: PASS WITH WARNINGS** — all 3 defects from report #36 (2 CRITICAL + 1 quality) are resolved and re-verified with runtime evidence. 95/95 tests pass; zero CRITICAL findings remain. Requirements 18/18 completed (17 VERIFIED, 1 WARNING). Scenarios 13/13 PASS.

- `py -m pytest` from `backend/`: **95 passed, 0 failed** in 5.46s (exit 0), run twice — consistent.
- Build/compile check: `py -m compileall -q app` exit 0 (empty output).
- RL-2 CRITICAL (report #36) → **VERIFIED**: `@limiter.limit("60/minute")` on all 20 endpoints across 6 routers, all using the ONE shared `Limiter` from `app.security.settings`. LIVE: 60 requests to /api/products → 200, 61st → 429.
- RL-3 CRITICAL (report #36) → **VERIFIED**: custom handler in main.py sets Retry-After explicitly. LIVE: login burst 6th request → 429 with `retry-after: 60`; API burst 61st → 429 with `retry-after: 60`.
- CORS-4 quality defect (report #36) → **VERIFIED**: `test_cors_allowed_origin` now asserts ACAO matches origin AND Access-Control-Allow-Credentials: true; passes.
- WARNING (non-blocking): RL-5 (SHOULD) env vars parsed but not wired into decorator values.

## Blockers

None. All previously CRITICAL findings resolved.

## Findings (18 requirements)

| Req | Status | Evidence |
|-----|--------|----------|
| AUTH-1 Admin bootstrap | VERIFIED | ensure_admin_user in lifespan (main.py:25-27); test_users seeds missing admin with hashed password |
| AUTH-2 Password hashing | VERIFIED | auth.py:13-20 bcrypt hashpw/checkpw; never plaintext |
| AUTH-3 Login endpoint | VERIFIED | routers/auth.py POST /login; test_auth_integration 3/3 (200+JWT, wrong pw 401, unknown user 401); live bad-creds 401 |
| AUTH-4 JWT validation | VERIFIED | Depends(require_user) on all 20 endpoints / 6 routers; require_user enforces Bearer + exp/sub; 401 tests pass on 5 routers |
| AUTH-5 /health public | VERIFIED | main.py:76-80 no auth dep; live GET /health 200 |
| AUTH-6 users migration | VERIFIED | migrations/versions/2d4ff293db8b_add_users_table.py exists (SQLite+PG compatible); unchanged since first pass |
| AUTH-7 Token expiry | VERIFIED | auth.py:28 exp set, :51 require=['exp','sub']; test_auth_unit expiry tests pass |
| RL-1 Auth endpoint limit | VERIFIED | auth.py:17 @limiter.limit("5/minute") on shared limiter; LIVE burst [401,401,401,401,401,429] |
| RL-2 General API limit | VERIFIED | Was CRITICAL in #36. @limiter.limit("60/minute") now on all 20 endpoints of products(5)/categories(2)/brands(2)/prices(2)/reports(3)/quotes(6); all import shared limiter from app.security.settings; LIVE: 60x200 then 61st to 429 |
| RL-3 429 + Retry-After | VERIFIED | Was CRITICAL in #36. Custom handler main.py:44-55 always sets Retry-After; LIVE: 429 headers include retry-after: 60 on both login and API bursts |
| RL-4 /health exempt | VERIFIED | @limiter.exempt (main.py:77); LIVE: 25 rapid calls all 200 |
| RL-5 Per-route config | WARNING | RATE_LIMIT_AUTH/RATE_LIMIT_API parsed (settings.py:20-21) but decorators hardcode "5/minute"/"60/minute" — env changes have no effect. SHOULD not met |
| CORS-1 Origin allowlist | VERIFIED | main.py:60 allow_origins from ALLOWED_ORIGINS env; conftest sets env; parsing test passes |
| CORS-2 No wildcard+creds | VERIFIED | main.py:60-61 explicit list + allow_credentials=True, never "*" |
| CORS-3 Preflight rejection | VERIFIED | test_cors_disallowed_origin asserts no ACAO header; passes |
| CORS-4 Credentials honored | VERIFIED | Was vacuous in #36. test_cors_allowed_origin now asserts ACAO == "http://localhost:5173" AND access-control-allow-credentials == "true" (lines 175-179); passes |
| SI-1 Static mount guard | VERIFIED | main.py:85 isdir guard; app imports clean without manual dir creation |
| SI-2 Fresh-clone pytest | VERIFIED | 95 passed from backend/ (no frontend build needed) |

## Scenario Coverage (13)

| Scenario | Status | Evidence |
|----------|--------|----------|
| Admin bootstrap on fresh DB | PASS | test_users seeds + hashed |
| Login valid credentials | PASS | 200 + JWT (test_auth_integration) |
| Login invalid credentials | PASS | 401 wrong pw + unknown user |
| Protected route without token | PASS | 401 across 5 routers |
| Protected route with expired token | PASS | require_user expired to 401 (unit) |
| /health always accessible | PASS | 200 no auth + live |
| Burst login attempts blocked | PASS | Was FAIL in #36. LIVE: 6th request 429 WITH retry-after: 60 |
| Normal API usage within limits | PASS | Was FAIL in #36. LIVE: 60x200 on /api/products, 61st to 429 |
| /health never rate-limited | PASS | 25x200 + live |
| Allowed origin passes preflight | PASS | Was UNTESTED in #36. test_cors_allowed_origin real assertions pass |
| Disallowed origin rejected | PASS | no ACAO asserted + live |
| Fresh clone no assets | PASS | app.main imports clean; isdir guard |
| Full build with assets | PASS | LIVE: GET / to 200 text/html (index.html served); /api/not-a-route to 404 (bypass); /assets mount active (404 for missing file). File-byte serving not exercised (empty assets dir) |

## Design Deviations

| Deviation | Judgement | Reason |
|-----------|-----------|--------|
| bcrypt direct vs passlib | ACCEPTABLE | passlib 1.7.4 + bcrypt 5.x incompatible on Py3.13; same algorithm |
| SHARED Limiter (replaces per-router) | ACCEPTABLE — REQUIRED FIX | One instance in settings.py; consistent state + Retry-After injection |
| Custom 429 handler (replaces slowapi default) | ACCEPTABLE — REQUIRED FIX | Explicitly sets Retry-After; slowapi default unreliable |
| Sequential race test | ACCEPTABLE | SQLite single-writer; with_for_update present, full proof under PG |
| Fresh Settings instance | ACCEPTABLE | Reliable env monkeypatching |

## Assertion Quality

| File | Line | Issue | Severity |
|------|------|-------|----------|
| tests/test_security_integration.py | 122-128 | Retry-After now asserted (was missing) | FIXED |
| tests/test_security_integration.py | 175-179 | test_cors_allowed_origin now has real assertions (was vacuous) | FIXED |
| tests/test_security_integration.py | 132-147 | test_general_api_rate_limit_imports is structural only (hasattr) — runtime proof supplied by this report's live burst | SUGGESTION |

## Risks / Suggestions (non-blocking)

1. **RL-5 (SHOULD)**: decorators hardcode limit strings; RATE_LIMIT_AUTH/RATE_LIMIT_API env vars parsed but unused. Suggest `@limiter.limit(f"{get_settings().rate_limit_api}/minute")` at import time or a decorator factory.
2. **Test order-dependence**: slowapi in-memory state persists across tests. Running test_rate_limit_login_burst BEFORE test_auth_integration makes login tests fail spuriously (429). Full suite passes because of file order. Suggest resetting limiter storage in a fixture.
3. **Static asset byte-serving** not exercised (frontend/dist/assets empty in this tree); mount verified active + index.html served live.
4. **InsecureKeyLengthWarning** for test HMAC key (23 bytes < 32); acceptable for tests, production must use longer secret.
5. **Rate limit store is in-memory**: single-instance only; multi-worker gunicorn needs Redis storage (documented design choice).

**Next recommended**: archive.
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/security-hardening/verify-report
Duplicates: 1
Revisions: 2
Created: 2026-08-08 15:39:56
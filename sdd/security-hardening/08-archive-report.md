#37 [architecture] sdd/security-hardening/archive-report
# Archive Report: Security Hardening — Lubricentro G&G Backend

## Change Closed

SDD cycle complete for `security-hardening` on `D:\proyectos\lubricentro-latest` (FastAPI backend, `backend/`). Archived 2026-08-08. Verdict: PASS WITH WARNINGS. No CRITICAL findings, no blockers. Zero repo files created by this archive phase (engram artifact store).

## What Shipped

- **JWT authentication**: `users` table (Alembic migration `2d4ff293db8b_add_users_table.py`, SQLite+PG compatible), bcrypt password hashing, `POST /api/auth/login`, `require_user` dependency protecting all 20 endpoints across 6 routers, `exp` claim validation, admin bootstrap from env at lifespan startup. `/health` stays public.
- **CORS allowlist**: `ALLOWED_ORIGINS` env var (comma-separated) drives `allow_origins`; `allow_credentials=True` never coexists with `"*"`; non-allowlisted origins rejected; credentials honored for allowlisted origins.
- **Rate limiting**: slowapi shared `Limiter` (single instance in `app/security/settings.py`); 5/min on `/api/auth/login`, 60/min on all other `/api` endpoints; custom 429 handler always sets `Retry-After`; `/health` exempt.
- **Race fixes**: `with_for_update()` on bulk price-update SELECTs (`services/prices.py`) and `update_product` SELECT (`services/products.py`).
- **Startup-integrity fix**: static `frontend/dist/assets` mount guarded with `os.path.isdir()` (fresh-clone pytest unblocked).

## Commits (on top of base 7a844b4)

| SHA | Message | Content |
|-----|---------|---------|
| `19dddb4` | feat(security): add JWT auth, password hashing, user model, and settings | 11 files, +551 — security foundation |
| `961f5d1` | feat(auth): add login endpoint, protect all API routes, wire CORS and rate limiting | 12 files, +363/-12 |
| `df83c01` | fix(prices): add row-level locking for concurrent price updates | 3 files, +63/-3 |
| `b79940b` | fix(auth): wire general API rate limit and Retry-After header | 11 files, +119/-36 — remediation of verify findings |

Rollback boundary: revert the four commits above (reverse order) restores pre-security state; `alembic downgrade` drops `users`.

## Final Test State

`py -m pytest` from `backend/` → **95 passed, 0 failed** (~5.5s, exit 0). Per verify-report #36 rev 2, run twice — consistent; corroborated by apply-progress #35 (95 passed at apply close) and confirmed directly by the orchestrator twice at archive time. Build check `py -m compileall -q app` exit 0.

## Verify Verdict (final, rev 2 after remediation b79940b)

- **PASS WITH WARNINGS** — 18/18 requirements (17 VERIFIED + RL-5 WARNING), 13/13 scenarios PASS, `critical_findings: 0`, `blockers: 0`.
- All 3 defects from first verify pass resolved and re-verified live: RL-2 CRITICAL (general API limit unwired → 60/min on all 20 endpoints), RL-3 CRITICAL (missing Retry-After → custom handler sets it), CORS-4 quality (vacuous test → real assertions on ACAO + credentials).

## Per-Capability Outcome

| Capability | Requirements | Outcome |
|-----------|--------------|---------|
| api-authentication | AUTH-1..7 (7) | SHIPPED — all 7 VERIFIED: env admin bootstrap, bcrypt hashing, login endpoint, JWT validation on all /api routes, /health public, users migration, exp enforcement |
| api-rate-limiting | RL-1..5 (5) | SHIPPED — RL-1/2/3/4 VERIFIED (live bursts: 6th login → 429 w/ retry-after:60; 61st API → 429 w/ retry-after:60; /health 25 rapid calls all 200). RL-5 WARNING (SHOULD): env vars parsed but decorators hardcode limits |
| cors-policy | CORS-1..4 (4) | SHIPPED — all 4 VERIFIED: allowlist from env, no wildcard+credentials, disallowed origin rejected (no ACAO), credentials honored for allowed origin |
| startup-integrity | SI-1..2 (2) | SHIPPED — both VERIFIED: isdir static guard; fresh-clone pytest passes without manual dir creation |

## Warnings Carried Forward (non-blocking)

1. **RL-5 (SHOULD)**: `RATE_LIMIT_AUTH`/`RATE_LIMIT_API` env vars parsed (settings.py:20-21) but decorators hardcode `"5/minute"`/`"60/minute"` — env changes have no effect. Suggest `@limiter.limit(f"{get_settings().rate_limit_api}/minute")` at import time or a decorator factory.
2. **Test order-dependence**: slowapi in-memory state persists across tests; running the login-burst test before auth integration tests causes spurious 429s. Suggest a limiter-storage reset fixture.
3. **InsecureKeyLengthWarning**: test HMAC key is 23 bytes (< 32); acceptable for tests, production must use a longer secret.
4. **In-memory rate-limit store**: single-instance only; multi-worker gunicorn needs Redis storage (documented design choice).

## Design Deviations (all judged ACCEPTABLE in verify)

bcrypt direct instead of passlib 1.7.4 (incompatible with bcrypt 5.x on Py3.13); ONE shared Limiter (required fix for Retry-After injection); custom 429 handler (slowapi default unreliable); sequential race test (SQLite single-writer; `with_for_update()` present, full proof under PG); fresh `Settings()` per call (reliable env monkeypatching).

## Delivery Notes

- **Size exception approved by user**: 992 changed lines vs 800-line review budget; single-PR delivery chosen (no chaining).
- Repo working tree clean except pre-existing `.atl/skill-registry.md` modification and untracked `.atl/.skill-registry.cache.json` — NOT part of this change.
- Delivery (PR creation) NOT performed by archive — orchestrator handles it.

## Audit Trail

Observations read for this archive (traceability): #31 proposal, #32 spec, #33 design, #34 tasks (all 21 `[x]`, Task Completion Gate passed), #35 apply-progress, #36 verify-report rev 2. Native Review Receipt Gate: `reviewGate` structurally absent — no review receipt exists for this candidate; archived under ordinary repository policy.

## Engram Project Drift

All artifacts for this change live under project `spotify2youtubemusic` because the repo `D:\proyectos\lubricentro-latest` has NO `.engram/config.json` (Engram auto-promoted the parent git child). RECOMMENDATION: add `.engram/config.json` with `{"project": "lubricentro"}` at the repo root so future SDD sessions persist and find lubricentro artifacts under the right project.

**Next recommended**: PR creation / delivery (orchestrator).
Session: manual-save-spotify2youtubemusic
Project: spotify2youtubemusic
Scope: project
Topic: sdd/security-hardening/archive-report
Duplicates: 1
Revisions: 1
Created: 2026-08-08 15:57:50
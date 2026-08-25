# SDD Init Report — Lubricentro G&G

> Generated: 2026-08-25 · Mode: `openspec` (file-based artifacts) · Machine: `acenturionf`

## Stack Summary

| Layer | Technology |
|---|---|
| Backend | Python 3.13 / FastAPI / SQLAlchemy 2.0 async / Alembic (`backend/app/main.py`) |
| Database | PostgreSQL via `DATABASE_URL`, SQLite fallback (`sqlite+aiosqlite:///./lubricentro.db`); 6 tables |
| Frontend | React 19 / Vite / Tailwind CSS v4 (`@tailwindcss/vite`) / TanStack Query v5 / React Router 7 |
| Scripts | Standalone per-brand Excel importers (`scripts/`) + `export_to_postgres.py` |
| Deploy | Dockerfile → Railway (project `lubricentro`, environment production, services web + Postgres) |

Single-user app, no auth on business flows. UI text Spanish; code/comments English.

## Key Commands (Windows, PowerShell)

```powershell
# Backend tests — 100 tests green (run from backend\)
venv\Scripts\python.exe -m pytest

# Excel import suite (run from scripts\)
..\backend\venv\Scripts\python.exe -m pytest test_import_excel.py

# Frontend typecheck + build (run from frontend\)
npx tsc --noEmit
npx vite build

# Backend dev server (run from backend\)
venv\Scripts\uvicorn app.main:app --reload
```

Working directory matters: backend commands run from `backend\`; Excel scripts from `scripts\`.

## Delivery Conventions

- All work targets GitHub repo **calotwm/lubricentro**, branch **main**.
- Deploys via **`railway up`**; CLI verified linked in this working copy (project `lubricentro`, environment `production`).
- The user syncs across multiple machines via git: every SDD change MUST keep its `openspec/changes/{change}/` artifacts updated and committed alongside the code so other machines receive them via `git pull`.
- Legacy SDD cycles live in **`sdd/`** (`frontend-login`, `responsive`, `security-hardening`) — read-only history, do not modify or delete. All NEW changes use the OpenSpec store under **`openspec/`**.

## Strict TDD Assessment

- No agent marker and no prior `openspec/config.yaml` existed at init time.
- A test runner exists (pytest), so the decision-gate default applies: **strict_tdd: true**.
- Corroborated by legacy archives: `sdd/security-hardening/06-apply-progress.md` ran Strict TDD (RED→GREEN→REFACTOR) on backend work.
- Exception: frontend has no JS test runner (`sdd/frontend-login/07-verify-report.md` documented standard mode). Frontend verification evidence = `npx tsc --noEmit` + `npx vite build`.

## Testing Capabilities

See `testing:` block in `openspec/config.yaml` (source of truth).

| Capability | Status | Detail |
|---|---|---|
| Unit | ✅ | pytest (`backend/tests`, asyncio auto) |
| Integration | ✅ | httpx.AsyncClient + in-memory SQLite |
| E2E | ❌ | none |
| Coverage | ❌ | pytest-cov not installed |
| Linter | ❌ | none configured |
| Type checker | ✅ | `npx tsc --noEmit` (frontend only) |
| Formatter | ❌ | none configured |

## Engram Limitation

The Engram MCP server cannot resolve this project from the parent directory (`Default Project` hosts multiple repos side by side → `ambiguous_project` error on write tools). Persistence for this setup is therefore **entirely file-based**: `openspec/` + `.atl/skill-registry.md`. A best-effort single save was attempted; if it failed with `ambiguous_project`, this report plus config.yaml are the canonical record. Pipeline history from the original PC is preserved in `GENTLE_CONTEXT.md` (Engram observation IDs #66–#77 refer to the other machine's Engram store and are NOT readable here).

## Pending Work Noted (not touched by init)

- Uncommitted bug fix: `backend/app/services/excel_import.py` (modified) + `backend/tests/test_excel_import.py` (new) — Excel header-row detection scan. Left as-is; commit owned by orchestrator.

## Artifact Map

| Path | Role |
|---|---|
| `openspec/config.yaml` | Project SDD config incl. testing capabilities + phase rules |
| `openspec/specs/` | Main specs source of truth (empty until first archive merges deltas) |
| `openspec/changes/` | Active changes (one folder per change) |
| `openspec/changes/archive/` | Completed changes (audit trail, `YYYY-MM-DD-{name}/`) |
| `.atl/skill-registry.md` | Skill index for this machine |
| `sdd/` | LEGACY archived cycles — history only |
| `GENTLE_CONTEXT.md` | Exported context from original PC (pipeline history) |

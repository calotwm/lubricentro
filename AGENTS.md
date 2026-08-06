# AGENTS.md — Lubricentro G&G

Web app for a lubricentro (auto lubricant/parts shop): inventory, stock movements, sales, bulk price updates, reports, and Excel import. Single-user, no auth. UI text is Spanish; code/comments are English.

## Architecture

- `backend/` — Python 3.13 / FastAPI / SQLAlchemy 2.0 async. Entrypoint: `app/main.py`.
  - `app/models.py` — 6 tables: categories, brands, products, stock_movements, sales, sale_items
  - `app/services/` — business logic; `app/routers/` — thin HTTP endpoints (all under `/api`)
  - `app/database.py` — `DATABASE_URL` env var (PostgreSQL) with SQLite fallback `sqlite+aiosqlite:///./lubricentro.db`
  - `migrations/` — Alembic (async). `migrations/env.py` also honors `DATABASE_URL`.
  - `backend/lubricentro.db` — the SQLite data file (4,927 products, 26 brands)
- `frontend/` — React 19 / Vite / Tailwind CSS v4 / TanStack Query v5 / React Router 7. Dark theme, red/white/black. Company name: "Lubricentro G&G".
- `scripts/` — standalone Excel importers + `export_to_postgres.py`.

## Commands (Windows)

All Python commands use the project venv: `backend\venv\Scripts\python.exe`.

```powershell
# Backend dev server — MUST run from backend/ (app package lives there)
cd C:\Users\cseifar\lubricentro\backend
venv\Scripts\uvicorn app.main:app --reload

# Backend tests
cd backend
venv\Scripts\python -m pytest                                  # 59 tests, in-memory SQLite
# Excel import tests (separate suite)
cd scripts
..\backend\venv\Scripts\python -m pytest test_import_excel.py # 16 tests

# Frontend dev / typecheck / build
cd frontend
npx vite                                                      # dev server (proxy /api -> :8000)
npx tsc --noEmit                                              # typecheck
npx vite build                                                # production build -> dist/
```

## Gotchas

- **Working directory matters.** The backend must start from `backend/` (`app` package resolves there). Excel import scripts must run from `scripts/` — they default to `sqlite:///../backend/lubricentro.db`.
- **Excel import is per-brand, not generic.** `scripts/import_excel.py` expects sheets named `categorias`/`marcas`/`productos` and finds nothing in the real file. The real file (`LISTA DE PRECIO JULIO 2026.xlsx`) has one sheet per brand with different column layouts — use `scripts/import_xlsx_all.py` (per-brand format map) or `scripts/import_valvoline_csv.py` for the VALVOLINE CSV.
- **Tailwind v4** uses the `@tailwindcss/vite` plugin — no `postcss.config.js` or `tailwind.config.js`; theme is CSS `@theme` in `frontend/src/index.css`.
- **Frontend static serving:** when a build exists, `backend/app/main.py` serves `frontend/dist` automatically (path resolved relative to `main.py`). You do NOT need a separate frontend server in production.
- **Windows console encoding:** don't print emoji/unicode symbols from Python scripts on Windows (cp1252 raises UnicodeEncodeError). ASCII only in script output.
- **`datetime.utcnow()` is deprecated** in `backend/app/services/reports.py` (Python 3.13 warns). Use timezone-aware `datetime.now(datetime.UTC)`.
- **Excel price upload endpoint** (`POST /api/prices/upload-excel`) requires `python-multipart` — already in `backend/requirements.txt`.
- **Two `requirements.txt`:** `backend/requirements.txt` is the real one; a copy sits at repo root for some deploy paths. Keep them in sync.
- **`render.yaml`, `netlify.toml`, `.replit`, `Dockerfile`** all exist at root from deploy attempts. The working container path is `Dockerfile` (CMD runs `uvicorn` on port 8000). Others may be stale.

## Conventions

- Conventional commits, no AI attribution.
- English for code/identifiers/comments; Spanish only for user-facing UI copy.
- Full SDD cycle already archived — see `GENTLE_CONTEXT.md` for pipeline state and Engram observation IDs.

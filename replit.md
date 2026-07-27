# Lubricentro G&G

Shop management system for Lubricentro G&G — tracks inventory, sales, pricing, and stock movements.

## Stack

- **Backend**: FastAPI + SQLAlchemy (async) + Alembic migrations
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Database**: PostgreSQL (via `DATABASE_URL` env var) or SQLite (local fallback)

## Running on Replit

Two workflows run concurrently:

| Workflow | Command | Port |
|---|---|---|
| **Backend API** | `cd backend && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload` | 8000 (console) |
| **Start application** | `cd frontend && npm run dev` | 5000 (webview) |

The Vite dev server proxies `/api/*` requests to the backend on port 8000.

## Database

- If `DATABASE_URL` is set (PostgreSQL), the backend connects to it automatically.
  - `sslmode` URL params are handled transparently (stripped from URL and converted to asyncpg `ssl` connect arg).
- Without `DATABASE_URL`, falls back to `lubricentro.db` (SQLite) in the backend directory.

## Project structure

```
backend/
  app/
    main.py        # FastAPI app, router registration, static file serving
    database.py    # Async SQLAlchemy engine + session
    models.py      # SQLAlchemy ORM models
    schemas.py     # Pydantic schemas
    routers/       # API route handlers (products, categories, brands, stock, sales, prices, reports)
    services/      # Business logic
  migrations/      # Alembic migration scripts
frontend/
  src/             # React components and pages
scripts/           # Data import utilities (Excel/CSV → database)
```

## User preferences

- Keep existing project structure and stack.

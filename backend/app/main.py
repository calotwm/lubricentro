import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi.errors import RateLimitExceeded
from starlette.responses import FileResponse

from app.database import async_session, init_db
from app.routers import auth, brands, categories, prices, products, quotes, reports
from app.security.settings import get_settings, limiter
from app.security.users import ensure_admin_user

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create database tables and seed admin user."""
    await init_db()
    async with async_session() as db:
        await ensure_admin_user(db)
        await db.commit()
    yield


app = FastAPI(
    title="Lubricentro G&G",
    description="Sistema de gestion para Lubricentro G&G",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter — shared instance from settings for consistent state + Retry-After
settings = get_settings()
app.state.limiter = limiter


# Custom exception handler to ensure Retry-After header is always present (RL-3)
@app.exception_handler(RateLimitExceeded)
async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Handle rate limit exceeded with Retry-After header."""
    # Calculate retry-after from the exception
    retry_after = int(exc.retry_after) if hasattr(exc, 'retry_after') and exc.retry_after else 60
    
    response = JSONResponse(
        {"error": f"Rate limit exceeded: {exc.detail}"},
        status_code=429,
    )
    response.headers["Retry-After"] = str(retry_after)
    return response

# CORS — env-configurable allowlist
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(auth.router, prefix="/api")
app.include_router(products.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(brands.router, prefix="/api")
app.include_router(prices.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")


@app.get("/health")
@limiter.exempt
async def health_check(request: Request):
    """Simple health check endpoint — exempt from auth and rate limiting."""
    return {"status": "ok"}


# Serve built frontend as static files (produccion)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists() and (FRONTEND_DIST / "assets").is_dir():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Catch-all: serve index.html for SPA routing."""
        if full_path.startswith("api/") or full_path == "health":
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        index_path = FRONTEND_DIST / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return JSONResponse(status_code=404, content={"detail": "Not found"})

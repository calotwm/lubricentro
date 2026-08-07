from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from app.database import init_db
from app.routers import brands, categories, prices, products, quotes, reports


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create database tables."""
    await init_db()
    yield


app = FastAPI(
    title="Lubricentro G&G",
    description="Sistema de gestion para Lubricentro G&G",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API routers
app.include_router(products.router, prefix="/api")
app.include_router(categories.router, prefix="/api")
app.include_router(brands.router, prefix="/api")
app.include_router(prices.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(quotes.router, prefix="/api")


@app.get("/health")
async def health_check():
    """Simple health check endpoint."""
    return {"status": "ok"}


# Serve built frontend as static files (produccion)
FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        """Catch-all: serve index.html for SPA routing."""
        if full_path.startswith("api/") or full_path == "health":
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        index_path = FRONTEND_DIST / "index.html"
        if index_path.exists():
            return FileResponse(str(index_path))
        return JSONResponse(status_code=404, content={"detail": "Not found"})

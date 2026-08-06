import os
from urllib.parse import urlparse, urlencode, parse_qs, urlunparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.models import Base

# Use DATABASE_URL env var (Railway Postgres) or fall back to local SQLite
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite+aiosqlite:///./lubricentro.db")

connect_args = {}

# Convert standard postgresql:// URL to asyncpg format if needed
if DATABASE_URL.startswith("postgresql://") or DATABASE_URL.startswith("postgresql+asyncpg://"):
    if not DATABASE_URL.startswith("postgresql+asyncpg://"):
        DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://", 1)

    # asyncpg doesn't accept sslmode as a URL query param — strip it and map to connect_args
    parsed = urlparse(DATABASE_URL)
    qs = parse_qs(parsed.query)
    sslmode = qs.pop("sslmode", [None])[0]
    if sslmode == "require":
        connect_args["ssl"] = True
    elif sslmode in ("disable", "allow", "prefer"):
        connect_args["ssl"] = False
    new_query = urlencode({k: v[0] for k, v in qs.items()})
    DATABASE_URL = urlunparse(parsed._replace(query=new_query))

engine = create_async_engine(DATABASE_URL, echo=False, connect_args=connect_args)

async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields an async database session."""
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


async def init_db() -> None:
    """Create all tables (used as fallback; prefer Alembic migrations)."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

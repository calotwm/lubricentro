"""Admin user seeding from environment variables."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.security.auth import hash_password
from app.security.settings import get_settings

logger = logging.getLogger(__name__)


async def ensure_admin_user(db: AsyncSession) -> None:
    """Seed admin user from ADMIN_USER/ADMIN_PASSWORD env vars if missing.

    If env vars are not set, log a warning and skip (dev-friendly).
    If user already exists, no-op.
    """
    settings = get_settings()

    if not settings.admin_user or not settings.admin_password:
        logger.warning(
            "ADMIN_USER/ADMIN_PASSWORD not set — skipping admin user seeding. "
            "Set these env vars in production."
        )
        return

    result = await db.execute(
        select(User).where(User.username == settings.admin_user)
    )
    existing = result.scalars().first()

    if existing:
        logger.info("Admin user '%s' already exists — skipping seed.", settings.admin_user)
        return

    admin = User(
        username=settings.admin_user,
        hashed_password=hash_password(settings.admin_password),
        role="admin",
    )
    db.add(admin)
    await db.flush()
    logger.info("Admin user '%s' created.", settings.admin_user)

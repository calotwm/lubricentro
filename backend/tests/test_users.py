"""Tests for security.users — ensure_admin_user seeding."""

import pytest
import pytest_asyncio


@pytest.mark.asyncio
async def test_ensure_admin_user_seeds_when_missing(db_session, monkeypatch):
    """ensure_admin_user creates admin user when env vars are set and user doesn't exist."""
    from app.security.users import ensure_admin_user
    from app.models import User
    from sqlalchemy import select

    monkeypatch.setenv("ADMIN_USER", "testadmin")
    monkeypatch.setenv("ADMIN_PASSWORD", "testpassword123")

    await ensure_admin_user(db_session)

    result = await db_session.execute(select(User).where(User.username == "testadmin"))
    user = result.scalars().first()
    assert user is not None
    assert user.role == "admin"
    # Password must be hashed, not plaintext
    assert user.hashed_password != "testpassword123"
    assert len(user.hashed_password) > 20  # bcrypt hash is long


@pytest.mark.asyncio
async def test_ensure_admin_user_noop_when_exists(db_session, monkeypatch):
    """ensure_admin_user is a no-op when admin user already exists."""
    from app.security.users import ensure_admin_user
    from app.models import User
    from app.security.auth import hash_password
    from sqlalchemy import select

    monkeypatch.setenv("ADMIN_USER", "existingadmin")
    monkeypatch.setenv("ADMIN_PASSWORD", "newpassword")

    # Pre-create user
    existing = User(username="existingadmin", hashed_password=hash_password("originalpassword"), role="admin")
    db_session.add(existing)
    await db_session.flush()

    await ensure_admin_user(db_session)

    result = await db_session.execute(select(User).where(User.username == "existingadmin"))
    user = result.scalars().first()
    assert user is not None
    # Password should NOT have been changed
    assert user.hashed_password != hash_password("newpassword")


@pytest.mark.asyncio
async def test_ensure_admin_user_skips_when_env_unset(db_session, monkeypatch):
    """ensure_admin_user skips seeding when env vars are not set."""
    from app.security.users import ensure_admin_user
    from app.models import User
    from sqlalchemy import select, func

    monkeypatch.delenv("ADMIN_USER", raising=False)
    monkeypatch.delenv("ADMIN_PASSWORD", raising=False)

    await ensure_admin_user(db_session)

    result = await db_session.execute(select(func.count()).select_from(User))
    count = result.scalar()
    assert count == 0

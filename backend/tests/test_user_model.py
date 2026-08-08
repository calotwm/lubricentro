"""Tests for User model."""

import pytest
from sqlalchemy import select


@pytest.mark.asyncio
async def test_user_model_creation(db_session):
    """User model can be created with required fields."""
    from app.models import User

    user = User(username="testadmin", hashed_password="hashed_pw", role="admin")
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)

    assert user.id is not None
    assert user.username == "testadmin"
    assert user.hashed_password == "hashed_pw"
    assert user.role == "admin"
    assert user.created_at is not None


@pytest.mark.asyncio
async def test_user_username_unique(db_session):
    """Username must be unique."""
    from app.models import User
    from sqlalchemy.exc import IntegrityError

    db_session.add(User(username="unique_admin", hashed_password="h", role="admin"))
    await db_session.flush()

    db_session.add(User(username="unique_admin", hashed_password="h2", role="user"))
    with pytest.raises(IntegrityError):
        await db_session.flush()
    await db_session.rollback()

"""Integration tests for POST /api/auth/login."""

import pytest
import pytest_asyncio


@pytest.mark.asyncio
async def test_login_valid_credentials(client, db_session, monkeypatch):
    """POST /api/auth/login with correct creds returns 200 + JWT."""
    from app.security.auth import hash_password
    from app.models import User

    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    user = User(username="admin", hashed_password=hash_password("adminpass"), role="admin")
    db_session.add(user)
    await db_session.flush()

    response = await client.post("/api/auth/login", json={"username": "admin", "password": "adminpass"})
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_login_invalid_password(client, db_session, monkeypatch):
    """POST /api/auth/login with wrong password returns 401."""
    from app.security.auth import hash_password
    from app.models import User

    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    user = User(username="admin", hashed_password=hash_password("correctpass"), role="admin")
    db_session.add(user)
    await db_session.flush()

    response = await client.post("/api/auth/login", json={"username": "admin", "password": "wrongpass"})
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client, db_session, monkeypatch):
    """POST /api/auth/login with unknown username returns 401."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    response = await client.post("/api/auth/login", json={"username": "nobody", "password": "pass"})
    assert response.status_code == 401

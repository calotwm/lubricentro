"""Tests for security.auth — password hashing, JWT, require_user dependency."""

import time
import pytest
import pytest_asyncio
from unittest.mock import MagicMock
from fastapi import HTTPException, Request
from httpx import ASGITransport, AsyncClient, Request as HTTPXRequest

# ---------------------------------------------------------------------------
# Password hashing tests
# ---------------------------------------------------------------------------


def test_hash_password_returns_string():
    """hash_password returns a non-empty string (bcrypt hash)."""
    from app.security.auth import hash_password

    result = hash_password("mysecretpassword")
    assert isinstance(result, str)
    assert len(result) > 0
    assert result != "mysecretpassword"


def test_verify_password_correct():
    """verify_password returns True for correct password."""
    from app.security.auth import hash_password, verify_password

    hashed = hash_password("correct_password")
    assert verify_password("correct_password", hashed) is True


def test_verify_password_incorrect():
    """verify_password returns False for wrong password."""
    from app.security.auth import hash_password, verify_password

    hashed = hash_password("correct_password")
    assert verify_password("wrong_password", hashed) is False


def test_hash_password_different_each_time():
    """Each hash of the same password produces a different hash (salt)."""
    from app.security.auth import hash_password

    h1 = hash_password("same_password")
    h2 = hash_password("same_password")
    assert h1 != h2  # bcrypt uses random salt


# ---------------------------------------------------------------------------
# JWT token tests
# ---------------------------------------------------------------------------


def test_create_access_token_returns_string(monkeypatch):
    """create_access_token returns a JWT string."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    token = auth_mod.create_access_token({"sub": "admin", "role": "admin"})
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_contains_claims(monkeypatch):
    """JWT contains sub, role, and exp claims."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import jwt
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    token = auth_mod.create_access_token({"sub": "admin", "role": "admin"})
    payload = jwt.decode(token, "test-secret-key-for-jwt", algorithms=["HS256"])
    assert payload["sub"] == "admin"
    assert payload["role"] == "admin"
    assert "exp" in payload


def test_create_access_token_expiry(monkeypatch):
    """JWT exp claim is in the future."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    monkeypatch.setenv("JWT_EXPIRATION_MINUTES", "30")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import jwt
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    token = auth_mod.create_access_token({"sub": "admin", "role": "admin"})
    payload = jwt.decode(token, "test-secret-key-for-jwt", algorithms=["HS256"])
    assert payload["exp"] > time.time()


# ---------------------------------------------------------------------------
# require_user dependency tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_require_user_missing_header(monkeypatch):
    """require_user raises 401 when no Authorization header."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    scope = {
        "type": "http",
        "method": "GET",
        "headers": [],
    }
    request = Request(scope)
    with pytest.raises(HTTPException) as exc_info:
        await auth_mod.require_user(request)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_require_user_invalid_token(monkeypatch):
    """require_user raises 401 for invalid/malformed token."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    scope = {
        "type": "http",
        "method": "GET",
        "headers": [(b"authorization", b"Bearer invalid.token.here")],
    }
    request = Request(scope)
    with pytest.raises(HTTPException) as exc_info:
        await auth_mod.require_user(request)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_require_user_expired_token(monkeypatch):
    """require_user raises 401 for expired token."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import jwt
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    # Create an already-expired token
    token = jwt.encode(
        {"sub": "admin", "role": "admin", "exp": int(time.time()) - 3600},
        "test-secret-key-for-jwt",
        algorithm="HS256",
    )
    scope = {
        "type": "http",
        "method": "GET",
        "headers": [(b"authorization", f"Bearer {token}".encode())],
    }
    request = Request(scope)
    with pytest.raises(HTTPException) as exc_info:
        await auth_mod.require_user(request)
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_require_user_valid_token(monkeypatch):
    """require_user returns user dict for valid token."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-key-for-jwt")
    import app.security.settings as settings_mod
    import app.security.auth as auth_mod
    import importlib
    importlib.reload(settings_mod)
    importlib.reload(auth_mod)

    token = auth_mod.create_access_token({"sub": "admin", "role": "admin"})
    scope = {
        "type": "http",
        "method": "GET",
        "headers": [(b"authorization", f"Bearer {token}".encode())],
    }
    request = Request(scope)
    user = await auth_mod.require_user(request)
    assert user["sub"] == "admin"
    assert user["role"] == "admin"

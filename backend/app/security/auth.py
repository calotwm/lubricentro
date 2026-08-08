"""Authentication utilities: password hashing, JWT tokens, require_user dependency."""

import time
from typing import Dict

import bcrypt
import jwt
from fastapi import HTTPException, Request

from app.security.settings import get_settings


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    """Verify a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(data: Dict) -> str:
    """Create a JWT access token with exp claim."""
    settings = get_settings()
    to_encode = data.copy()
    expire = time.time() + (settings.jwt_expiration_minutes * 60)
    to_encode["exp"] = int(expire)
    return jwt.encode(to_encode, settings.jwt_secret_key, algorithm="HS256")


async def require_user(request: Request) -> Dict:
    """FastAPI dependency: extract and validate JWT from Authorization header.

    Returns the decoded token payload as a dict with sub, role, exp.
    Raises HTTPException(401) on missing/invalid/expired tokens.
    """
    settings = get_settings()
    auth_header = request.headers.get("authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header[7:]  # Strip "Bearer "

    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=["HS256"],
            options={"require": ["exp", "sub"]},
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except (jwt.InvalidTokenError, jwt.DecodeError):
        raise HTTPException(status_code=401, detail="Invalid token")

    return payload

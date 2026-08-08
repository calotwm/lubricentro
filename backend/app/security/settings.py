"""Environment-driven security settings."""

import os
from typing import List


class Settings:
    """Security configuration loaded from environment variables."""

    def __init__(self):
        self.jwt_secret_key: str = os.environ.get("JWT_SECRET_KEY", "")
        self.jwt_expiration_minutes: int = int(
            os.environ.get("JWT_EXPIRATION_MINUTES", "60")
        )
        self.admin_user: str = os.environ.get("ADMIN_USER", "")
        self.admin_password: str = os.environ.get("ADMIN_PASSWORD", "")
        self.rate_limit_auth: int = int(os.environ.get("RATE_LIMIT_AUTH", "5"))
        self.rate_limit_api: int = int(os.environ.get("RATE_LIMIT_API", "60"))

        origins_raw = os.environ.get("ALLOWED_ORIGINS", "")
        self.allowed_origins: List[str] = (
            [o.strip() for o in origins_raw.split(",") if o.strip()]
            if origins_raw
            else []
        )


def get_settings() -> Settings:
    """Return a fresh Settings instance (reads env vars each call)."""
    return Settings()

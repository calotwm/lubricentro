"""Tests for security settings — env-driven configuration."""

import os
import importlib

import pytest


def test_settings_reads_jwt_secret_from_env(monkeypatch):
    """JWT_SECRET_KEY must be read from environment."""
    monkeypatch.setenv("JWT_SECRET_KEY", "test-secret-123")
    # Force reimport
    import app.security.settings as mod
    importlib.reload(mod)
    assert mod.Settings().jwt_secret_key == "test-secret-123"


def test_settings_jwt_expiration_default(monkeypatch):
    """JWT_EXPIRATION_MINUTES defaults to 60."""
    monkeypatch.setenv("JWT_SECRET_KEY", "s")
    monkeypatch.delenv("JWT_EXPIRATION_MINUTES", raising=False)
    import app.security.settings as mod
    importlib.reload(mod)
    assert mod.Settings().jwt_expiration_minutes == 60


def test_settings_rate_limits_defaults(monkeypatch):
    """Rate limit defaults: auth=5, api=60."""
    monkeypatch.setenv("JWT_SECRET_KEY", "s")
    monkeypatch.delenv("RATE_LIMIT_AUTH", raising=False)
    monkeypatch.delenv("RATE_LIMIT_API", raising=False)
    import app.security.settings as mod
    importlib.reload(mod)
    s = mod.Settings()
    assert s.rate_limit_auth == 5
    assert s.rate_limit_api == 60


def test_settings_allowed_origins_parsed(monkeypatch):
    """ALLOWED_ORIGINS is parsed from comma-separated string."""
    monkeypatch.setenv("JWT_SECRET_KEY", "s")
    monkeypatch.setenv("ALLOWED_ORIGINS", "http://localhost:5173,http://example.com")
    import app.security.settings as mod
    importlib.reload(mod)
    s = mod.Settings()
    assert s.allowed_origins == ["http://localhost:5173", "http://example.com"]


def test_settings_allowed_origins_default_empty(monkeypatch):
    """ALLOWED_ORIGINS defaults to empty list when not set."""
    monkeypatch.setenv("JWT_SECRET_KEY", "s")
    monkeypatch.delenv("ALLOWED_ORIGINS", raising=False)
    import app.security.settings as mod
    importlib.reload(mod)
    s = mod.Settings()
    assert s.allowed_origins == []


def test_settings_admin_user_password(monkeypatch):
    """ADMIN_USER and ADMIN_PASSWORD read from env."""
    monkeypatch.setenv("JWT_SECRET_KEY", "s")
    monkeypatch.setenv("ADMIN_USER", "admin")
    monkeypatch.setenv("ADMIN_PASSWORD", "secret123")
    import app.security.settings as mod
    importlib.reload(mod)
    s = mod.Settings()
    assert s.admin_user == "admin"
    assert s.admin_password == "secret123"

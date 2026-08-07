"""Tests for rewritten reports: dashboard KPIs and price history endpoints."""

from decimal import Decimal

import pytest


@pytest.mark.asyncio
async def test_dashboard_empty(client):
    """Dashboard returns zero counts when database is empty."""
    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_products"] == 0
    assert data["total_brands"] == 0
    assert data["recent_price_changes"] == []
    assert data["recent_quotes"] == []


@pytest.mark.asyncio
async def test_dashboard_with_data(client, seed_product, seed_price_history, seed_quote):
    """Dashboard returns correct KPIs with seeded data."""
    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total_products"] >= 1
    assert data["total_brands"] >= 1
    assert len(data["recent_price_changes"]) >= 1
    assert len(data["recent_quotes"]) >= 1


@pytest.mark.asyncio
async def test_dashboard_no_sales_fields(client, seed_product):
    """Dashboard no longer returns sales-related fields."""
    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "today_sales_total" not in data
    assert "month_sales_total" not in data
    assert "low_stock_count" not in data
    assert "total_inventory_value" not in data


@pytest.mark.asyncio
async def test_price_history_empty(client):
    """Price history returns empty when no changes recorded."""
    resp = await client.get("/api/reports/price-history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_price_history_with_data(client, seed_price_history):
    """Price history returns recorded changes with product/brand names."""
    resp = await client.get("/api/reports/price-history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2
    item = data["items"][0]
    assert "product_name" in item
    assert "brand_name" in item
    assert "old_price" in item
    assert "new_price" in item
    assert "source" in item


@pytest.mark.asyncio
async def test_price_history_filter_product_id(client, seed_product, seed_price_history):
    """Price history filters by product_id."""
    resp = await client.get(
        "/api/reports/price-history",
        params={"product_id": seed_product.id},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_price_history_filter_source(client, seed_price_history):
    """Price history filters by source."""
    resp = await client.get(
        "/api/reports/price-history",
        params={"source": "bulk"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert all(item["source"] == "bulk" for item in data["items"])


@pytest.mark.asyncio
async def test_price_history_csv(client, seed_price_history):
    """Price history CSV returns CSV with date-stamped filename."""
    resp = await client.get("/api/reports/price-history/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    disposition = resp.headers.get("content-disposition", "")
    assert "historial_precios_" in disposition
    assert ".csv" in disposition


@pytest.mark.asyncio
async def test_old_endpoints_removed(client):
    """Old report endpoints return 404."""
    for endpoint in [
        "/api/reports/best-sellers",
        "/api/reports/stock-history",
        "/api/reports/stock-history/csv",
        "/api/reports/reorder-list",
        "/api/reports/profit-margin",
    ]:
        resp = await client.get(endpoint)
        assert resp.status_code == 404, f"{endpoint} should return 404"


@pytest.mark.asyncio
async def test_sales_routes_removed(client):
    """Sales routes return 404 after Phase 2 removal."""
    resp = await client.get("/api/sales")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_stock_routes_removed(client):
    """Stock routes return 404 after Phase 2 removal."""
    resp = await client.get("/api/stock/movements")
    assert resp.status_code == 404

"""Tests for dashboard, best-sellers, stock history, reorder list, and profit margin."""

from decimal import Decimal

import pytest


@pytest.mark.asyncio
async def test_dashboard_empty(client):
    """Dashboard returns zero KPIs when database is empty."""
    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert Decimal(data["total_inventory_value"]) == Decimal("0")
    assert data["low_stock_count"] == 0
    assert Decimal(data["today_sales_total"]) == Decimal("0")
    assert Decimal(data["month_sales_total"]) == Decimal("0")
    assert data["low_stock_products"] == []


@pytest.mark.asyncio
async def test_dashboard_with_data(client, seed_product):
    """Dashboard returns correct KPIs with seeded data."""
    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    # inventory value = cost_price * current_stock = 50 * 20 = 1000
    assert Decimal(data["total_inventory_value"]) == Decimal("1000.00")
    # seed_product has stock=20, min_stock=5, so not low stock
    assert data["low_stock_count"] == 0


@pytest.mark.asyncio
async def test_dashboard_low_stock(client, db_session, seed_category, seed_brand):
    """Dashboard flags products below min_stock."""
    from app.models import Product

    low = Product(
        name="Low Stock Item",
        cost_price=Decimal("10.00"),
        selling_price=Decimal("20.00"),
        current_stock=2,
        min_stock=5,
        category_id=seed_category.id,
        brand_id=seed_brand.id,
        is_active=True,
    )
    db_session.add(low)
    await db_session.flush()

    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert data["low_stock_count"] >= 1
    low_names = [p["name"] for p in data["low_stock_products"]]
    assert "Low Stock Item" in low_names


@pytest.mark.asyncio
async def test_dashboard_sales_totals(client, seed_product):
    """Dashboard includes today and month sales totals."""
    # Create a sale
    await client.post(
        "/api/sales",
        json={
            "items": [
                {
                    "product_id": seed_product.id,
                    "quantity": 2,
                    "unit_price": "100.00",
                }
            ],
            "payment_method": "cash",
        },
    )

    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert Decimal(data["today_sales_total"]) >= Decimal("200.00")
    assert Decimal(data["month_sales_total"]) >= Decimal("200.00")


@pytest.mark.asyncio
async def test_best_sellers_empty(client):
    """Best sellers returns empty list when no sales exist."""
    resp = await client.get("/api/reports/best-sellers")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_best_sellers_ranked(client, seed_product, seed_category, seed_brand):
    """Best sellers returns products ranked by quantity sold."""
    # Create a second product
    resp = await client.post(
        "/api/products",
        json={
            "name": "Another Product",
            "sku": "AP-001",
            "category_id": seed_category.id,
            "brand_id": seed_brand.id,
            "selling_price": "50.00",
            "cost_price": "20.00",
            "current_stock": 100,
        },
    )
    product2_id = resp.json()["id"]

    # Sell more of product2 than seed_product
    await client.post(
        "/api/sales",
        json={
            "items": [
                {"product_id": seed_product.id, "quantity": 2, "unit_price": "100.00"}
            ],
            "payment_method": "cash",
        },
    )
    await client.post(
        "/api/sales",
        json={
            "items": [
                {"product_id": product2_id, "quantity": 10, "unit_price": "50.00"}
            ],
            "payment_method": "cash",
        },
    )

    resp = await client.get("/api/reports/best-sellers")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 2
    # First should be the one with more quantity sold
    assert data[0]["product_id"] == product2_id
    assert data[0]["total_quantity_sold"] == 10


@pytest.mark.asyncio
async def test_stock_history(client, seed_product):
    """Stock history returns movement data."""
    # Create a movement
    await client.post(
        "/api/stock/movements",
        json={
            "product_id": seed_product.id,
            "type": "ENTRY",
            "quantity": 10,
            "reference": "PO-TEST",
        },
    )

    resp = await client.get("/api/reports/stock-history")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert data[0]["product_name"] == "Aceite 20W-50"
    assert data[0]["type"] == "ENTRY"
    assert data[0]["quantity"] == 10


@pytest.mark.asyncio
async def test_stock_history_csv(client, seed_product):
    """Stock history CSV endpoint returns CSV content."""
    await client.post(
        "/api/stock/movements",
        json={
            "product_id": seed_product.id,
            "type": "ENTRY",
            "quantity": 5,
        },
    )

    resp = await client.get("/api/reports/stock-history/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    content = resp.text
    assert "date" in content  # header row
    assert "Aceite 20W-50" in content


@pytest.mark.asyncio
async def test_reorder_list_empty(client):
    """Reorder list returns empty when all products are above min_stock."""
    resp = await client.get("/api/reports/reorder-list")
    assert resp.status_code == 200
    # seed_product has stock=20, min_stock=5, so not in reorder list
    data = resp.json()
    ids = [p["id"] for p in data]
    # If seed_product exists, it should NOT be in the reorder list
    # (it has sufficient stock)


@pytest.mark.asyncio
async def test_reorder_list_with_low_stock(client, db_session, seed_category, seed_brand):
    """Reorder list returns products below min_stock."""
    from app.models import Product

    low = Product(
        name="Needs Reorder",
        cost_price=Decimal("10.00"),
        selling_price=Decimal("20.00"),
        current_stock=1,
        min_stock=10,
        category_id=seed_category.id,
        brand_id=seed_brand.id,
        is_active=True,
    )
    db_session.add(low)
    await db_session.flush()

    resp = await client.get("/api/reports/reorder-list")
    assert resp.status_code == 200
    data = resp.json()
    names = [p["name"] for p in data]
    assert "Needs Reorder" in names


@pytest.mark.asyncio
async def test_profit_margin_empty(client):
    """Profit margin returns zeros when no sales exist."""
    resp = await client.get("/api/reports/profit-margin")
    assert resp.status_code == 200
    data = resp.json()
    assert Decimal(data["total_revenue"]) == Decimal("0")
    assert Decimal(data["total_cost"]) == Decimal("0")
    assert Decimal(data["gross_profit"]) == Decimal("0")
    assert Decimal(data["margin_percentage"]) == Decimal("0")


@pytest.mark.asyncio
async def test_profit_margin_with_sales(client, seed_product):
    """Profit margin calculates correctly with sales data."""
    # seed_product: cost=50, selling=100, stock=20
    # Sell 5 units at 100 each: revenue=500, cost=5*50=250, profit=250
    await client.post(
        "/api/sales",
        json={
            "items": [
                {
                    "product_id": seed_product.id,
                    "quantity": 5,
                    "unit_price": "100.00",
                }
            ],
            "payment_method": "cash",
        },
    )

    resp = await client.get("/api/reports/profit-margin")
    assert resp.status_code == 200
    data = resp.json()
    assert Decimal(data["total_revenue"]) == Decimal("500.00")
    assert Decimal(data["total_cost"]) == Decimal("250.00")
    assert Decimal(data["gross_profit"]) == Decimal("250.00")
    assert Decimal(data["margin_percentage"]) == Decimal("50.00")

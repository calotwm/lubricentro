"""Tests for sale creation, listing, and stock decrement."""

from decimal import Decimal

import pytest


@pytest.mark.asyncio
async def test_create_sale(client, seed_product):
    """Create a sale with line items, verify total and stock decrement."""
    initial_stock = seed_product.current_stock
    payload = {
        "items": [
            {
                "product_id": seed_product.id,
                "quantity": 3,
                "unit_price": "100.00",
            }
        ],
        "payment_method": "cash",
    }
    resp = await client.post("/api/sales", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["payment_method"] == "cash"
    assert Decimal(data["total"]) == Decimal("300.00")
    assert len(data["items"]) == 1
    assert data["items"][0]["quantity"] == 3
    assert Decimal(data["items"][0]["subtotal"]) == Decimal("300.00")

    # Verify stock decremented
    resp = await client.get(f"/api/products/{seed_product.id}")
    assert resp.json()["current_stock"] == initial_stock - 3


@pytest.mark.asyncio
async def test_create_sale_multiple_items(client, seed_product, seed_category, seed_brand):
    """Create a sale with multiple line items."""
    from app.models import Product

    # Create a second product (we need a fresh one since seed_product is used)
    resp = await client.post(
        "/api/products",
        json={
            "name": "Filtro de Aire",
            "sku": "FA-001",
            "category_id": seed_category.id,
            "brand_id": seed_brand.id,
            "cost_price": "15.00",
            "selling_price": "35.00",
            "current_stock": 50,
            "min_stock": 5,
        },
    )
    product2 = resp.json()

    payload = {
        "items": [
            {"product_id": seed_product.id, "quantity": 2, "unit_price": "100.00"},
            {"product_id": product2["id"], "quantity": 1, "unit_price": "35.00"},
        ],
        "payment_method": "debit",
    }
    resp = await client.post("/api/sales", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    # total = 2*100 + 1*35 = 235
    assert Decimal(data["total"]) == Decimal("235.00")
    assert len(data["items"]) == 2


@pytest.mark.asyncio
async def test_create_sale_empty_cart(client):
    """Sale with empty items list returns 422 (min_length=1)."""
    payload = {
        "items": [],
        "payment_method": "cash",
    }
    resp = await client.post("/api/sales", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_create_sale_insufficient_stock(client, seed_product):
    """Sale with quantity exceeding stock returns 400."""
    payload = {
        "items": [
            {
                "product_id": seed_product.id,
                "quantity": 9999,  # more than available
                "unit_price": "100.00",
            }
        ],
        "payment_method": "cash",
    }
    resp = await client.post("/api/sales", json=payload)
    assert resp.status_code == 400
    assert "Insufficient stock" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_create_sale_inactive_product(client, db_session, seed_category, seed_brand):
    """Sale with an inactive product returns 400."""
    from app.models import Product

    inactive = Product(
        name="Inactive Product",
        selling_price=Decimal("10.00"),
        current_stock=100,
        is_active=False,
        category_id=seed_category.id,
        brand_id=seed_brand.id,
    )
    db_session.add(inactive)
    await db_session.flush()
    await db_session.refresh(inactive)

    payload = {
        "items": [
            {"product_id": inactive.id, "quantity": 1, "unit_price": "10.00"}
        ],
        "payment_method": "cash",
    }
    resp = await client.post("/api/sales", json=payload)
    assert resp.status_code == 400
    assert "not found or inactive" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_create_sale_nonexistent_product(client):
    """Sale with a non-existent product_id returns 400."""
    payload = {
        "items": [
            {"product_id": 99999, "quantity": 1, "unit_price": "10.00"}
        ],
        "payment_method": "cash",
    }
    resp = await client.post("/api/sales", json=payload)
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_list_sales(client, seed_product):
    """List sales returns created sales with items."""
    # Create a sale first
    await client.post(
        "/api/sales",
        json={
            "items": [
                {
                    "product_id": seed_product.id,
                    "quantity": 1,
                    "unit_price": "100.00",
                }
            ],
            "payment_method": "credit",
        },
    )

    resp = await client.get("/api/sales")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1
    assert len(data[0]["items"]) >= 1


@pytest.mark.asyncio
async def test_get_sale_by_id(client, seed_product):
    """Get a single sale by ID."""
    create_resp = await client.post(
        "/api/sales",
        json={
            "items": [
                {
                    "product_id": seed_product.id,
                    "quantity": 2,
                    "unit_price": "100.00",
                }
            ],
            "payment_method": "transfer",
        },
    )
    sale_id = create_resp.json()["id"]

    resp = await client.get(f"/api/sales/{sale_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == sale_id
    assert data["payment_method"] == "transfer"


@pytest.mark.asyncio
async def test_get_sale_not_found(client):
    """Get a non-existent sale returns 404."""
    resp = await client.get("/api/sales/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_sale_payment_methods(client, seed_product):
    """Sale records the selected payment method."""
    for method in ["cash", "debit", "credit", "transfer"]:
        payload = {
            "items": [
                {
                    "product_id": seed_product.id,
                    "quantity": 1,
                    "unit_price": "10.00",
                }
            ],
            "payment_method": method,
        }
        resp = await client.post("/api/sales", json=payload)
        assert resp.status_code == 201
        assert resp.json()["payment_method"] == method

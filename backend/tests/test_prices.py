"""Tests for bulk price update endpoints."""

from decimal import Decimal

import pytest


@pytest.mark.asyncio
async def test_bulk_update_by_brand(client, seed_product, seed_brand):
    """Bulk update selling_price by brand: +10%."""
    original_price = seed_product.selling_price  # 100.00

    resp = await client.put(
        "/api/prices/bulk",
        json={"brand_id": seed_brand.id, "percentage": "10"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["updated"] >= 1
    assert Decimal(str(data["percentage"])) == Decimal("10")

    # Verify the price was updated
    resp = await client.get(f"/api/products/{seed_product.id}")
    product = resp.json()
    expected = (original_price * Decimal("1.10")).quantize(Decimal("0.01"))
    assert Decimal(product["selling_price"]) == expected


@pytest.mark.asyncio
async def test_bulk_update_by_category(client, seed_product, seed_category):
    """Bulk update selling_price by category: +5%."""
    original_price = seed_product.selling_price  # 100.00

    resp = await client.put(
        "/api/prices/bulk",
        json={"category_id": seed_category.id, "percentage": "5"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["updated"] >= 1

    # Verify the price was updated
    resp = await client.get(f"/api/products/{seed_product.id}")
    product = resp.json()
    expected = (original_price * Decimal("1.05")).quantize(Decimal("0.01"))
    assert Decimal(product["selling_price"]) == expected


@pytest.mark.asyncio
async def test_bulk_update_cost_price_unchanged(client, seed_product, seed_brand):
    """Bulk update must NOT change cost_price."""
    original_cost = seed_product.cost_price  # 50.00

    resp = await client.put(
        "/api/prices/bulk",
        json={"brand_id": seed_brand.id, "percentage": "20"},
    )
    assert resp.status_code == 200

    resp = await client.get(f"/api/products/{seed_product.id}")
    product = resp.json()
    assert Decimal(product["cost_price"]) == original_cost


@pytest.mark.asyncio
async def test_bulk_update_no_brand_or_category(client):
    """Bulk update without brand_id or category_id returns 400."""
    resp = await client.put(
        "/api/prices/bulk",
        json={"percentage": "10"},
    )
    assert resp.status_code == 400
    assert "brand_id or category_id" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_bulk_update_both_brand_and_category(client, seed_brand, seed_category):
    """Bulk update with both brand_id and category_id returns 400."""
    resp = await client.put(
        "/api/prices/bulk",
        json={
            "brand_id": seed_brand.id,
            "category_id": seed_category.id,
            "percentage": "10",
        },
    )
    assert resp.status_code == 400
    assert "only one" in resp.json()["detail"].lower()


@pytest.mark.asyncio
async def test_bulk_update_nonexistent_brand(client):
    """Bulk update with non-existent brand_id returns 200 with 0 updated."""
    resp = await client.put(
        "/api/prices/bulk",
        json={"brand_id": 99999, "percentage": "10"},
    )
    assert resp.status_code == 200
    assert resp.json()["updated"] == 0


@pytest.mark.asyncio
async def test_bulk_update_zero_percent(client, seed_product, seed_brand):
    """Bulk update with 0% is rejected (percentage must be > 0)."""
    resp = await client.put(
        "/api/prices/bulk",
        json={"brand_id": seed_brand.id, "percentage": "0"},
    )
    # percentage has gt=0 constraint
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_bulk_update_multiple_products(client, seed_category, seed_brand):
    """Bulk update affects all products in the brand/category."""
    # Create 3 products in the same brand
    product_ids = []
    for i in range(3):
        resp = await client.post(
            "/api/products",
            json={
                "name": f"Product {i}",
                "sku": f"BP-{i}",
                "brand_id": seed_brand.id,
                "category_id": seed_category.id,
                "selling_price": "100.00",
                "cost_price": "50.00",
                "current_stock": 10,
            },
        )
        assert resp.status_code == 201
        product_ids.append(resp.json()["id"])

    # Apply +10% to brand
    resp = await client.put(
        "/api/prices/bulk",
        json={"brand_id": seed_brand.id, "percentage": "10"},
    )
    assert resp.status_code == 200
    assert resp.json()["updated"] >= 3

    # Verify all products updated
    for pid in product_ids:
        resp = await client.get(f"/api/products/{pid}")
        product = resp.json()
        assert Decimal(product["selling_price"]) == Decimal("110.00")
        # cost_price unchanged
        assert Decimal(product["cost_price"]) == Decimal("50.00")

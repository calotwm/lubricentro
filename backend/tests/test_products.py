"""Tests for product CRUD, search, and filter endpoints."""

import pytest


@pytest.mark.asyncio
async def test_create_product(client):
    """Create a product with valid data."""
    payload = {
        "name": "Filtro de Aceite",
        "sku": "FIL-001",
        "unit": "unit",
        "cost_price": "25.00",
        "selling_price": "45.00",
        "current_stock": 10,
        "min_stock": 3,
    }
    resp = await client.post("/api/products", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["name"] == "Filtro de Aceite"
    assert data["sku"] == "FIL-001"
    assert data["current_stock"] == 10
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_create_product_missing_name(client):
    """Creating a product without a name returns 422."""
    payload = {"sku": "NO-NAME"}
    resp = await client.post("/api/products", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_list_products_empty(client):
    """List products returns empty list when none exist."""
    resp = await client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    assert data["items"] == []
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_list_products_with_data(client, seed_product):
    """List products returns seeded product."""
    resp = await client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    names = [p["name"] for p in data["items"]]
    assert "Aceite 20W-50" in names


@pytest.mark.asyncio
async def test_search_products_by_name(client, seed_product):
    """Search by name returns matching products."""
    resp = await client.get("/api/products", params={"search": "20W"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert any("20W-50" in p["name"] for p in data["items"])


@pytest.mark.asyncio
async def test_search_products_by_brand(client, seed_product):
    """Search by brand name returns matching products."""
    resp = await client.get("/api/products", params={"search": "Motul"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_search_products_by_sku(client, seed_product):
    """Search by SKU (barcode) returns matching products."""
    resp = await client.get("/api/products", params={"search": "MOT-20W50"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1


@pytest.mark.asyncio
async def test_filter_products_by_category(client, seed_product, seed_category):
    """Filter by category_id returns only products in that category."""
    resp = await client.get(
        "/api/products", params={"category_id": seed_category.id}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert all(p["category_id"] == seed_category.id for p in data["items"])


@pytest.mark.asyncio
async def test_filter_products_by_brand(client, seed_product, seed_brand):
    """Filter by brand_id returns only products of that brand."""
    resp = await client.get("/api/products", params={"brand_id": seed_brand.id})
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert all(p["brand_id"] == seed_brand.id for p in data["items"])


@pytest.mark.asyncio
async def test_get_product_by_id(client, seed_product):
    """Get a single product by ID."""
    resp = await client.get(f"/api/products/{seed_product.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == seed_product.id
    assert data["name"] == "Aceite 20W-50"


@pytest.mark.asyncio
async def test_get_product_not_found(client):
    """Get a non-existent product returns 404."""
    resp = await client.get("/api/products/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_update_product(client, seed_product):
    """Update a product's fields."""
    resp = await client.put(
        f"/api/products/{seed_product.id}",
        json={"selling_price": "120.00"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["selling_price"] == "120.00"


@pytest.mark.asyncio
async def test_update_product_not_found(client):
    """Update a non-existent product returns 404."""
    resp = await client.put("/api/products/99999", json={"name": "Ghost"})
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_delete_product_soft(client, seed_product):
    """Delete a product (soft delete: is_active=False)."""
    resp = await client.delete(f"/api/products/{seed_product.id}")
    assert resp.status_code == 204

    # Product still exists but is_active=False
    resp = await client.get(f"/api/products/{seed_product.id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_delete_product_not_found(client):
    """Delete a non-existent product returns 404."""
    resp = await client.delete("/api/products/99999")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_deleted_product_excluded_from_list(client, seed_product):
    """Soft-deleted products are excluded from the list endpoint."""
    # Delete the product
    await client.delete(f"/api/products/{seed_product.id}")

    # List should not include it
    resp = await client.get("/api/products")
    assert resp.status_code == 200
    data = resp.json()
    ids = [p["id"] for p in data["items"]]
    assert seed_product.id not in ids

"""Tests for stock movement and merchandise receiving endpoints."""

import pytest


@pytest.mark.asyncio
async def test_create_entry_movement(client, seed_product):
    """ENTRY movement increments stock."""
    initial_stock = seed_product.current_stock
    payload = {
        "product_id": seed_product.id,
        "type": "ENTRY",
        "quantity": 10,
        "reference": "PO-001",
    }
    resp = await client.post("/api/stock/movements", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "ENTRY"
    assert data["quantity"] == 10

    # Verify stock increased
    resp = await client.get(f"/api/products/{seed_product.id}")
    assert resp.json()["current_stock"] == initial_stock + 10


@pytest.mark.asyncio
async def test_create_exit_movement(client, seed_product):
    """EXIT movement decrements stock."""
    initial_stock = seed_product.current_stock
    payload = {
        "product_id": seed_product.id,
        "type": "EXIT",
        "quantity": 5,
        "notes": "Internal use",
    }
    resp = await client.post("/api/stock/movements", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "EXIT"
    assert data["quantity"] == 5

    # Verify stock decreased
    resp = await client.get(f"/api/products/{seed_product.id}")
    assert resp.json()["current_stock"] == initial_stock - 5


@pytest.mark.asyncio
async def test_create_adjustment_movement(client, seed_product):
    """ADJUSTMENT movement sets stock to the specified quantity."""
    payload = {
        "product_id": seed_product.id,
        "type": "ADJUSTMENT",
        "quantity": 50,
        "notes": "Physical count",
    }
    resp = await client.post("/api/stock/movements", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "ADJUSTMENT"
    assert data["quantity"] == 50

    # Verify stock is now 50
    resp = await client.get(f"/api/products/{seed_product.id}")
    assert resp.json()["current_stock"] == 50


@pytest.mark.asyncio
async def test_movement_invalid_product(client):
    """Movement for non-existent product returns 404."""
    payload = {
        "product_id": 99999,
        "type": "ENTRY",
        "quantity": 10,
    }
    resp = await client.post("/api/stock/movements", json=payload)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_movement_missing_product_id(client):
    """Movement without product_id returns 422."""
    payload = {"type": "ENTRY", "quantity": 10}
    resp = await client.post("/api/stock/movements", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_movement_invalid_type(client, seed_product):
    """Movement with invalid type returns 422."""
    payload = {
        "product_id": seed_product.id,
        "type": "INVALID",
        "quantity": 10,
    }
    resp = await client.post("/api/stock/movements", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_movement_zero_quantity(client, seed_product):
    """Movement with quantity=0 returns 422 (must be > 0)."""
    payload = {
        "product_id": seed_product.id,
        "type": "ENTRY",
        "quantity": 0,
    }
    resp = await client.post("/api/stock/movements", json=payload)
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_receive_merchandise(client, seed_product):
    """Receive merchandise creates ENTRY movement, increments stock, updates cost_price."""
    initial_stock = seed_product.current_stock
    payload = {
        "product_id": seed_product.id,
        "quantity": 25,
        "cost_price": "55.00",
        "reference": "INV-2024-001",
    }
    resp = await client.post("/api/stock/receive", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["type"] == "ENTRY"
    assert data["quantity"] == 25
    assert data["reference"] == "INV-2024-001"

    # Verify stock increased
    resp = await client.get(f"/api/products/{seed_product.id}")
    product = resp.json()
    assert product["current_stock"] == initial_stock + 25
    # Verify cost_price updated
    assert product["cost_price"] == "55.00"


@pytest.mark.asyncio
async def test_receive_merchandise_without_cost(client, seed_product):
    """Receive without cost_price increments stock but does not change cost_price."""
    initial_stock = seed_product.current_stock
    initial_cost = seed_product.cost_price
    payload = {
        "product_id": seed_product.id,
        "quantity": 10,
        "reference": "INV-002",
    }
    resp = await client.post("/api/stock/receive", json=payload)
    assert resp.status_code == 201

    resp = await client.get(f"/api/products/{seed_product.id}")
    product = resp.json()
    assert product["current_stock"] == initial_stock + 10
    # cost_price should remain unchanged
    assert product["cost_price"] == str(initial_cost)


@pytest.mark.asyncio
async def test_receive_merchandise_invalid_product(client):
    """Receive for non-existent product returns 404."""
    payload = {
        "product_id": 99999,
        "quantity": 10,
    }
    resp = await client.post("/api/stock/receive", json=payload)
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_movements(client, seed_product):
    """List movements returns recorded movements."""
    # Create a movement first
    await client.post(
        "/api/stock/movements",
        json={
            "product_id": seed_product.id,
            "type": "ENTRY",
            "quantity": 5,
        },
    )

    resp = await client.get("/api/stock/movements")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_list_movements_filter_by_type(client, seed_product):
    """Filter movements by type."""
    await client.post(
        "/api/stock/movements",
        json={
            "product_id": seed_product.id,
            "type": "ENTRY",
            "quantity": 5,
        },
    )
    await client.post(
        "/api/stock/movements",
        json={
            "product_id": seed_product.id,
            "type": "EXIT",
            "quantity": 2,
        },
    )

    resp = await client.get("/api/stock/movements", params={"type": "ENTRY"})
    assert resp.status_code == 200
    data = resp.json()
    assert all(m["type"] == "ENTRY" for m in data)


@pytest.mark.asyncio
async def test_list_movements_filter_by_product(client, seed_product):
    """Filter movements by product_id."""
    await client.post(
        "/api/stock/movements",
        json={
            "product_id": seed_product.id,
            "type": "ENTRY",
            "quantity": 5,
        },
    )

    resp = await client.get(
        "/api/stock/movements", params={"product_id": seed_product.id}
    )
    assert resp.status_code == 200
    data = resp.json()
    assert all(m["product_id"] == seed_product.id for m in data)

"""Integration test for bulk price update consistency.

Note: True concurrent race condition testing requires PostgreSQL with
multiple connections. SQLite's single-writer model serializes writes
automatically, so we test sequential consistency here.
"""

import pytest
from decimal import Decimal


@pytest.mark.asyncio
async def test_sequential_bulk_price_update_consistency(client, db_session, seed_product):
    """Sequential bulk price updates produce consistent totals.

    Two sequential +10% bulk updates on the same brand should result in
    the price being multiplied by 1.1 * 1.1 = 1.21.
    """
    from app.models import User
    from app.security.auth import hash_password

    # Seed admin user for auth (if not already present via override)
    existing = await db_session.execute(
        __import__("sqlalchemy").select(User).where(User.username == "admin")
    )
    if not existing.scalars().first():
        user = User(username="admin", hashed_password=hash_password("pass"), role="admin")
        db_session.add(user)
        await db_session.flush()

    import app.security.auth as auth_mod
    token = auth_mod.create_access_token({"sub": "admin", "role": "admin"})
    headers = {"Authorization": f"Bearer {token}"}

    brand_id = seed_product.brand_id
    initial_price = seed_product.selling_price  # Decimal("100.00")

    # Send two sequential bulk update requests (+10% each)
    r1 = await client.put(
        "/api/prices/bulk",
        json={"brand_id": brand_id, "percentage": 10.0},
        headers=headers,
    )
    assert r1.status_code == 200

    r2 = await client.put(
        "/api/prices/bulk",
        json={"brand_id": brand_id, "percentage": 10.0},
        headers=headers,
    )
    assert r2.status_code == 200

    # Verify the final price reflects both updates (100 * 1.1 * 1.1 = 121.00)
    response = await client.get(f"/api/products/{seed_product.id}", headers=headers)
    assert response.status_code == 200
    final_price = Decimal(str(response.json()["selling_price"]))
    expected = (initial_price * Decimal("1.1") * Decimal("1.1")).quantize(Decimal("0.01"))
    assert final_price == expected

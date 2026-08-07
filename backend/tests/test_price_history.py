"""Tests for price history recording across all mutation paths."""

from decimal import Decimal
from io import BytesIO

import pytest
from openpyxl import Workbook


@pytest.mark.asyncio
async def test_bulk_update_records_price_history(client, seed_product, seed_brand):
    """Bulk price update creates price_history rows for affected products."""
    original_price = seed_product.selling_price  # 100.00

    resp = await client.put(
        "/api/prices/bulk",
        json={"brand_id": seed_brand.id, "percentage": "10"},
    )
    assert resp.status_code == 200
    assert resp.json()["updated"] >= 1

    # Verify price_history row was created
    resp = await client.get("/api/reports/price-history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    item = data["items"][0]
    assert item["product_name"] == "Aceite 20W-50"
    assert Decimal(item["old_price"]) == original_price
    assert Decimal(item["new_price"]) == Decimal("110.00")
    assert item["source"] == "bulk"


@pytest.mark.asyncio
async def test_bulk_update_category_records_history(client, seed_product, seed_category):
    """Bulk price update by category creates price_history rows."""
    resp = await client.put(
        "/api/prices/bulk",
        json={"category_id": seed_category.id, "percentage": "5"},
    )
    assert resp.status_code == 200

    resp = await client.get("/api/reports/price-history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert data["items"][0]["source"] == "bulk"


@pytest.mark.asyncio
async def test_manual_update_records_history(client, seed_product):
    """Manual product update with selling_price change creates price_history row."""
    original_price = seed_product.selling_price  # 100.00

    resp = await client.put(
        f"/api/products/{seed_product.id}",
        json={"selling_price": "120.00"},
    )
    assert resp.status_code == 200

    resp = await client.get("/api/reports/price-history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    item = data["items"][0]
    assert Decimal(item["old_price"]) == original_price
    assert Decimal(item["new_price"]) == Decimal("120.00")
    assert item["source"] == "manual"


@pytest.mark.asyncio
async def test_no_change_no_history(client, seed_product):
    """Updating a product without changing selling_price creates no history row."""
    resp = await client.put(
        f"/api/products/{seed_product.id}",
        json={"name": "Updated Name"},
    )
    assert resp.status_code == 200

    resp = await client.get("/api/reports/price-history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0


@pytest.mark.asyncio
async def test_price_history_filter_by_product(client, seed_product, seed_price_history):
    """Price history endpoint filters by product_id."""
    resp = await client.get(
        "/api/reports/price-history",
        params={"product_id": seed_product.id},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 2


@pytest.mark.asyncio
async def test_price_history_filter_by_source(client, seed_price_history):
    """Price history endpoint filters by source."""
    resp = await client.get(
        "/api/reports/price-history",
        params={"source": "bulk"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1
    assert all(item["source"] == "bulk" for item in data["items"])


@pytest.mark.asyncio
async def test_price_history_csv_export(client, seed_price_history):
    """Price history CSV export returns CSV with date-stamped filename."""
    resp = await client.get("/api/reports/price-history/csv")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers.get("content-type", "")
    disposition = resp.headers.get("content-disposition", "")
    assert "historial_precios_" in disposition
    assert ".csv" in disposition
    content = resp.text
    assert "producto" in content  # header row


@pytest.mark.asyncio
async def test_dashboard_new_kpis(client, seed_product, seed_price_history, seed_quote):
    """Dashboard returns new KPIs: total_products, total_brands, recent changes, recent quotes."""
    resp = await client.get("/api/reports/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_products" in data
    assert "total_brands" in data
    assert "recent_price_changes" in data
    assert "recent_quotes" in data
    assert data["total_products"] >= 1
    assert data["total_brands"] >= 1
    assert len(data["recent_price_changes"]) >= 1
    assert len(data["recent_quotes"]) >= 1


@pytest.mark.asyncio
async def test_excel_import_records_price_history(client, seed_product, db_session):
    """Excel import creates price_history rows when selling_price changes (source=excel)."""
    from app.services.excel_import import import_from_excel

    original_price = seed_product.selling_price  # 100.00
    new_price = Decimal("130.00")

    # Create an in-memory Excel file with the seed product's SKU and a new price
    wb = Workbook()
    ws = wb.active
    ws.append(["SKU", "Nombre", "Precio Venta"])
    ws.append([seed_product.sku, seed_product.name, float(new_price)])

    # Convert to bytes
    excel_buffer = BytesIO()
    wb.save(excel_buffer)
    excel_bytes = excel_buffer.getvalue()

    # Call import_from_excel directly
    result = await import_from_excel(db_session, excel_bytes)

    # Verify the import updated the product
    assert result["updated"] >= 1

    # Verify price_history row was created with source=excel
    resp = await client.get("/api/reports/price-history")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] >= 1

    # Find the excel-sourced entry
    excel_entries = [item for item in data["items"] if item["source"] == "excel"]
    assert len(excel_entries) >= 1

    entry = excel_entries[0]
    assert entry["product_name"] == seed_product.name
    assert Decimal(entry["old_price"]) == original_price
    assert Decimal(entry["new_price"]) == new_price
    assert entry["source"] == "excel"

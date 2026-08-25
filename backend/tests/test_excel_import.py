"""Tests for the Excel price import service (import_from_excel)."""

import io
from decimal import Decimal

import openpyxl
import pytest
from sqlalchemy import select

from app.models import PriceChangeSource, PriceHistory, Product
from app.services.excel_import import import_from_excel


def _workbook_bytes(sheets: dict[str, list[list]]) -> bytes:
    """Build an in-memory .xlsx file from {sheet_title: rows}."""
    wb = openpyxl.Workbook()
    wb.remove(wb.active)
    for title, rows in sheets.items():
        ws = wb.create_sheet(title=title)
        for row in rows:
            ws.append(row)
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


@pytest.mark.asyncio
async def test_standard_headers_first_row(db_session, seed_product):
    """Regression guard: headers on row 1 update an existing product."""
    content = _workbook_bytes(
        {
            "Sheet1": [
                ["Nombre", "SKU", "Precio Venta"],
                ["Aceite 20W-50", "MOT-20W50", "125.50"],
            ]
        }
    )

    result = await import_from_excel(db_session, content)

    assert result["updated"] == 1
    assert result["created"] == 0
    await db_session.refresh(seed_product)
    assert seed_product.selling_price == Decimal("125.50")

    history = (
        await db_session.execute(
            select(PriceHistory).where(PriceHistory.product_id == seed_product.id)
        )
    ).scalars().all()
    assert len(history) == 1
    assert history[0].old_price == Decimal("100.00")
    assert history[0].new_price == Decimal("125.50")
    assert history[0].source == PriceChangeSource.EXCEL


@pytest.mark.asyncio
async def test_banner_rows_before_headers(db_session, seed_product):
    """THE bug: brand banner rows above the real header row must be skipped."""
    content = _workbook_bytes(
        {
            "LISTA": [
                ["", "LA CASA DE LOS FILTROS ", None, None],
                [None, None, None, None],
                [None, None, None, None],
                ["Codigo", "Descripcion", "Precio"],
                ["MOT-20W50", "Aceite 20W-50", "150.00"],
                ["FIL-999", "Filtro de aceite nuevo", "25.00"],
            ]
        }
    )

    result = await import_from_excel(db_session, content)

    assert result["updated"] >= 1
    assert result["created"] >= 1

    await db_session.refresh(seed_product)
    assert seed_product.selling_price == Decimal("150.00")

    new_product = (
        await db_session.execute(select(Product).where(Product.sku == "FIL-999"))
    ).scalar_one()
    assert new_product.name == "Filtro de aceite nuevo"
    assert new_product.selling_price == Decimal("25.00")


@pytest.mark.asyncio
async def test_accented_headers(db_session, seed_product):
    """Accented headers ('Código', 'Descripción') must match after normalization."""
    content = _workbook_bytes(
        {
            "Hoja1": [
                ["Código", "Descripción", "Precio Venta"],
                ["MOT-20W50", "Aceite 20W-50", "120"],
            ]
        }
    )

    result = await import_from_excel(db_session, content)

    assert result["updated"] == 1
    await db_session.refresh(seed_product)
    assert seed_product.selling_price == Decimal("120")


@pytest.mark.asyncio
async def test_second_sheet_with_data(db_session, seed_product):
    """First sheet has only a banner; import must fall back to sheet 2."""
    content = _workbook_bytes(
        {
            "Portada": [["LISTA DE PRECIOS 2026"]],
            "Precios": [
                ["Nombre", "SKU", "Precio Venta"],
                ["Aceite 20W-50", "MOT-20W50", "130.00"],
            ],
        }
    )

    result = await import_from_excel(db_session, content)

    assert result["updated"] == 1
    await db_session.refresh(seed_product)
    assert seed_product.selling_price == Decimal("130.00")


@pytest.mark.asyncio
async def test_no_header_anywhere_returns_error(db_session):
    """A workbook with no recognizable headers returns a helpful error."""
    content = _workbook_bytes(
        {
            "Hoja1": [
                ["algo random", 42],
                ["otra cosa", None],
            ]
        }
    )

    result = await import_from_excel(db_session, content)

    assert result["updated"] == 0
    assert result["created"] == 0
    assert result["errors"]
    assert "No se encontró columna" in result["errors"][0]
    # Error mentions the scanned sheet so the user can fix the file
    assert "Hoja1" in result["errors"][0]


@pytest.mark.asyncio
async def test_section_banner_rows_skip_silently(db_session, seed_product):
    """Section titles landing in the code column (no name, no price) are
    layout noise: skipped silently instead of reported as errors."""
    content = _workbook_bytes(
        {
            "Sheet1": [
                ["Codigo", "Descripcion", "Precio"],
                ["MOT-20W50", "Aceite 20W-50", "140.00"],
                ["FILTROS DE AIRE WEGA", None, None],
                ["FILTROS DE ACEITE", None, None],
            ]
        }
    )

    result = await import_from_excel(db_session, content)

    assert result["updated"] == 1
    assert result["created"] == 0
    assert result["skipped"] >= 2
    assert result["errors"] == []


@pytest.mark.asyncio
async def test_row_with_code_and_price_but_no_name_errors(db_session):
    """A row that looks like a real product (code + price) but lacks a name
    is still surfaced as an error."""
    content = _workbook_bytes(
        {
            "Sheet1": [
                ["Codigo", "Descripcion", "Precio"],
                ["XXX-001", None, "99.00"],
            ]
        }
    )

    result = await import_from_excel(db_session, content)

    assert result["created"] == 0
    assert len(result["errors"]) == 1
    assert "sin nombre" in result["errors"][0]

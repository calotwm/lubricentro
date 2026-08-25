"""
Excel price import service.

Reads an .xlsx file and for each row:
  - If a product with the same SKU exists → update cost_price and/or selling_price
  - If no matching SKU → create a new product with the provided data

Expected columns (case-insensitive, Spanish or English accepted):
  SKU / Codigo
  Nombre / Name
  Marca / Brand
  Categoria / Category
  Precio Costo / Costo / Cost Price / Cost
  Precio Venta / Venta / Selling Price / Price
"""

from __future__ import annotations

import io
import unicodedata
from decimal import Decimal, InvalidOperation
from typing import Optional

import openpyxl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Brand, Category, PriceChangeSource, PriceHistory, Product

# ---------------------------------------------------------------------------
# Column name aliases
# ---------------------------------------------------------------------------
_SKU_COLS = {"sku", "codigo", "code", "cod"}
_NAME_COLS = {"nombre", "name", "producto", "product", "descripcion", "description"}
_BRAND_COLS = {"marca", "brand"}
_CAT_COLS = {"categoria", "category", "categoría", "rubro"}
_COST_COLS = {"precio costo", "costo", "cost price", "cost", "precio_costo", "precioosto"}
_SELL_COLS = {"precio venta", "venta", "selling price", "price", "precio_venta", "precio", "precioventa", "p. venta"}
_STOCK_COLS = {"stock", "stock actual", "existencia", "cantidad", "current stock", "stock_actual", "unidades"}
_MIN_STOCK_COLS = {"stock minimo", "stock min", "min stock", "stock_minimo", "minimo", "min"}

# Header detection: how many non-empty rows to inspect per sheet, and how many
# columns to show in the error preview when no header row is found.
_MAX_HEADER_SCAN_ROWS = 30
_ERROR_PREVIEW_COLS = 10


def _norm(s: str) -> str:
    """Normalize a header cell: drop accents, collapse whitespace, lowercase."""
    decomposed = unicodedata.normalize("NFKD", s)
    without_accents = "".join(ch for ch in decomposed if not unicodedata.combining(ch))
    return " ".join(without_accents.split()).lower()


def _find_col(headers: list[str], aliases: set[str]) -> Optional[int]:
    for i, h in enumerate(headers):
        if _norm(h) in aliases:
            return i
    return None


def _to_decimal(val) -> Optional[Decimal]:
    if val is None:
        return None
    try:
        s = str(val).strip().replace(",", ".").replace(" ", "")
        if not s:
            return None
        return Decimal(s)
    except InvalidOperation:
        return None


def _to_int(val) -> Optional[int]:
    if val is None:
        return None
    try:
        s = str(val).strip().replace(",", ".").replace(" ", "")
        if not s:
            return None
        return int(float(s))
    except (ValueError, InvalidOperation):
        return None


async def _get_or_create_brand(db: AsyncSession, name: str) -> Optional[int]:
    name = name.strip()
    if not name:
        return None
    result = await db.execute(select(Brand).where(Brand.name == name))
    brand = result.scalar_one_or_none()
    if brand:
        return brand.id
    brand = Brand(name=name[:100])
    db.add(brand)
    await db.flush()
    return brand.id


async def _get_or_create_category(db: AsyncSession, name: str) -> Optional[int]:
    name = name.strip()
    if not name:
        return None
    result = await db.execute(select(Category).where(Category.name == name))
    cat = result.scalar_one_or_none()
    if cat:
        return cat.id
    cat = Category(name=name[:100])
    db.add(cat)
    await db.flush()
    return cat.id


async def import_from_excel(
    db: AsyncSession, file_bytes: bytes
) -> dict:
    wb = openpyxl.load_workbook(io.BytesIO(file_bytes), read_only=True, data_only=True)

    # Locate the header row: scan each worksheet in order, checking the first
    # non-empty rows for a known SKU/name column alias. Real-world price lists
    # often start with banner/title rows above the actual headers.
    rows: Optional[list[tuple]] = None
    header_row_idx = 0
    sheet_summaries: list[str] = []
    saw_any_data = False

    for ws in wb.worksheets:
        sheet_rows = list(ws.iter_rows(values_only=True))
        first_non_empty = next(
            (row for row in sheet_rows if any(c is not None for c in row)), None
        )
        saw_any_data = saw_any_data or first_non_empty is not None
        if first_non_empty is not None:
            preview = [
                str(c) if c is not None else ""
                for c in first_non_empty[:_ERROR_PREVIEW_COLS]
            ]
            sheet_summaries.append(f"'{ws.title}' columnas detectadas: {preview}")
        else:
            sheet_summaries.append(f"'{ws.title}' sin filas de datos")

        checked = 0
        for i, row in enumerate(sheet_rows):
            if not any(c is not None for c in row):
                continue
            checked += 1
            headers = [_norm(str(c)) if c is not None else "" for c in row]
            if (
                _find_col(headers, _SKU_COLS) is not None
                or _find_col(headers, _NAME_COLS) is not None
            ):
                rows = sheet_rows
                header_row_idx = i
                break
            if checked >= _MAX_HEADER_SCAN_ROWS:
                break
        if rows is not None:
            break

    if rows is None:
        if not saw_any_data:
            return {"updated": 0, "created": 0, "skipped": 0, "errors": ["Archivo vacío"]}
        return {
            "updated": 0, "created": 0, "skipped": 0,
            "errors": [
                "No se encontró columna de Nombre o SKU. "
                f"Hojas escaneadas: {'; '.join(sheet_summaries)}"
            ],
        }

    raw_headers = [str(c) if c is not None else "" for c in rows[header_row_idx]]

    sku_col = _find_col(raw_headers, _SKU_COLS)
    name_col = _find_col(raw_headers, _NAME_COLS)
    brand_col = _find_col(raw_headers, _BRAND_COLS)
    cat_col = _find_col(raw_headers, _CAT_COLS)
    cost_col = _find_col(raw_headers, _COST_COLS)
    sell_col = _find_col(raw_headers, _SELL_COLS)
    stock_col = _find_col(raw_headers, _STOCK_COLS)
    min_stock_col = _find_col(raw_headers, _MIN_STOCK_COLS)

    updated = 0
    created = 0
    skipped = 0
    errors: list[str] = []

    data_rows = rows[header_row_idx + 1:]

    for row_num, row in enumerate(data_rows, start=header_row_idx + 2):
        def cell(idx):
            if idx is None or idx >= len(row):
                return None
            return row[idx]

        sku_val = str(cell(sku_col) or "").strip() or None
        name_val = str(cell(name_col) or "").strip() if name_col is not None else None
        brand_val = str(cell(brand_col) or "").strip() if brand_col is not None else None
        cat_val = str(cell(cat_col) or "").strip() if cat_col is not None else None
        cost_val = _to_decimal(cell(cost_col)) if cost_col is not None else None
        sell_val = _to_decimal(cell(sell_col)) if sell_col is not None else None
        stock_val = _to_int(cell(stock_col)) if stock_col is not None else None
        min_stock_val = _to_int(cell(min_stock_col)) if min_stock_col is not None else None

        # Skip completely empty rows
        if not sku_val and not name_val:
            skipped += 1
            continue

        # Try to find existing product by SKU
        existing: Optional[Product] = None
        if sku_val:
            result = await db.execute(select(Product).where(Product.sku == sku_val))
            existing = result.scalar_one_or_none()

        if existing:
            # Update prices (and optionally brand/category if provided)
            changed = False
            if cost_val is not None:
                existing.cost_price = cost_val
                changed = True
            if sell_val is not None:
                old_price = existing.selling_price
                if old_price is not None and old_price != sell_val:
                    # Record price history BEFORE mutation
                    from decimal import ROUND_HALF_UP
                    pct = (
                        ((sell_val - old_price) / old_price * Decimal("100"))
                        .quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
                    )
                    db.add(
                        PriceHistory(
                            product_id=existing.id,
                            old_price=old_price,
                            new_price=sell_val,
                            percentage=pct,
                            source=PriceChangeSource.EXCEL,
                        )
                    )
                existing.selling_price = sell_val
                changed = True
            if brand_val:
                brand_id = await _get_or_create_brand(db, brand_val)
                if brand_id and existing.brand_id != brand_id:
                    existing.brand_id = brand_id
                    changed = True
            if cat_val:
                cat_id = await _get_or_create_category(db, cat_val)
                if cat_id and existing.category_id != cat_id:
                    existing.category_id = cat_id
                    changed = True
            if stock_val is not None:
                existing.current_stock = stock_val
                changed = True
            if min_stock_val is not None:
                existing.min_stock = min_stock_val
                changed = True
            if changed:
                updated += 1
            else:
                skipped += 1
        else:
            # Create new product — requires at least a name
            if not name_val:
                # Only report an error when the row looks like a real product
                # attempt (code + price). Section banners (e.g. "FILTROS DE
                # AIRE WEGA") land in the code column without a price, so
                # treat them as layout noise and skip silently.
                if sku_val and (cost_val is not None or sell_val is not None):
                    errors.append(f"Fila {row_num}: sin nombre, no se puede crear el producto.")
                skipped += 1
                continue

            brand_id = await _get_or_create_brand(db, brand_val) if brand_val else None
            cat_id = await _get_or_create_category(db, cat_val) if cat_val else None

            product = Product(
                sku=sku_val[:50] if sku_val else None,
                name=name_val[:200],
                brand_id=brand_id,
                category_id=cat_id,
                cost_price=cost_val,
                selling_price=sell_val,
                unit="unit",
                current_stock=stock_val if stock_val is not None else 0,
                min_stock=min_stock_val if min_stock_val is not None else 0,
                is_active=True,
            )
            db.add(product)
            created += 1

    await db.flush()
    wb.close()

    return {
        "updated": updated,
        "created": created,
        "skipped": skipped,
        "errors": errors[:20],  # cap error list
    }

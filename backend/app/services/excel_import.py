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
from decimal import Decimal, InvalidOperation
from typing import Optional

import openpyxl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Brand, Category, Product

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


def _norm(s: str) -> str:
    return s.strip().lower()


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
    ws = wb.active

    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return {"updated": 0, "created": 0, "skipped": 0, "errors": ["Archivo vacío"]}

    # Detect header row (first non-empty row)
    header_row_idx = 0
    for i, row in enumerate(rows):
        if any(cell is not None for cell in row):
            header_row_idx = i
            break

    raw_headers = [str(c) if c is not None else "" for c in rows[header_row_idx]]

    sku_col = _find_col(raw_headers, _SKU_COLS)
    name_col = _find_col(raw_headers, _NAME_COLS)
    brand_col = _find_col(raw_headers, _BRAND_COLS)
    cat_col = _find_col(raw_headers, _CAT_COLS)
    cost_col = _find_col(raw_headers, _COST_COLS)
    sell_col = _find_col(raw_headers, _SELL_COLS)
    stock_col = _find_col(raw_headers, _STOCK_COLS)
    min_stock_col = _find_col(raw_headers, _MIN_STOCK_COLS)

    if name_col is None and sku_col is None:
        return {
            "updated": 0, "created": 0, "skipped": 0,
            "errors": [
                f"No se encontró columna de Nombre o SKU. "
                f"Columnas detectadas: {raw_headers}"
            ]
        }

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

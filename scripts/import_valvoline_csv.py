"""
Import VALVOLINE price list CSV into lubricentro database.

Handles the specific format of "LISTA DE PRECIO JULIO 2026.csv":
  - Semicolon-delimited, $ARS prices with comma as decimal separator
  - Row 2: brand header (+;VALVOLINE;;CAPACIDAD;...)
  - Rows 3+: products (code;name;;capacity;list_price;discount%;cost_price;...)

Usage:
    python import_valvoline_csv.py "<path-to-csv>"
"""

import csv
import os
import re
import sys
from decimal import Decimal, InvalidOperation
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session, sessionmaker

# ---------------------------------------------------------------------------
# ORM models (same as backend/app/models.py — standalone copy)
# ---------------------------------------------------------------------------
from datetime import datetime
from typing import Optional, List

from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Category(Base):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Brand(Base):
    __tablename__ = "brands"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


class Product(Base):
    __tablename__ = "products"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    sku: Mapped[Optional[str]] = mapped_column(String(50), unique=True, nullable=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    category_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("categories.id"), nullable=True)
    brand_id: Mapped[Optional[int]] = mapped_column(Integer, ForeignKey("brands.id"), nullable=True)
    specification: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    unit: Mapped[str] = mapped_column(String(20), default="unit")
    cost_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    selling_price: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 2), nullable=True)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    min_stock: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def parse_ars_price(text: str) -> Optional[Decimal]:
    """Parse '$ 46.000,00' → Decimal(46000.00). Handles $, ., commas, whitespace."""
    if not text or not text.strip():
        return None
    cleaned = text.strip()
    cleaned = cleaned.replace("$", "").replace(" ", "")
    # Handle #REF! / #¡REF! or other Excel errors
    if not cleaned or "#REF" in cleaned.upper() or "NO HAY" in cleaned.upper():
        return None
    # Remove thousand separators (dots)
    if "," in cleaned:
        parts = cleaned.split(",")
        integer_part = parts[0].replace(".", "")
        decimal_part = parts[1]
        cleaned = integer_part + "." + decimal_part
    else:
        cleaned = cleaned.replace(".", "")
    try:
        return Decimal(cleaned)
    except (InvalidOperation, ValueError):
        return None


def extract_product_name(raw_name: str, capacity: str) -> str:
    """Build a clean product name."""
    name = raw_name.strip()
    # Remove leading codes like BLANCO, GRIS, AZUL if they're standalone
    known_colors = {"BLANCO", "GRIS", "AZUL", "VERDE", "ROJO", "AMARILLO", "NEGRO"}
    for color in known_colors:
        if name.upper().startswith(color) and len(name) == len(color):
            # The color IS the product name (e.g. "GRIS;GEAR 75W90 GRIS")
            # In this case the actual name is in col 1 which already includes it
            pass
    return name


def guess_category(name: str, spec: str) -> str:
    """Guess category based on product name/spec keywords."""
    text = f"{name} {spec}".upper()
    if any(kw in text for kw in ["MOTO", "MOTORCYCLE", "2-STROKE", "2 TIEMPOS"]):
        return "Aceites de Moto"
    if any(kw in text for kw in ["TRANSMISION", "ATF", "DEX/MERC", "DEXRON", "CVT", "DCT"]):
        return "Transmisiones"
    if any(kw in text for kw in ["GEAR", "80/90", "75W90", "85W140", "75W140", "75W80"]):
        return "Aceites de Transmisión"
    if any(kw in text for kw in ["ADITIVO", "ZEREX", "LAVA PARABRISAS", "CHIAM LUBE"]):
        return "Aditivos y Accesorios"
    if any(kw in text for kw in ["5W40", "5W30", "10W40", "10W60", "15W40", "20W50",
                                  "25W60", "20W50", "0W20", "5W20"]):
        return "Aceites de Motor"
    return "Aceites de Motor"  # default for VALVOLINE


def get_or_create(session: Session, model, name: str) -> int:
    """Look up an entity by name or create it. Returns the ID."""
    existing = session.execute(select(model).where(model.name == name)).scalar_one_or_none()
    if existing is None:
        existing = model(name=name)
        session.add(existing)
        session.flush()
    return existing.id


# ---------------------------------------------------------------------------
# Main import
# ---------------------------------------------------------------------------

def main():
    if len(sys.argv) < 2:
        print("Usage: python import_valvoline_csv.py <path-to-csv>")
        sys.exit(1)

    csv_path = Path(sys.argv[1])
    if not csv_path.exists():
        print(f"Error: file not found: {csv_path}")
        sys.exit(1)

    # DB connection
    db_url = os.environ.get("DB_URL", "sqlite:///../backend/lubricentro.db")
    engine = create_engine(db_url, echo=False)
    SessionLocal = sessionmaker(bind=engine)

    print(f"Reading: {csv_path}")
    print(f"Database: {db_url}")

    with open(csv_path, encoding="latin-1") as f:
        reader = csv.reader(f, delimiter=";")
        rows = list(reader)

    # Detect brand from row 2 (index 1)
    brand_name = "VALVOLINE"  # default
    current_brand = brand_name
    if len(rows) > 1 and len(rows[1]) > 1 and rows[1][1].strip():
        current_brand = rows[1][1].strip()
    print(f"Brand detected: {current_brand}")

    all_warnings = []
    prod_count = 0

    with SessionLocal() as session:
        # Ensure brand exists
        brand_id = get_or_create(session, Brand, current_brand)

        # Ensure default categories exist
        category_cache = {}

        for row_num, row in enumerate(rows, start=1):
            # Skip header/data rows
            if row_num <= 2:
                continue

            # Skip completely empty rows
            if not any(cell.strip() for cell in row if cell):
                continue

            # Skip rows with more than 10 empty cells (mostly blank)
            filled = sum(1 for cell in row if cell and cell.strip())
            if filled <= 1:
                continue

            # Extract fields
            code = row[0].strip() if len(row) > 0 else ""
            raw_name = row[1].strip() if len(row) > 1 else ""
            capacity = row[3].strip() if len(row) > 3 else ""
            list_price_str = row[4].strip() if len(row) > 4 else ""
            cost_price_str = row[6].strip() if len(row) > 6 else ""

            # Skip category/section header rows (no product name)
            if not raw_name:
                # Check if this row has something in col 1 that looks like a section name
                if any(kw in (row[1] if len(row) > 1 else "").upper() for kw in
                       ["ACEITE", "TRANSMISION", "ADITIVO"]):
                    all_warnings.append(f"Row {row_num}: section header '{row[1].strip()}', skipping")
                continue

            # Build product name with capacity
            product_name = raw_name
            if capacity and capacity not in product_name:
                product_name = f"{raw_name} {capacity}"

            # Parse prices
            selling_price = parse_ars_price(list_price_str)
            if selling_price is None or selling_price == 0:
                all_warnings.append(f"Row {row_num}: '{raw_name}' — invalid or zero list price, skipping")
                continue

            cost_price = parse_ars_price(cost_price_str)

            # Build SKU from code + capacity if available
            sku_parts = []
            if code:
                sku_parts.append(code)
            if capacity:
                cap_clean = capacity.replace(" ", "_")
                sku_parts.append(cap_clean)
            sku = "VAL-" + "-".join(sku_parts) if sku_parts else None

            # Specification
            specification = capacity if capacity else None

            # Guess category
            cat_name = guess_category(product_name, capacity or "")
            if cat_name not in category_cache:
                category_cache[cat_name] = get_or_create(session, Category, cat_name)
            category_id = category_cache[cat_name]

            # Upsert by SKU or name
            product = None
            if sku:
                product = session.execute(
                    select(Product).where(Product.sku == sku)
                ).scalar_one_or_none()
            if product is None:
                product = session.execute(
                    select(Product).where(Product.name == product_name)
                ).scalar_one_or_none()

            if product:
                # Update existing
                product.name = product_name
                product.selling_price = selling_price
                if cost_price is not None:
                    product.cost_price = cost_price
                if specification:
                    product.specification = specification
                product.brand_id = brand_id
                product.category_id = category_id
                product.is_active = True
            else:
                product = Product(
                    name=product_name,
                    sku=sku,
                    selling_price=selling_price,
                    cost_price=cost_price,
                    specification=specification,
                    unit="unit",
                    current_stock=0,
                    min_stock=0,
                    brand_id=brand_id,
                    category_id=category_id,
                    is_active=True,
                )
                session.add(product)
                prod_count += 1

        session.commit()

        # Print warnings
        for w in all_warnings:
            print(f"WARNING: {w}")

        # Summary
        cats_created = session.execute(select(Category)).scalars().all()
        brands_created = session.execute(select(Brand)).scalars().all()
        total_products = session.execute(select(Product)).scalars().all()

        print(f"\n=== Import complete! ===")
        print(f"   Categories: {len(cats_created)} ({', '.join(c.name for c in cats_created)})")
        print(f"   Brands: {len(brands_created)} ({', '.join(b.name for b in brands_created)})")
        print(f"   Products imported (new): {prod_count}")
        print(f"   Products total in DB: {len(total_products)}")
        print(f"   Warnings: {len(all_warnings)}")


if __name__ == "__main__":
    main()

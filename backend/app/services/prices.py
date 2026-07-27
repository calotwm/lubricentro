from decimal import Decimal, ROUND_HALF_UP
from typing import Optional

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product


async def bulk_update_by_brand(
    db: AsyncSession, brand_id: int, percentage: Decimal
) -> int:
    """
    Increase selling_price by percentage for all products of a brand.
    Only updates selling_price, never cost_price.
    Returns number of products updated.
    """
    multiplier = Decimal("1") + (percentage / Decimal("100"))

    # Fetch products to apply rounding
    query = select(Product).where(
        Product.brand_id == brand_id,
        Product.is_active.is_(True),
        Product.selling_price.isnot(None),
    )
    result = await db.execute(query)
    products = result.scalars().unique().all()

    count = 0
    for product in products:
        new_price = (product.selling_price * multiplier).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        product.selling_price = new_price
        count += 1

    await db.flush()
    return count


async def bulk_update_by_category(
    db: AsyncSession, category_id: int, percentage: Decimal
) -> int:
    """
    Increase selling_price by percentage for all products of a category.
    Only updates selling_price, never cost_price.
    Returns number of products updated.
    """
    multiplier = Decimal("1") + (percentage / Decimal("100"))

    query = select(Product).where(
        Product.category_id == category_id,
        Product.is_active.is_(True),
        Product.selling_price.isnot(None),
    )
    result = await db.execute(query)
    products = result.scalars().unique().all()

    count = 0
    for product in products:
        new_price = (product.selling_price * multiplier).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        product.selling_price = new_price
        count += 1

    await db.flush()
    return count

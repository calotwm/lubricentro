from decimal import Decimal, ROUND_HALF_UP
from typing import List, Optional, Tuple

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import PriceChangeSource, PriceHistory, Product


async def record_price_changes(
    db: AsyncSession,
    pairs: List[Tuple[int, Decimal, Decimal]],
    source: PriceChangeSource,
    reference: Optional[str] = None,
    note: Optional[str] = None,
) -> None:
    """
    Record price history rows BEFORE mutation.

    pairs: list of (product_id, old_price, new_price)
    Only records when old_price != new_price.
    """
    for product_id, old_price, new_price in pairs:
        if old_price == new_price:
            continue
        if old_price and old_price != 0:
            pct = ((new_price - old_price) / old_price * Decimal("100")).quantize(
                Decimal("0.01"), rounding=ROUND_HALF_UP
            )
        else:
            pct = None
        db.add(
            PriceHistory(
                product_id=product_id,
                old_price=old_price,
                new_price=new_price,
                percentage=pct,
                source=source,
                reference=reference,
                note=note,
            )
        )
    await db.flush()


async def bulk_update_by_brand(
    db: AsyncSession, brand_id: int, percentage: Decimal, note: Optional[str] = None
) -> int:
    """
    Increase selling_price by percentage for all products of a brand.
    Only updates selling_price, never cost_price.
    Returns number of products updated.
    """
    multiplier = Decimal("1") + (percentage / Decimal("100"))

    query = select(Product).where(
        Product.brand_id == brand_id,
        Product.is_active.is_(True),
        Product.selling_price.isnot(None),
    ).with_for_update()
    result = await db.execute(query)
    products = result.scalars().unique().all()

    # Record price changes BEFORE mutation
    pairs = []
    for product in products:
        old_price = product.selling_price
        new_price = (old_price * multiplier).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        pairs.append((product.id, old_price, new_price))

    await record_price_changes(db, pairs, PriceChangeSource.BULK, reference=note)

    # Now mutate
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
    db: AsyncSession, category_id: int, percentage: Decimal, note: Optional[str] = None
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
    ).with_for_update()
    result = await db.execute(query)
    products = result.scalars().unique().all()

    # Record price changes BEFORE mutation
    pairs = []
    for product in products:
        old_price = product.selling_price
        new_price = (old_price * multiplier).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        pairs.append((product.id, old_price, new_price))

    await record_price_changes(db, pairs, PriceChangeSource.BULK, reference=note)

    # Now mutate
    count = 0
    for product in products:
        new_price = (product.selling_price * multiplier).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
        product.selling_price = new_price
        count += 1

    await db.flush()
    return count

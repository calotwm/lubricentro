"""Quotes service: create, list, get, update, delete, PDF generation."""

import asyncio
from datetime import datetime
from decimal import Decimal
from io import BytesIO
from typing import List, Optional

from sqlalchemy import delete as sa_delete
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product, Quote, QuoteItem
from app.schemas import QuoteCreate, QuoteUpdate
from app.services.pdf import generate_pdf


async def _generate_quote_number(db: AsyncSession) -> str:
    """Generate sequential PRES-YYYY-NNNN quote number with retry on collision."""
    year = datetime.now().year
    max_retries = 5

    for attempt in range(max_retries):
        prefix = f"PRES-{year}-"
        # Find the max quote_number for this year
        query = select(Quote.quote_number).where(
            Quote.quote_number.like(f"{prefix}%")
        ).order_by(Quote.quote_number.desc()).limit(1)
        result = await db.execute(query)
        last_number = result.scalar_one_or_none()

        if last_number:
            # Extract the sequence part
            seq = int(last_number.split("-")[-1])
            next_seq = seq + 1
        else:
            next_seq = 1

        quote_number = f"{prefix}{next_seq:04d}"

        # Check uniqueness (in case of concurrent creation)
        check = await db.execute(
            select(Quote.id).where(Quote.quote_number == quote_number)
        )
        if check.scalar_one_or_none() is None:
            return quote_number

        # Collision — retry
        await asyncio.sleep(0.01)

    raise RuntimeError("Could not generate unique quote number after retries")


async def create_quote(
    db: AsyncSession, data: QuoteCreate
) -> Quote:
    """Create a new quote with items."""
    quote_number = await _generate_quote_number(db)

    total = Decimal("0")
    items_data = []
    for item in data.items:
        subtotal = (item.quantity * item.unit_price).quantize(Decimal("0.01"))
        total += subtotal

        # Resolve description from product if product_id given and description empty
        description = item.description
        if item.product_id and not description:
            product = await db.get(Product, item.product_id)
            if product:
                description = product.name

        items_data.append({
            "product_id": item.product_id,
            "description": description or "Item",
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "subtotal": subtotal,
        })

    quote = Quote(
        quote_number=quote_number,
        client_name=data.client_name,
        client_phone=data.client_phone,
        status="draft",
        total=total.quantize(Decimal("0.01")),
    )
    db.add(quote)
    await db.flush()

    for item_data in items_data:
        quote_item = QuoteItem(
            quote_id=quote.id,
            **item_data,
        )
        db.add(quote_item)
    await db.flush()

    await db.refresh(quote)
    return quote


async def get_quote(db: AsyncSession, quote_id: int) -> Optional[Quote]:
    """Get a single quote with items."""
    query = select(Quote).where(Quote.id == quote_id)
    result = await db.execute(query)
    return result.scalars().unique().first()


async def list_quotes(
    db: AsyncSession, skip: int = 0, limit: int = 20
) -> tuple[List[Quote], int]:
    """List quotes paginated. Returns (items, total)."""
    count_query = select(func.count()).select_from(Quote)
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    query = select(Quote).order_by(Quote.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().unique().all())

    return items, total


async def get_quote_pdf(db: AsyncSession, quote_id: int) -> Optional[BytesIO]:
    """Generate PDF for a quote. Returns BytesIO buffer or None if not found."""
    quote = await get_quote(db, quote_id)
    if not quote:
        return None
    return generate_pdf(quote, quote.items)


async def update_quote(
    db: AsyncSession, quote_id: int, data: QuoteUpdate
) -> Optional[Quote]:
    """Update an existing quote: client info + replace items, recompute total."""
    quote = await get_quote(db, quote_id)
    if not quote:
        return None

    # Update client info
    quote.client_name = data.client_name
    quote.client_phone = data.client_phone

    # Delete existing items
    await db.execute(
        sa_delete(QuoteItem).where(QuoteItem.quote_id == quote_id)
    )

    # Recompute total and insert new items
    total = Decimal("0")
    for item in data.items:
        subtotal = (item.quantity * item.unit_price).quantize(Decimal("0.01"))
        total += subtotal

        # Resolve description from product if product_id given and description empty
        description = item.description
        if item.product_id and not description:
            product = await db.get(Product, item.product_id)
            if product:
                description = product.name

        quote_item = QuoteItem(
            quote_id=quote_id,
            product_id=item.product_id,
            description=description or "Item",
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=subtotal,
        )
        db.add(quote_item)

    quote.total = total.quantize(Decimal("0.01"))
    await db.flush()
    await db.refresh(quote)
    return quote


async def delete_quote(db: AsyncSession, quote_id: int) -> bool:
    """Delete a quote and its items. Returns True if deleted, False if not found."""
    quote = await get_quote(db, quote_id)
    if not quote:
        return False

    # Delete items first (could also rely on cascade if configured)
    await db.execute(
        sa_delete(QuoteItem).where(QuoteItem.quote_id == quote_id)
    )
    await db.execute(
        sa_delete(Quote).where(Quote.id == quote_id)
    )
    await db.flush()
    return True

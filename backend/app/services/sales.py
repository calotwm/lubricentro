from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product, Sale, SaleItem
from app.schemas import SaleCreate


async def get_sales(
    db: AsyncSession,
    skip: int = 0,
    limit: int = 50,
) -> List[Sale]:
    """List sales with their items."""
    query = (
        select(Sale)
        .order_by(Sale.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    result = await db.execute(query)
    return list(result.scalars().unique().all())


async def get_sale(db: AsyncSession, sale_id: int) -> Optional[Sale]:
    """Get a single sale by ID."""
    query = select(Sale).where(Sale.id == sale_id)
    result = await db.execute(query)
    return result.scalars().unique().first()


async def create_sale(db: AsyncSession, data: SaleCreate) -> Sale:
    """
    Transactional sale creation:
    1. Validate all items exist and have sufficient stock
    2. Create the Sale record
    3. Create SaleItem records
    4. Decrement product stock
    All in one transaction.
    """
    if not data.items:
        raise ValueError("Sale must contain at least one item")

    # Validate stock for all items first
    product_ids = [item.product_id for item in data.items]
    query = select(Product).where(Product.id.in_(product_ids), Product.is_active.is_(True))
    result = await db.execute(query)
    products_map = {p.id: p for p in result.scalars().unique().all()}

    # Validate all products exist and have sufficient stock
    for sale_item in data.items:
        product = products_map.get(sale_item.product_id)
        if not product:
            raise ValueError(f"Product {sale_item.product_id} not found or inactive")
        if product.current_stock < sale_item.quantity:
            raise ValueError(
                f"Insufficient stock for '{product.name}': "
                f"requested {sale_item.quantity}, available {product.current_stock}"
            )

    # Calculate total
    total = Decimal("0")
    sale_items_data = []
    for sale_item in data.items:
        product = products_map[sale_item.product_id]
        subtotal = sale_item.unit_price * sale_item.quantity
        total += subtotal
        sale_items_data.append({
            "product_id": sale_item.product_id,
            "quantity": sale_item.quantity,
            "unit_price": sale_item.unit_price,
            "subtotal": subtotal,
        })

    # Create sale
    sale = Sale(
        total=total,
        payment_method=data.payment_method,
        notes=data.notes,
    )
    db.add(sale)
    await db.flush()

    # Create sale items and decrement stock
    for item_data in sale_items_data:
        sale_item = SaleItem(
            sale_id=sale.id,
            product_id=item_data["product_id"],
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
            subtotal=item_data["subtotal"],
        )
        db.add(sale_item)

        # Decrement stock
        product = products_map[item_data["product_id"]]
        product.current_stock -= item_data["quantity"]

    await db.flush()
    await db.refresh(sale)
    return sale

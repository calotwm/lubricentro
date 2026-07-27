from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import MovementType, Product, StockMovement
from app.schemas import StockMovementCreate, StockReceiveCreate
from app.services.products import get_product


async def get_movements(
    db: AsyncSession,
    product_id: Optional[int] = None,
    movement_type: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> List[StockMovement]:
    """List stock movements with optional filters."""
    query = select(StockMovement).order_by(StockMovement.created_at.desc())

    if product_id is not None:
        query = query.where(StockMovement.product_id == product_id)
    if movement_type is not None:
        query = query.where(StockMovement.type == movement_type)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    return list(result.scalars().unique().all())


async def create_movement(
    db: AsyncSession, data: StockMovementCreate
) -> StockMovement:
    """Record a stock movement and update product current_stock."""
    product = await get_product(db, data.product_id)
    if not product:
        raise ValueError(f"Product {data.product_id} not found")

    movement_type = MovementType(data.type)

    # Calculate stock delta
    if movement_type == MovementType.ENTRY:
        delta = data.quantity
    elif movement_type == MovementType.EXIT:
        delta = -data.quantity
    else:  # ADJUSTMENT — quantity is the absolute new stock level
        delta = data.quantity - product.current_stock

    # Create movement record
    movement = StockMovement(
        product_id=data.product_id,
        type=movement_type,
        quantity=data.quantity,
        reference=data.reference,
        notes=data.notes,
    )
    db.add(movement)

    # Update product stock
    product.current_stock = max(0, product.current_stock + delta)

    await db.flush()
    await db.refresh(movement)
    return movement


async def receive_merchandise(
    db: AsyncSession, data: StockReceiveCreate
) -> StockMovement:
    """Receive merchandise: create ENTRY movement, increment stock, optionally update cost_price."""
    product = await get_product(db, data.product_id)
    if not product:
        raise ValueError(f"Product {data.product_id} not found")

    # Create ENTRY movement
    movement = StockMovement(
        product_id=data.product_id,
        type=MovementType.ENTRY,
        quantity=data.quantity,
        reference=data.reference,
        notes=data.notes,
    )
    db.add(movement)

    # Increment stock
    product.current_stock += data.quantity

    # Update cost price if provided
    if data.cost_price is not None:
        product.cost_price = data.cost_price

    await db.flush()
    await db.refresh(movement)
    return movement

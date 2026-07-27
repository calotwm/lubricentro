from decimal import Decimal
from typing import List, Optional

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Brand, Category, Product
from app.schemas import ProductCreate, ProductUpdate


async def get_products(
    db: AsyncSession,
    search: Optional[str] = None,
    category_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[Product], int]:
    """List products with optional search and filters. Returns (items, total_count)."""
    base_query = select(Product).where(Product.is_active.is_(True))
    count_query = select(func.count()).select_from(Product).where(Product.is_active.is_(True))

    # Search across name, brand name, sku (barcode), specification
    if search:
        pattern = f"%{search}%"
        search_filter = or_(
            Product.name.ilike(pattern),
            Product.sku.ilike(pattern),
            Product.specification.ilike(pattern),
            Brand.name.ilike(pattern),
        )
        base_query = base_query.join(Brand, Product.brand_id == Brand.id, isouter=True).where(search_filter)
        count_query = count_query.join(Brand, Product.brand_id == Brand.id, isouter=True).where(search_filter)

    if category_id is not None:
        base_query = base_query.where(Product.category_id == category_id)
        count_query = count_query.where(Product.category_id == category_id)

    if brand_id is not None:
        base_query = base_query.where(Product.brand_id == brand_id)
        count_query = count_query.where(Product.brand_id == brand_id)

    # Get total count
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated items
    query = base_query.order_by(Product.name).offset(skip).limit(limit)
    result = await db.execute(query)
    items = list(result.scalars().unique().all())

    return items, total


async def get_product(db: AsyncSession, product_id: int) -> Optional[Product]:
    """Get a single product by ID."""
    query = select(Product).where(Product.id == product_id)
    result = await db.execute(query)
    return result.scalars().unique().first()


async def create_product(db: AsyncSession, data: ProductCreate) -> Product:
    """Create a new product."""
    product = Product(**data.model_dump(exclude_unset=True))
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return product


async def update_product(
    db: AsyncSession, product_id: int, data: ProductUpdate
) -> Optional[Product]:
    """Partial update of a product."""
    product = await get_product(db, product_id)
    if not product:
        return None

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: int) -> bool:
    """Soft delete — set is_active=False."""
    product = await get_product(db, product_id)
    if not product:
        return False

    product.is_active = False
    await db.flush()
    return True


async def adjust_stock(
    db: AsyncSession,
    product_id: int,
    quantity: int,
    reference: Optional[str] = None,
) -> Optional[Product]:
    """Adjust product stock by a signed quantity (positive=add, negative=remove)."""
    product = await get_product(db, product_id)
    if not product:
        return None

    product.current_stock = max(0, product.current_stock + quantity)
    await db.flush()
    await db.refresh(product)
    return product

"""Reports service: dashboard KPIs, price history list and CSV export."""

from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Brand, PriceChangeSource, PriceHistory, Product, Quote


async def get_dashboard(db: AsyncSession) -> Dict[str, Any]:
    """Dashboard KPIs: total products, total brands, recent price changes, recent quotes."""
    # Total products
    products_query = select(func.count()).select_from(Product).where(
        Product.is_active.is_(True)
    )
    products_result = await db.execute(products_query)
    total_products = products_result.scalar() or 0

    # Total brands
    brands_query = select(func.count()).select_from(Brand)
    brands_result = await db.execute(brands_query)
    total_brands = brands_result.scalar() or 0

    # Recent price changes (last 5)
    ph_query = (
        select(
            PriceHistory.id,
            Product.name.label("product_name"),
            PriceHistory.old_price,
            PriceHistory.new_price,
            PriceHistory.percentage,
            PriceHistory.source,
            PriceHistory.created_at,
        )
        .join(Product, PriceHistory.product_id == Product.id)
        .order_by(PriceHistory.created_at.desc())
        .limit(5)
    )
    ph_result = await db.execute(ph_query)
    recent_price_changes = [
        {
            "id": row.id,
            "product_name": row.product_name,
            "old_price": str(row.old_price),
            "new_price": str(row.new_price),
            "percentage": str(row.percentage) if row.percentage else None,
            "source": row.source.value if hasattr(row.source, "value") else str(row.source),
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in ph_result.all()
    ]

    # Recent quotes (last 5)
    q_query = (
        select(Quote)
        .order_by(Quote.created_at.desc())
        .limit(5)
    )
    q_result = await db.execute(q_query)
    recent_quotes = [
        {
            "id": q.id,
            "quote_number": q.quote_number,
            "client_name": q.client_name,
            "total": str(q.total),
            "status": q.status,
            "created_at": q.created_at.isoformat() if q.created_at else None,
        }
        for q in q_result.scalars().unique().all()
    ]

    return {
        "total_products": total_products,
        "total_brands": total_brands,
        "recent_price_changes": recent_price_changes,
        "recent_quotes": recent_quotes,
    }


async def get_price_history(
    db: AsyncSession,
    product_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    source: Optional[str] = None,
    skip: int = 0,
    limit: int = 50,
) -> tuple[List[Dict[str, Any]], int]:
    """Get filtered price history with product and brand names."""
    base_query = (
        select(
            PriceHistory.id,
            Product.name.label("product_name"),
            Brand.name.label("brand_name"),
            PriceHistory.old_price,
            PriceHistory.new_price,
            PriceHistory.percentage,
            PriceHistory.source,
            PriceHistory.reference,
            PriceHistory.created_at,
        )
        .join(Product, PriceHistory.product_id == Product.id)
        .join(Brand, Product.brand_id == Brand.id, isouter=True)
    )
    count_query = select(func.count()).select_from(PriceHistory)

    # Apply filters
    if product_id is not None:
        base_query = base_query.where(PriceHistory.product_id == product_id)
        count_query = count_query.where(PriceHistory.product_id == product_id)

    if brand_id is not None:
        base_query = base_query.where(Product.brand_id == brand_id)
        count_query = count_query.where(Product.brand_id == brand_id)

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            base_query = base_query.where(PriceHistory.created_at >= dt_from)
            count_query = count_query.where(PriceHistory.created_at >= dt_from)
        except ValueError:
            pass

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            base_query = base_query.where(PriceHistory.created_at <= dt_to)
            count_query = count_query.where(PriceHistory.created_at <= dt_to)
        except ValueError:
            pass

    if source:
        try:
            src_enum = PriceChangeSource(source)
            base_query = base_query.where(PriceHistory.source == src_enum)
            count_query = count_query.where(PriceHistory.source == src_enum)
        except ValueError:
            pass

    # Get total
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Get paginated items
    query = base_query.order_by(PriceHistory.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    rows = result.all()

    items = [
        {
            "id": row.id,
            "product_name": row.product_name,
            "brand_name": row.brand_name,
            "old_price": str(row.old_price),
            "new_price": str(row.new_price),
            "percentage": str(row.percentage) if row.percentage else None,
            "source": row.source.value if hasattr(row.source, "value") else str(row.source),
            "reference": row.reference,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]

    return items, total


async def get_price_history_csv(
    db: AsyncSession,
    product_id: Optional[int] = None,
    brand_id: Optional[int] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    source: Optional[str] = None,
) -> tuple[List[Dict[str, Any]], str]:
    """Get price history data for CSV export with date-stamped filename."""
    items, _ = await get_price_history(
        db,
        product_id=product_id,
        brand_id=brand_id,
        date_from=date_from,
        date_to=date_to,
        source=source,
        skip=0,
        limit=10000,
    )
    today = datetime.now().strftime("%Y-%m-%d")
    filename = f"historial_precios_{today}.csv"
    return items, filename

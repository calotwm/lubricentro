from datetime import datetime, timedelta
from decimal import Decimal
from typing import Any, Dict, List, Optional

from sqlalchemy import case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product, Sale, SaleItem, StockMovement
from app.schemas import BestSellerItem, DashboardResponse, ProfitMarginResponse


async def get_dashboard(db: AsyncSession) -> DashboardResponse:
    """Dashboard KPIs: inventory value, low stock, today/month sales."""
    # Total inventory value = SUM(cost_price * current_stock)
    inv_query = select(
        func.coalesce(
            func.sum(Product.cost_price * Product.current_stock), 0
        )
    ).where(Product.is_active.is_(True))
    inv_result = await db.execute(inv_query)
    total_inventory_value = inv_result.scalar() or Decimal("0")

    # Low stock count
    low_stock_query = select(func.count()).where(
        Product.is_active.is_(True),
        Product.current_stock <= Product.min_stock,
    )
    low_stock_result = await db.execute(low_stock_query)
    low_stock_count = low_stock_result.scalar() or 0

    # Low stock products
    low_products_query = select(Product).where(
        Product.is_active.is_(True),
        Product.current_stock <= Product.min_stock,
    ).order_by(Product.name)
    low_products_result = await db.execute(low_products_query)
    low_stock_products = list(low_products_result.scalars().unique().all())

    # Today sales total
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_query = select(func.coalesce(func.sum(Sale.total), 0)).where(
        Sale.created_at >= today_start
    )
    today_result = await db.execute(today_query)
    today_sales_total = today_result.scalar() or Decimal("0")

    # Month sales total (current month)
    month_start = today_start.replace(day=1)
    month_query = select(func.coalesce(func.sum(Sale.total), 0)).where(
        Sale.created_at >= month_start
    )
    month_result = await db.execute(month_query)
    month_sales_total = month_result.scalar() or Decimal("0")

    return DashboardResponse(
        total_inventory_value=total_inventory_value,
        low_stock_count=low_stock_count,
        today_sales_total=today_sales_total,
        month_sales_total=month_sales_total,
        low_stock_products=low_stock_products,
    )


async def get_best_sellers(
    db: AsyncSession, limit: int = 10
) -> List[BestSellerItem]:
    """Top-selling products by quantity."""
    query = (
        select(
            SaleItem.product_id,
            Product.name.label("product_name"),
            func.sum(SaleItem.quantity).label("total_quantity_sold"),
            func.sum(SaleItem.subtotal).label("total_revenue"),
        )
        .join(Product, SaleItem.product_id == Product.id)
        .group_by(SaleItem.product_id, Product.name)
        .order_by(func.sum(SaleItem.quantity).desc())
        .limit(limit)
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        BestSellerItem(
            product_id=row.product_id,
            product_name=row.product_name,
            total_quantity_sold=row.total_quantity_sold,
            total_revenue=row.total_revenue,
        )
        for row in rows
    ]


async def get_stock_movements_csv(db: AsyncSession) -> List[Dict[str, Any]]:
    """Return stock movements as list of dicts for CSV export."""
    query = (
        select(
            StockMovement.id,
            StockMovement.product_id,
            Product.name.label("product_name"),
            StockMovement.type,
            StockMovement.quantity,
            StockMovement.reference,
            StockMovement.notes,
            StockMovement.created_at,
        )
        .join(Product, StockMovement.product_id == Product.id)
        .order_by(StockMovement.created_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        {
            "id": row.id,
            "product_id": row.product_id,
            "product_name": row.product_name,
            "type": row.type.value if hasattr(row.type, "value") else str(row.type),
            "quantity": row.quantity,
            "reference": row.reference,
            "notes": row.notes,
            "created_at": row.created_at.isoformat() if row.created_at else None,
        }
        for row in rows
    ]


async def get_reorder_list(db: AsyncSession) -> List[Product]:
    """Products where current_stock <= min_stock."""
    query = select(Product).where(
        Product.is_active.is_(True),
        Product.current_stock <= Product.min_stock,
    ).order_by(Product.name)
    result = await db.execute(query)
    return list(result.scalars().unique().all())


async def get_profit_margin(db: AsyncSession) -> ProfitMarginResponse:
    """Calculate gross profit margin across all sale items."""
    query = select(
        func.coalesce(func.sum(SaleItem.subtotal), 0).label("total_revenue"),
        func.coalesce(
            func.sum(Product.cost_price * SaleItem.quantity), 0
        ).label("total_cost"),
    ).join(Product, SaleItem.product_id == Product.id)

    result = await db.execute(query)
    row = result.one()

    total_revenue = Decimal(row.total_revenue)
    total_cost = Decimal(row.total_cost)
    gross_profit = total_revenue - total_cost

    if total_revenue > 0:
        margin_percentage = ((gross_profit / total_revenue) * 100).quantize(
            Decimal("0.01")
        )
    else:
        margin_percentage = Decimal("0")

    return ProfitMarginResponse(
        total_revenue=total_revenue,
        total_cost=total_cost,
        gross_profit=gross_profit,
        margin_percentage=margin_percentage,
    )

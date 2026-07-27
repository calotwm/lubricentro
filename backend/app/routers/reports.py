from typing import List

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import csv
import io
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import BestSellerItem, DashboardResponse, ProfitMarginResponse, ProductRead
from app.services import reports as report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard", response_model=DashboardResponse)
async def dashboard(db: AsyncSession = Depends(get_db)):
    """Dashboard KPIs: inventory value, low stock, today/month sales."""
    return await report_service.get_dashboard(db)


@router.get("/best-sellers", response_model=List[BestSellerItem])
async def best_sellers(
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    """Top-selling products by quantity."""
    return await report_service.get_best_sellers(db, limit=limit)


@router.get("/stock-history")
async def stock_history(db: AsyncSession = Depends(get_db)):
    """Return stock movement history as JSON (for CSV export on frontend)."""
    return await report_service.get_stock_movements_csv(db)


@router.get("/stock-history/csv")
async def stock_history_csv(db: AsyncSession = Depends(get_db)):
    """Download stock movement history as CSV file."""
    rows = await report_service.get_stock_movements_csv(db)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["date", "product", "type", "quantity", "reference"])
    for row in rows:
        writer.writerow([
            row.get("created_at", ""),
            row.get("product_name", ""),
            row.get("type", ""),
            row.get("quantity", ""),
            row.get("reference", ""),
        ])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=stock_history.csv"},
    )


@router.get("/reorder-list", response_model=List[ProductRead])
async def reorder_list(db: AsyncSession = Depends(get_db)):
    """Products below minimum stock level."""
    return await report_service.get_reorder_list(db)


@router.get("/profit-margin", response_model=ProfitMarginResponse)
async def profit_margin(db: AsyncSession = Depends(get_db)):
    """Gross profit margin across all sales."""
    return await report_service.get_profit_margin(db)

"""Reports router: dashboard, price history list + CSV export."""

import csv
import io
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.security.auth import require_user
from app.services import reports as report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/dashboard")
async def dashboard(
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Dashboard KPIs: total products, total brands, recent price changes, recent quotes."""
    return await report_service.get_dashboard(db)


@router.get("/price-history")
async def price_history(
    product_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Get filtered price history."""
    items, total = await report_service.get_price_history(
        db,
        product_id=product_id,
        brand_id=brand_id,
        date_from=date_from,
        date_to=date_to,
        source=source,
        skip=skip,
        limit=limit,
    )
    return {"items": items, "total": total}


@router.get("/price-history/csv")
async def price_history_csv(
    product_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    date_from: Optional[str] = Query(None),
    date_to: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Download price history as CSV with date-stamped filename."""
    items, filename = await report_service.get_price_history_csv(
        db,
        product_id=product_id,
        brand_id=brand_id,
        date_from=date_from,
        date_to=date_to,
        source=source,
    )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "producto", "marca", "precio_anterior", "precio_nuevo",
        "porcentaje", "origen", "referencia", "fecha",
    ])
    for row in items:
        writer.writerow([
            row.get("product_name", ""),
            row.get("brand_name", ""),
            row.get("old_price", ""),
            row.get("new_price", ""),
            row.get("percentage", ""),
            row.get("source", ""),
            row.get("reference", ""),
            row.get("created_at", ""),
        ])
    output.seek(0)

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )

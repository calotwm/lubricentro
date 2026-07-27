from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import BulkPriceUpdate
from app.services import prices as price_service

router = APIRouter(prefix="/prices", tags=["prices"])


@router.put("/bulk")
async def bulk_price_update(
    data: BulkPriceUpdate,
    db: AsyncSession = Depends(get_db),
):
    """
    Bulk update selling prices by percentage.
    Must specify either brand_id or category_id (not both).
    Only selling_price is updated, never cost_price.
    """
    if data.brand_id is None and data.category_id is None:
        raise HTTPException(
            status_code=400,
            detail="Must specify either brand_id or category_id",
        )
    if data.brand_id is not None and data.category_id is not None:
        raise HTTPException(
            status_code=400,
            detail="Specify only one of brand_id or category_id, not both",
        )

    if data.brand_id is not None:
        count = await price_service.bulk_update_by_brand(db, data.brand_id, data.percentage)
    else:
        count = await price_service.bulk_update_by_category(db, data.category_id, data.percentage)

    return {"updated": count, "percentage": data.percentage}

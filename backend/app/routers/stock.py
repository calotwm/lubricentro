from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import StockMovementCreate, StockMovementRead, StockReceiveCreate
from app.services import stock as stock_service

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("/movements", response_model=List[StockMovementRead])
async def list_movements(
    product_id: Optional[int] = Query(None),
    type: Optional[str] = Query(None, description="Filter by ENTRY, EXIT, or ADJUSTMENT"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List stock movements with optional filters."""
    movements = await stock_service.get_movements(
        db, product_id=product_id, movement_type=type,
        skip=skip, limit=limit,
    )
    return movements


@router.post("/movements", response_model=StockMovementRead, status_code=201)
async def create_movement(
    data: StockMovementCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a stock movement (ENTRY/EXIT/ADJUSTMENT)."""
    try:
        movement = await stock_service.create_movement(db, data)
        return movement
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/receive", response_model=StockMovementRead, status_code=201)
async def receive_merchandise(
    data: StockReceiveCreate,
    db: AsyncSession = Depends(get_db),
):
    """Receive merchandise: creates ENTRY movement, increments stock, optionally updates cost_price."""
    try:
        movement = await stock_service.receive_merchandise(db, data)
        return movement
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

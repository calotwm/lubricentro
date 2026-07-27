from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import SaleCreate, SaleRead
from app.services import sales as sales_service

router = APIRouter(prefix="/sales", tags=["sales"])


@router.get("", response_model=List[SaleRead])
async def list_sales(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List sales with their items."""
    sales = await sales_service.get_sales(db, skip=skip, limit=limit)
    return sales


@router.get("/{sale_id}", response_model=SaleRead)
async def get_sale(
    sale_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single sale by ID."""
    sale = await sales_service.get_sale(db, sale_id)
    if not sale:
        raise HTTPException(status_code=404, detail="Sale not found")
    return sale


@router.post("", response_model=SaleRead, status_code=201)
async def create_sale(
    data: SaleCreate,
    db: AsyncSession = Depends(get_db),
):
    """
    Create a sale. Validates:
    - Cart is not empty (min 1 item)
    - All products exist and are active
    - Sufficient stock for each item
    Stock is decremented atomically.
    """
    try:
        sale = await sales_service.create_sale(db, data)
        return sale
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Brand
from app.schemas import BrandCreate, BrandRead
from app.security.auth import require_user

router = APIRouter(prefix="/brands", tags=["brands"])


@router.get("", response_model=List[BrandRead])
async def list_brands(
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """List all brands."""
    result = await db.execute(select(Brand).order_by(Brand.name))
    return list(result.scalars().unique().all())


@router.post("", response_model=BrandRead, status_code=201)
async def create_brand(
    data: BrandCreate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Create a new brand. Name must be unique."""
    existing = await db.execute(
        select(Brand).where(Brand.name == data.name)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=409,
            detail=f"Brand '{data.name}' already exists",
        )

    brand = Brand(name=data.name)
    db.add(brand)
    await db.flush()
    await db.refresh(brand)
    return brand

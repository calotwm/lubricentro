from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Category
from app.schemas import CategoryCreate, CategoryRead

router = APIRouter(prefix="/categories", tags=["categories"])


@router.get("", response_model=List[CategoryRead])
async def list_categories(
    db: AsyncSession = Depends(get_db),
):
    """List all categories."""
    result = await db.execute(select(Category).order_by(Category.name))
    return list(result.scalars().unique().all())


@router.post("", response_model=CategoryRead, status_code=201)
async def create_category(
    data: CategoryCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new category. Name must be unique."""
    # Check uniqueness
    existing = await db.execute(
        select(Category).where(Category.name == data.name)
    )
    if existing.scalars().first():
        raise HTTPException(
            status_code=409,
            detail=f"Category '{data.name}' already exists",
        )

    category = Category(name=data.name)
    db.add(category)
    await db.flush()
    await db.refresh(category)
    return category

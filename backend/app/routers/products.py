from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import ProductCreate, ProductList, ProductRead, ProductUpdate
from app.security.auth import require_user
from app.services import products as product_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=ProductList)
async def list_products(
    search: Optional[str] = Query(None, description="Search by name, brand, SKU, or spec"),
    category_id: Optional[int] = Query(None),
    brand_id: Optional[int] = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """List products with optional search and filters."""
    items, total = await product_service.get_products(
        db, search=search, category_id=category_id, brand_id=brand_id,
        skip=skip, limit=limit,
    )
    page = (skip // limit) + 1 if limit > 0 else 1
    return ProductList(items=items, total=total, page=page, page_size=limit)


@router.post("", response_model=ProductRead, status_code=201)
async def create_product(
    data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Create a new product."""
    product = await product_service.create_product(db, data)
    return product


@router.get("/{product_id}", response_model=ProductRead)
async def get_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Get a single product by ID."""
    product = await product_service.get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.put("/{product_id}", response_model=ProductRead)
async def update_product(
    product_id: int,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Update a product."""
    product = await product_service.update_product(db, product_id, data)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.delete("/{product_id}", status_code=204)
async def delete_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """Soft delete a product (set is_active=False)."""
    deleted = await product_service.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")

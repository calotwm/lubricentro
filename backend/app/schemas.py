from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel, ConfigDict, Field


# ── Category ──────────────────────────────────────────────────────────────────

class CategoryCreate(BaseModel):
    name: str = Field(..., max_length=100)


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime


# ── Brand ─────────────────────────────────────────────────────────────────────

class BrandCreate(BaseModel):
    name: str = Field(..., max_length=100)


class BrandRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    created_at: datetime


# ── Product ───────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    sku: Optional[str] = Field(None, max_length=50)
    name: str = Field(..., max_length=200)
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    specification: Optional[str] = None
    unit: str = Field("unit", max_length=20)
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    current_stock: int = 0
    min_stock: int = 0
    is_active: bool = True


class ProductUpdate(BaseModel):
    sku: Optional[str] = Field(None, max_length=50)
    name: Optional[str] = Field(None, max_length=200)
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    specification: Optional[str] = None
    unit: Optional[str] = Field(None, max_length=20)
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    current_stock: Optional[int] = None
    min_stock: Optional[int] = None
    is_active: Optional[bool] = None


class ProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: Optional[str] = None
    name: str
    category_id: Optional[int] = None
    brand_id: Optional[int] = None
    specification: Optional[str] = None
    unit: str
    cost_price: Optional[Decimal] = None
    selling_price: Optional[Decimal] = None
    current_stock: int
    min_stock: int
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryRead] = None
    brand: Optional[BrandRead] = None


class ProductList(BaseModel):
    items: List[ProductRead]
    total: int
    page: int
    page_size: int


# ── Stock Movement ────────────────────────────────────────────────────────────

class StockMovementCreate(BaseModel):
    product_id: int
    type: str = Field(..., pattern="^(ENTRY|EXIT|ADJUSTMENT)$")
    quantity: int = Field(..., gt=0)
    reference: Optional[str] = Field(None, max_length=200)
    notes: Optional[str] = None


class StockMovementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    type: str
    quantity: int
    reference: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime


class StockReceiveCreate(BaseModel):
    """Merchandise receiving: creates an ENTRY movement and optionally updates cost_price."""
    product_id: int
    quantity: int = Field(..., gt=0)
    cost_price: Optional[Decimal] = None
    reference: Optional[str] = Field(None, max_length=200, description="Invoice or supplier reference")
    notes: Optional[str] = None


# ── Sale ──────────────────────────────────────────────────────────────────────

class SaleItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class SaleCreate(BaseModel):
    items: List[SaleItemCreate] = Field(..., min_length=1)
    payment_method: str = Field(..., max_length=50)
    notes: Optional[str] = None


class SaleItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class SaleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    total: Decimal
    payment_method: str
    notes: Optional[str] = None
    created_at: datetime
    items: List[SaleItemRead]


# ── Bulk Price Update ─────────────────────────────────────────────────────────

class BulkPriceUpdate(BaseModel):
    brand_id: Optional[int] = None
    category_id: Optional[int] = None
    percentage: Decimal = Field(..., gt=0, description="Percentage increase (e.g. 10 for 10%)")


# ── Dashboard / Reports ───────────────────────────────────────────────────────

class BestSellerItem(BaseModel):
    product_id: int
    product_name: str
    total_quantity_sold: int
    total_revenue: Decimal


class DashboardResponse(BaseModel):
    total_inventory_value: Decimal
    low_stock_count: int
    today_sales_total: Decimal
    month_sales_total: Decimal
    low_stock_products: List[ProductRead]


class ProfitMarginResponse(BaseModel):
    total_revenue: Decimal
    total_cost: Decimal
    gross_profit: Decimal
    margin_percentage: Decimal


# ── Excel Import ──────────────────────────────────────────────────────────────

class ExcelImportResult(BaseModel):
    updated: int
    created: int
    skipped: int
    errors: List[str]

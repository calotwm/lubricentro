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


# ── Stock Movement (kept for model compat, removed from routers in Phase 2) ──

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


# ── Sale (kept for model compat, removed from routers in Phase 2) ─────────────

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
    note: Optional[str] = Field(None, max_length=200, description="Optional reason/note for the price change")


# ── Quote ─────────────────────────────────────────────────────────────────────

class QuoteItemCreate(BaseModel):
    product_id: Optional[int] = None
    description: str = Field("", max_length=200)
    quantity: int = Field(..., gt=0)
    unit_price: Decimal = Field(..., ge=0)


class QuoteCreate(BaseModel):
    client_name: str = Field(..., max_length=200)
    client_phone: Optional[str] = Field(None, max_length=50)
    items: List[QuoteItemCreate] = Field(..., min_length=1)


class QuoteUpdate(BaseModel):
    client_name: str = Field(..., max_length=200)
    client_phone: Optional[str] = Field(None, max_length=50)
    items: List[QuoteItemCreate] = Field(..., min_length=1)


class QuoteItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quote_id: int
    product_id: Optional[int] = None
    description: str
    quantity: int
    unit_price: Decimal
    subtotal: Decimal


class QuoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    quote_number: str
    client_name: str
    client_phone: Optional[str] = None
    status: str
    total: Decimal
    created_at: datetime
    items: List[QuoteItemRead] = []


class QuoteListResponse(BaseModel):
    items: List[QuoteRead]
    total: int
    page: int
    page_size: int


# ── Price History ─────────────────────────────────────────────────────────────

class PriceHistoryRead(BaseModel):
    id: int
    product_name: str
    brand_name: Optional[str] = None
    old_price: str
    new_price: str
    percentage: Optional[str] = None
    source: str
    reference: Optional[str] = None
    created_at: Optional[str] = None


class PriceHistoryFilter(BaseModel):
    product_id: Optional[int] = None
    brand_id: Optional[int] = None
    date_from: Optional[str] = None
    date_to: Optional[str] = None
    source: Optional[str] = None


class PriceHistoryListResponse(BaseModel):
    items: List[PriceHistoryRead]
    total: int


# ── Dashboard ─────────────────────────────────────────────────────────────────

class DashboardResponse(BaseModel):
    total_products: int
    total_brands: int
    recent_price_changes: List[dict]
    recent_quotes: List[dict]


# ── Excel Import ──────────────────────────────────────────────────────────────

class ExcelImportResult(BaseModel):
    updated: int
    created: int
    skipped: int
    errors: List[str]


# ── Auth ──────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    username: str
    password: str

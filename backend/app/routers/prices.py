from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import BulkPriceUpdate, ExcelImportResult
from app.security.auth import require_user
from app.services import prices as price_service

router = APIRouter(prefix="/prices", tags=["prices"])


@router.put("/bulk")
async def bulk_price_update(
    data: BulkPriceUpdate,
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
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
        count = await price_service.bulk_update_by_brand(db, data.brand_id, data.percentage, note=data.note)
    else:
        count = await price_service.bulk_update_by_category(db, data.category_id, data.percentage, note=data.note)

    return {"updated": count, "percentage": data.percentage}


@router.post("/import-excel", response_model=ExcelImportResult)
async def import_excel_prices(
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    _user: dict = Depends(require_user),
):
    """
    Import prices (and optionally new products) from an Excel (.xlsx) file.

    Columns recognised (case-insensitive):
      SKU/Codigo, Nombre/Name, Marca/Brand, Categoria/Category,
      Precio Costo/Costo/Cost, Precio Venta/Venta/Price

    Behaviour per row:
      - SKU matches existing product → update cost_price / selling_price
      - SKU not found (or no SKU column) → create new product using Nombre
    """
    if not file.filename or not file.filename.lower().endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Solo se aceptan archivos .xlsx")

    contents = await file.read()
    from app.services.excel_import import import_from_excel
    result = await import_from_excel(db, contents)
    return result

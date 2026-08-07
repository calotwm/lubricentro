"""Quotes router: CRUD + PDF endpoint."""

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas import QuoteCreate, QuoteListResponse, QuoteRead, QuoteUpdate
from app.services import quotes as quote_service

router = APIRouter(prefix="/quotes", tags=["quotes"])


@router.post("", response_model=QuoteRead, status_code=201)
async def create_quote(
    data: QuoteCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new quote with items."""
    quote = await quote_service.create_quote(db, data)
    return quote


@router.get("", response_model=QuoteListResponse)
async def list_quotes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
):
    """List quotes paginated."""
    items, total = await quote_service.list_quotes(db, skip=skip, limit=limit)
    page = (skip // limit) + 1 if limit > 0 else 1
    return QuoteListResponse(items=items, total=total, page=page, page_size=limit)


@router.get("/{quote_id}", response_model=QuoteRead)
async def get_quote(
    quote_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get a single quote with items."""
    quote = await quote_service.get_quote(db, quote_id)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.put("/{quote_id}", response_model=QuoteRead)
async def update_quote(
    quote_id: int,
    data: QuoteUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update an existing quote: client info + replace items, recompute total."""
    quote = await quote_service.update_quote(db, quote_id, data)
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    return quote


@router.delete("/{quote_id}", status_code=204)
async def delete_quote(
    quote_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Delete a quote and its items."""
    deleted = await quote_service.delete_quote(db, quote_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Quote not found")
    return None


@router.get("/{quote_id}/pdf")
async def get_quote_pdf(
    quote_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Download quote as PDF."""
    pdf_buffer = await quote_service.get_quote_pdf(db, quote_id)
    if not pdf_buffer:
        raise HTTPException(status_code=404, detail="Quote not found")

    quote = await quote_service.get_quote(db, quote_id)
    filename = f"presupuesto-{quote.quote_number}.pdf" if quote else "presupuesto.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename=\"{filename}\""},
    )

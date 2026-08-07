"""
Shared test fixtures for the Lubricentro API test suite.

Uses an in-memory SQLite database with StaticPool so all connections
share the same database. Tables are created once per session and data
is cleaned up after each test.
"""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.pool import StaticPool

from app.database import get_db
from app.main import app
from app.models import Base


# ---------------------------------------------------------------------------
# Pytest-asyncio configuration
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def anyio_backend():
    return "asyncio"


# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture(scope="session")
async def engine():
    """Create a test engine with in-memory SQLite (shared via StaticPool)."""
    test_engine = create_async_engine(
        "sqlite+aiosqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield test_engine
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session(engine):
    """Provide a clean async session for each test. Data is cleaned up after."""
    session_factory = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with session_factory() as session:
        yield session
        # Clean up: delete all rows in reverse dependency order
        for table in reversed(Base.metadata.sorted_tables):
            await session.execute(table.delete())
        await session.commit()


@pytest_asyncio.fixture
async def client(db_session):
    """Provide an async HTTP test client with overridden DB dependency."""

    async def override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

    app.dependency_overrides.clear()


# ---------------------------------------------------------------------------
# Helper fixtures — seed data
# ---------------------------------------------------------------------------

@pytest_asyncio.fixture
async def seed_category(db_session):
    """Create and return a test category."""
    from app.models import Category

    cat = Category(name="Aceites")
    db_session.add(cat)
    await db_session.flush()
    await db_session.refresh(cat)
    return cat


@pytest_asyncio.fixture
async def seed_brand(db_session):
    """Create and return a test brand."""
    from app.models import Brand

    brand = Brand(name="Motul")
    db_session.add(brand)
    await db_session.flush()
    await db_session.refresh(brand)
    return brand


@pytest_asyncio.fixture
async def seed_product(db_session, seed_category, seed_brand):
    """Create and return a test product with stock."""
    from decimal import Decimal
    from app.models import Product

    product = Product(
        name="Aceite 20W-50",
        sku="MOT-20W50",
        category_id=seed_category.id,
        brand_id=seed_brand.id,
        cost_price=Decimal("50.00"),
        selling_price=Decimal("100.00"),
        current_stock=20,
        min_stock=5,
        is_active=True,
    )
    db_session.add(product)
    await db_session.flush()
    await db_session.refresh(product)
    return product


@pytest_asyncio.fixture
async def seed_price_history(db_session, seed_product):
    """Create and return test price history rows."""
    from decimal import Decimal
    from app.models import PriceChangeSource, PriceHistory

    ph1 = PriceHistory(
        product_id=seed_product.id,
        old_price=Decimal("80.00"),
        new_price=Decimal("100.00"),
        percentage=Decimal("25.00"),
        source=PriceChangeSource.BULK,
        reference="Ajuste Q1",
    )
    ph2 = PriceHistory(
        product_id=seed_product.id,
        old_price=Decimal("100.00"),
        new_price=Decimal("110.00"),
        percentage=Decimal("10.00"),
        source=PriceChangeSource.MANUAL,
    )
    db_session.add_all([ph1, ph2])
    await db_session.flush()
    await db_session.refresh(ph1)
    await db_session.refresh(ph2)
    return [ph1, ph2]


@pytest_asyncio.fixture
async def seed_quote(db_session, seed_product):
    """Create and return a test quote with items."""
    from decimal import Decimal
    from app.models import Quote, QuoteItem

    quote = Quote(
        quote_number="PRES-2026-0001",
        client_name="Juan Perez",
        client_phone="1144445555",
        status="draft",
        total=Decimal("220.00"),
    )
    db_session.add(quote)
    await db_session.flush()

    item1 = QuoteItem(
        quote_id=quote.id,
        product_id=seed_product.id,
        description="Aceite 20W-50",
        quantity=2,
        unit_price=Decimal("100.00"),
        subtotal=Decimal("200.00"),
    )
    item2 = QuoteItem(
        quote_id=quote.id,
        product_id=None,
        description="Lubricante genérico",
        quantity=1,
        unit_price=Decimal("20.00"),
        subtotal=Decimal("20.00"),
    )
    db_session.add_all([item1, item2])
    await db_session.flush()
    await db_session.refresh(quote)
    return quote

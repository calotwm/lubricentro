"""add quotes and quote_items tables

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-08-07 15:01:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b2c3d4e5f6a7'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'quotes',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('quote_number', sa.String(length=20), nullable=False),
        sa.Column('client_name', sa.String(length=200), nullable=False),
        sa.Column('client_phone', sa.String(length=50), nullable=True),
        sa.Column('status', sa.String(length=20), server_default='draft', nullable=False),
        sa.Column('total', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('quote_number'),
    )
    op.create_index('ix_quotes_quote_number', 'quotes', ['quote_number'], unique=False)

    op.create_table(
        'quote_items',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('quote_id', sa.Integer(), nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=True),
        sa.Column('description', sa.String(length=200), nullable=False),
        sa.Column('quantity', sa.Integer(), nullable=False),
        sa.Column('unit_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('subtotal', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.ForeignKeyConstraint(['quote_id'], ['quotes.id']),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_quote_items_quote_id', 'quote_items', ['quote_id'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_quote_items_quote_id', table_name='quote_items')
    op.drop_table('quote_items')
    op.drop_index('ix_quotes_quote_number', table_name='quotes')
    op.drop_table('quotes')

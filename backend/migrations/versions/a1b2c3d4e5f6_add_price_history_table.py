"""add price_history table

Revision ID: a1b2c3d4e5f6
Revises: fe0ca5add9e5
Create Date: 2026-08-07 15:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = 'fe0ca5add9e5'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'price_history',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('product_id', sa.Integer(), nullable=False),
        sa.Column('old_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('new_price', sa.Numeric(precision=15, scale=2), nullable=False),
        sa.Column('percentage', sa.Numeric(precision=8, scale=2), nullable=True),
        sa.Column('source', sa.Enum('bulk', 'excel', 'manual', name='pricechangesource'), nullable=False),
        sa.Column('reference', sa.String(length=200), nullable=True),
        sa.Column('note', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.text('(CURRENT_TIMESTAMP)'), nullable=False),
        sa.ForeignKeyConstraint(['product_id'], ['products.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_price_history_product_id', 'price_history', ['product_id'], unique=False)
    op.create_index('ix_price_history_created_at', 'price_history', ['created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_price_history_created_at', table_name='price_history')
    op.drop_index('ix_price_history_product_id', table_name='price_history')
    op.drop_table('price_history')

"""make product internal code optional

Revision ID: 20260506_0003
Revises: 20260506_0002
Create Date: 2026-05-06 00:35:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260506_0003"
down_revision = "20260506_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "products",
        "internal_code",
        existing_type=sa.String(length=40),
        nullable=True,
    )


def downgrade() -> None:
    op.execute("UPDATE products SET internal_code = barcode WHERE internal_code IS NULL")
    op.alter_column(
        "products",
        "internal_code",
        existing_type=sa.String(length=40),
        nullable=False,
    )

"""add product unit of measure

Revision ID: 20260506_0002
Revises: 20260506_0001
Create Date: 2026-05-06 00:20:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260506_0002"
down_revision = "20260506_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "products",
        sa.Column("unit_of_measure", sa.String(length=20), nullable=False, server_default="unit"),
    )
    op.execute("UPDATE products SET unit_of_measure = 'unit' WHERE unit_of_measure IS NULL")
    op.alter_column("products", "unit_of_measure", server_default=None)


def downgrade() -> None:
    op.drop_column("products", "unit_of_measure")

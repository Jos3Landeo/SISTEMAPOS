"""company tax id

Revision ID: 20260509_0007
Revises: 20260509_0006
Create Date: 2026-05-09 02:45:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260509_0007"
down_revision = "20260509_0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("app_settings", sa.Column("company_tax_id", sa.String(length=20), server_default="", nullable=False))


def downgrade() -> None:
    op.drop_column("app_settings", "company_tax_id")

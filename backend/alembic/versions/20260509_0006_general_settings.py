"""general settings

Revision ID: 20260509_0006
Revises: 20260509_0005
Create Date: 2026-05-09 02:20:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa


revision = "20260509_0006"
down_revision = "20260509_0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("app_settings", sa.Column("company_name", sa.String(length=160), server_default="", nullable=False))
    op.add_column("app_settings", sa.Column("company_address", sa.String(length=255), server_default="", nullable=False))
    op.add_column("app_settings", sa.Column("company_phone", sa.String(length=60), server_default="", nullable=False))
    op.add_column("app_settings", sa.Column("company_email", sa.String(length=160), server_default="", nullable=False))
    op.add_column(
        "app_settings",
        sa.Column("ticket_footer_message", sa.String(length=255), server_default="", nullable=False),
    )


def downgrade() -> None:
    op.drop_column("app_settings", "ticket_footer_message")
    op.drop_column("app_settings", "company_email")
    op.drop_column("app_settings", "company_phone")
    op.drop_column("app_settings", "company_address")
    op.drop_column("app_settings", "company_name")

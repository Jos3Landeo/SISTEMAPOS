"""app settings

Revision ID: 20260509_0004
Revises: 20260506_0003
Create Date: 2026-05-09 00:10:00
"""

from __future__ import annotations

import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260509_0004"
down_revision = "20260506_0003"
branch_labels = None
depends_on = None


uuid_type = postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    op.create_table(
        "app_settings",
        sa.Column("settings_key", sa.String(length=40), nullable=False),
        sa.Column("scale_enabled", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.Column("scale_ean13_prefix", sa.String(length=3), server_default="20", nullable=False),
        sa.Column("scale_product_code_digits", sa.Integer(), server_default="5", nullable=False),
        sa.Column("scale_value_digits", sa.Integer(), server_default="5", nullable=False),
        sa.Column("scale_value_mode", sa.String(length=20), server_default="weight", nullable=False),
        sa.Column("scale_value_decimals", sa.Integer(), server_default="3", nullable=False),
        sa.Column("scale_lookup_field", sa.String(length=20), server_default="barcode", nullable=False),
        sa.Column("scale_lookup_format", sa.String(length=30), server_default="code_only", nullable=False),
        sa.Column("scale_lookup_prefix", sa.String(length=20), server_default="", nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_app_settings_settings_key"), "app_settings", ["settings_key"], unique=True)

    app_settings_table = sa.table(
        "app_settings",
        sa.column("id", uuid_type),
        sa.column("settings_key", sa.String),
    )
    op.bulk_insert(
        app_settings_table,
        [{"id": uuid.uuid4(), "settings_key": "default"}],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_app_settings_settings_key"), table_name="app_settings")
    op.drop_table("app_settings")

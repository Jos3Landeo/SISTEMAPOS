"""role permissions

Revision ID: 20260509_0005
Revises: 20260509_0004
Create Date: 2026-05-09 01:15:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260509_0005"
down_revision = "20260509_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "roles",
        sa.Column(
            "permissions",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )

    op.execute(
        """
        UPDATE roles
        SET permissions =
          CASE name
            WHEN 'admin' THEN '["pos.access","products.access","categories.access","inventory.access","reports.access","settings.access","cashiers.access"]'::jsonb
            WHEN 'manager' THEN '["pos.access","products.access","categories.access","inventory.access","reports.access"]'::jsonb
            WHEN 'cashier' THEN '["pos.access"]'::jsonb
            ELSE '[]'::jsonb
          END
        """
    )


def downgrade() -> None:
    op.drop_column("roles", "permissions")

"""cash movements

Revision ID: 20260509_0008
Revises: 20260509_0007
Create Date: 2026-05-09 05:10:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260509_0008"
down_revision = "20260509_0007"
branch_labels = None
depends_on = None


uuid_type = postgresql.UUID(as_uuid=True)
money = sa.Numeric(12, 2)


def upgrade() -> None:
    op.create_table(
        "cash_movements",
        sa.Column("cash_session_id", uuid_type, nullable=False),
        sa.Column("created_by_user_id", uuid_type, nullable=False),
        sa.Column("movement_type", sa.String(length=20), nullable=False),
        sa.Column("amount", money, nullable=False),
        sa.Column("reason", sa.String(length=160), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["cash_session_id"],
            ["cash_sessions.id"],
            name=op.f("fk_cash_movements_cash_session_id_cash_sessions"),
        ),
        sa.ForeignKeyConstraint(
            ["created_by_user_id"],
            ["users.id"],
            name=op.f("fk_cash_movements_created_by_user_id_users"),
        ),
    )
    op.create_index(op.f("ix_cash_movements_cash_session_id"), "cash_movements", ["cash_session_id"], unique=False)
    op.create_index(
        op.f("ix_cash_movements_created_by_user_id"),
        "cash_movements",
        ["created_by_user_id"],
        unique=False,
    )
    op.create_index(op.f("ix_cash_movements_movement_type"), "cash_movements", ["movement_type"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_cash_movements_movement_type"), table_name="cash_movements")
    op.drop_index(op.f("ix_cash_movements_created_by_user_id"), table_name="cash_movements")
    op.drop_index(op.f("ix_cash_movements_cash_session_id"), table_name="cash_movements")
    op.drop_table("cash_movements")

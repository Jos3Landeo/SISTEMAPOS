"""cash closures and supervision

Revision ID: 20260510_0010
Revises: 20260509_0009
Create Date: 2026-05-10 09:00:00
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260510_0010"
down_revision = "20260509_0009"
branch_labels = None
depends_on = None


uuid_type = postgresql.UUID(as_uuid=True)
money = sa.Numeric(12, 2)


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS pgcrypto")
    op.add_column("cash_sessions", sa.Column("closing_observation", sa.Text(), nullable=True))
    op.add_column("cash_sessions", sa.Column("closed_by_user_id", uuid_type, nullable=True))
    op.add_column("cash_sessions", sa.Column("supervised_by_user_id", uuid_type, nullable=True))
    op.create_foreign_key(
        op.f("fk_cash_sessions_closed_by_user_id_users"),
        "cash_sessions",
        "users",
        ["closed_by_user_id"],
        ["id"],
    )
    op.create_foreign_key(
        op.f("fk_cash_sessions_supervised_by_user_id_users"),
        "cash_sessions",
        "users",
        ["supervised_by_user_id"],
        ["id"],
    )
    op.create_index(op.f("ix_cash_sessions_closed_by_user_id"), "cash_sessions", ["closed_by_user_id"], unique=False)
    op.create_index(
        op.f("ix_cash_sessions_supervised_by_user_id"),
        "cash_sessions",
        ["supervised_by_user_id"],
        unique=False,
    )

    op.create_table(
        "cash_session_closures",
        sa.Column("cash_session_id", uuid_type, nullable=False),
        sa.Column("closed_by_user_id", uuid_type, nullable=False),
        sa.Column("supervised_by_user_id", uuid_type, nullable=True),
        sa.Column("expected_amount", money, nullable=False),
        sa.Column("counted_amount", money, nullable=False),
        sa.Column("difference_amount", money, nullable=False),
        sa.Column("observation", sa.Text(), nullable=True),
        sa.Column("reopened_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("reopened_by_user_id", uuid_type, nullable=True),
        sa.Column("reopen_reason", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["cash_session_id"], ["cash_sessions.id"], name=op.f("fk_cash_session_closures_cash_session_id_cash_sessions")),
        sa.ForeignKeyConstraint(["closed_by_user_id"], ["users.id"], name=op.f("fk_cash_session_closures_closed_by_user_id_users")),
        sa.ForeignKeyConstraint(["supervised_by_user_id"], ["users.id"], name=op.f("fk_cash_session_closures_supervised_by_user_id_users")),
        sa.ForeignKeyConstraint(["reopened_by_user_id"], ["users.id"], name=op.f("fk_cash_session_closures_reopened_by_user_id_users")),
    )
    op.create_index(op.f("ix_cash_session_closures_cash_session_id"), "cash_session_closures", ["cash_session_id"], unique=False)
    op.create_index(op.f("ix_cash_session_closures_closed_by_user_id"), "cash_session_closures", ["closed_by_user_id"], unique=False)
    op.create_index(op.f("ix_cash_session_closures_supervised_by_user_id"), "cash_session_closures", ["supervised_by_user_id"], unique=False)
    op.create_index(op.f("ix_cash_session_closures_reopened_by_user_id"), "cash_session_closures", ["reopened_by_user_id"], unique=False)

    op.create_table(
        "cash_session_closure_denominations",
        sa.Column("cash_session_closure_id", uuid_type, nullable=False),
        sa.Column("denomination_value", money, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("subtotal", money, nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["cash_session_closure_id"],
            ["cash_session_closures.id"],
            name=op.f("fk_cash_session_closure_denominations_cash_session_closure_id_cash_session_closures"),
        ),
    )
    op.create_index(
        op.f("ix_cash_session_closure_denominations_cash_session_closure_id"),
        "cash_session_closure_denominations",
        ["cash_session_closure_id"],
        unique=False,
    )

    op.execute(
        """
        UPDATE cash_sessions
        SET closed_by_user_id = opened_by_user_id
        WHERE status = 'closed' AND closed_by_user_id IS NULL
        """
    )

    op.execute(
        """
        INSERT INTO cash_session_closures (
            cash_session_id,
            closed_by_user_id,
            expected_amount,
            counted_amount,
            difference_amount,
            observation,
            id,
            created_at,
            updated_at
        )
        SELECT
            id,
            COALESCE(closed_by_user_id, opened_by_user_id),
            COALESCE(closing_amount, 0),
            COALESCE(counted_amount, 0),
            COALESCE(difference_amount, 0),
            closing_observation,
            gen_random_uuid(),
            updated_at,
            updated_at
        FROM cash_sessions
        WHERE status = 'closed'
        """
    )


def downgrade() -> None:
    op.drop_index(
        op.f("ix_cash_session_closure_denominations_cash_session_closure_id"),
        table_name="cash_session_closure_denominations",
    )
    op.drop_table("cash_session_closure_denominations")
    op.drop_index(op.f("ix_cash_session_closures_reopened_by_user_id"), table_name="cash_session_closures")
    op.drop_index(op.f("ix_cash_session_closures_supervised_by_user_id"), table_name="cash_session_closures")
    op.drop_index(op.f("ix_cash_session_closures_closed_by_user_id"), table_name="cash_session_closures")
    op.drop_index(op.f("ix_cash_session_closures_cash_session_id"), table_name="cash_session_closures")
    op.drop_table("cash_session_closures")
    op.drop_index(op.f("ix_cash_sessions_supervised_by_user_id"), table_name="cash_sessions")
    op.drop_index(op.f("ix_cash_sessions_closed_by_user_id"), table_name="cash_sessions")
    op.drop_constraint(op.f("fk_cash_sessions_supervised_by_user_id_users"), "cash_sessions", type_="foreignkey")
    op.drop_constraint(op.f("fk_cash_sessions_closed_by_user_id_users"), "cash_sessions", type_="foreignkey")
    op.drop_column("cash_sessions", "supervised_by_user_id")
    op.drop_column("cash_sessions", "closed_by_user_id")
    op.drop_column("cash_sessions", "closing_observation")

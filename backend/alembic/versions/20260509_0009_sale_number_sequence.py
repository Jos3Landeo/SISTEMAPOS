"""sequential sale numbers

Revision ID: 20260509_0009
Revises: 20260509_0008
Create Date: 2026-05-09 19:20:00
"""

from __future__ import annotations

from alembic import op


revision = "20260509_0009"
down_revision = "20260509_0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE SEQUENCE IF NOT EXISTS sale_number_seq
        INCREMENT BY 1
        MINVALUE 1
        START WITH 1
        CACHE 1
        """
    )

    op.execute(
        """
        WITH ordered_sales AS (
            SELECT
                id,
                LPAD(ROW_NUMBER() OVER (ORDER BY created_at, id)::text, 7, '0') AS new_sale_number
            FROM sales
        ),
        updated_sales AS (
            UPDATE sales
            SET sale_number = ordered_sales.new_sale_number
            FROM ordered_sales
            WHERE sales.id = ordered_sales.id
            RETURNING sales.id, sales.sale_number
        )
        UPDATE inventory_movements
        SET reference = updated_sales.sale_number
        FROM updated_sales
        WHERE inventory_movements.sale_id = updated_sales.id
        """
    )

    op.execute(
        """
        DO $$
        DECLARE
            last_sale_number bigint;
        BEGIN
            SELECT COALESCE(MAX(sale_number::bigint), 0)
            INTO last_sale_number
            FROM sales
            WHERE sale_number ~ '^[0-9]+$';

            IF last_sale_number > 0 THEN
                PERFORM setval('sale_number_seq', last_sale_number, true);
            ELSE
                PERFORM setval('sale_number_seq', 1, false);
            END IF;
        END $$;
        """
    )


def downgrade() -> None:
    op.execute("DROP SEQUENCE IF EXISTS sale_number_seq")

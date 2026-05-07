"""initial schema

Revision ID: 20260506_0001
Revises:
Create Date: 2026-05-06 00:00:01
"""

from __future__ import annotations

import uuid

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


revision = "20260506_0001"
down_revision = None
branch_labels = None
depends_on = None


uuid_type = postgresql.UUID(as_uuid=True)
money = sa.Numeric(12, 2)
quantity = sa.Numeric(12, 2)


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_roles_name"), "roles", ["name"], unique=True)

    op.create_table(
        "categories",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.create_index(op.f("ix_categories_name"), "categories", ["name"], unique=True)

    op.create_table(
        "cash_registers",
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("location", sa.String(length=120), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.create_index(op.f("ix_cash_registers_name"), "cash_registers", ["name"], unique=True)

    op.create_table(
        "payment_methods",
        sa.Column("name", sa.String(length=80), nullable=False),
        sa.Column("code", sa.String(length=30), nullable=False),
        sa.Column("requires_reference", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
    )
    op.create_index(op.f("ix_payment_methods_code"), "payment_methods", ["code"], unique=True)
    op.create_index(op.f("ix_payment_methods_name"), "payment_methods", ["name"], unique=True)

    op.create_table(
        "suppliers",
        sa.Column("name", sa.String(length=120), nullable=False),
        sa.Column("tax_id", sa.String(length=20), nullable=True),
        sa.Column("phone", sa.String(length=30), nullable=True),
        sa.Column("email", sa.String(length=120), nullable=True),
        sa.Column("address", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.UniqueConstraint("tax_id", name=op.f("uq_suppliers_tax_id")),
    )
    op.create_index(op.f("ix_suppliers_name"), "suppliers", ["name"], unique=True)

    op.create_table(
        "users",
        sa.Column("role_id", uuid_type, nullable=False),
        sa.Column("full_name", sa.String(length=120), nullable=False),
        sa.Column("username", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=120), nullable=True),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], name=op.f("fk_users_role_id_roles")),
        sa.UniqueConstraint("email", name=op.f("uq_users_email")),
    )
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)
    op.create_index(op.f("ix_users_role_id"), "users", ["role_id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)

    op.create_table(
        "products",
        sa.Column("category_id", uuid_type, nullable=True),
        sa.Column("barcode", sa.String(length=40), nullable=False),
        sa.Column("internal_code", sa.String(length=40), nullable=False),
        sa.Column("name", sa.String(length=160), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("sale_price", money, nullable=False),
        sa.Column("average_cost", money, nullable=False),
        sa.Column("stock_current", quantity, nullable=False),
        sa.Column("stock_minimum", quantity, nullable=False),
        sa.Column("allows_decimal", sa.Boolean(), server_default=sa.text("false"), nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], name=op.f("fk_products_category_id_categories")),
    )
    op.create_index(op.f("ix_products_barcode"), "products", ["barcode"], unique=True)
    op.create_index(op.f("ix_products_category_id"), "products", ["category_id"], unique=False)
    op.create_index(op.f("ix_products_internal_code"), "products", ["internal_code"], unique=True)
    op.create_index(op.f("ix_products_name"), "products", ["name"], unique=False)
    op.create_index("ix_products_name_trigram_like", "products", ["name"], unique=False)

    op.create_table(
        "cash_sessions",
        sa.Column("cash_register_id", uuid_type, nullable=False),
        sa.Column("opened_by_user_id", uuid_type, nullable=False),
        sa.Column("opening_amount", money, nullable=False),
        sa.Column("closing_amount", money, nullable=True),
        sa.Column("counted_amount", money, nullable=True),
        sa.Column("difference_amount", money, nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["cash_register_id"],
            ["cash_registers.id"],
            name=op.f("fk_cash_sessions_cash_register_id_cash_registers"),
        ),
        sa.ForeignKeyConstraint(["opened_by_user_id"], ["users.id"], name=op.f("fk_cash_sessions_opened_by_user_id_users")),
    )
    op.create_index(op.f("ix_cash_sessions_cash_register_id"), "cash_sessions", ["cash_register_id"], unique=False)
    op.create_index(op.f("ix_cash_sessions_opened_by_user_id"), "cash_sessions", ["opened_by_user_id"], unique=False)
    op.create_index(op.f("ix_cash_sessions_status"), "cash_sessions", ["status"], unique=False)

    op.create_table(
        "purchases",
        sa.Column("supplier_id", uuid_type, nullable=False),
        sa.Column("user_id", uuid_type, nullable=False),
        sa.Column("invoice_number", sa.String(length=60), nullable=True),
        sa.Column("subtotal", money, nullable=False),
        sa.Column("tax_amount", money, nullable=False),
        sa.Column("total", money, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["supplier_id"], ["suppliers.id"], name=op.f("fk_purchases_supplier_id_suppliers")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_purchases_user_id_users")),
    )
    op.create_index(op.f("ix_purchases_invoice_number"), "purchases", ["invoice_number"], unique=False)
    op.create_index(op.f("ix_purchases_supplier_id"), "purchases", ["supplier_id"], unique=False)
    op.create_index(op.f("ix_purchases_user_id"), "purchases", ["user_id"], unique=False)

    op.create_table(
        "sales",
        sa.Column("user_id", uuid_type, nullable=False),
        sa.Column("cash_session_id", uuid_type, nullable=True),
        sa.Column("sale_number", sa.String(length=40), nullable=False),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("subtotal", money, nullable=False),
        sa.Column("discount_amount", money, nullable=False),
        sa.Column("tax_amount", money, nullable=False),
        sa.Column("total", money, nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("cancellation_reason", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["cash_session_id"], ["cash_sessions.id"], name=op.f("fk_sales_cash_session_id_cash_sessions")),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_sales_user_id_users")),
    )
    op.create_index(op.f("ix_sales_cash_session_id"), "sales", ["cash_session_id"], unique=False)
    op.create_index(op.f("ix_sales_sale_number"), "sales", ["sale_number"], unique=True)
    op.create_index(op.f("ix_sales_status"), "sales", ["status"], unique=False)
    op.create_index(op.f("ix_sales_user_id"), "sales", ["user_id"], unique=False)

    op.create_table(
        "stock_adjustments",
        sa.Column("user_id", uuid_type, nullable=False),
        sa.Column("reason", sa.String(length=160), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("status", sa.String(length=20), nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], name=op.f("fk_stock_adjustments_user_id_users")),
    )
    op.create_index(op.f("ix_stock_adjustments_status"), "stock_adjustments", ["status"], unique=False)
    op.create_index(op.f("ix_stock_adjustments_user_id"), "stock_adjustments", ["user_id"], unique=False)

    op.create_table(
        "purchase_details",
        sa.Column("purchase_id", uuid_type, nullable=False),
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("quantity", quantity, nullable=False),
        sa.Column("unit_cost", money, nullable=False),
        sa.Column("line_total", money, nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name=op.f("fk_purchase_details_product_id_products")),
        sa.ForeignKeyConstraint(["purchase_id"], ["purchases.id"], name=op.f("fk_purchase_details_purchase_id_purchases")),
    )
    op.create_index(op.f("ix_purchase_details_product_id"), "purchase_details", ["product_id"], unique=False)
    op.create_index(op.f("ix_purchase_details_purchase_id"), "purchase_details", ["purchase_id"], unique=False)

    op.create_table(
        "sale_details",
        sa.Column("sale_id", uuid_type, nullable=False),
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("quantity", quantity, nullable=False),
        sa.Column("unit_price", money, nullable=False),
        sa.Column("discount_amount", money, nullable=False),
        sa.Column("tax_amount", money, nullable=False),
        sa.Column("line_total", money, nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name=op.f("fk_sale_details_product_id_products")),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], name=op.f("fk_sale_details_sale_id_sales")),
    )
    op.create_index(op.f("ix_sale_details_product_id"), "sale_details", ["product_id"], unique=False)
    op.create_index(op.f("ix_sale_details_sale_id"), "sale_details", ["sale_id"], unique=False)

    op.create_table(
        "sale_payments",
        sa.Column("sale_id", uuid_type, nullable=False),
        sa.Column("payment_method_id", uuid_type, nullable=False),
        sa.Column("amount", money, nullable=False),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["payment_method_id"], ["payment_methods.id"], name=op.f("fk_sale_payments_payment_method_id_payment_methods")),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], name=op.f("fk_sale_payments_sale_id_sales")),
    )
    op.create_index(op.f("ix_sale_payments_payment_method_id"), "sale_payments", ["payment_method_id"], unique=False)
    op.create_index(op.f("ix_sale_payments_sale_id"), "sale_payments", ["sale_id"], unique=False)

    op.create_table(
        "stock_adjustment_details",
        sa.Column("stock_adjustment_id", uuid_type, nullable=False),
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("quantity", quantity, nullable=False),
        sa.Column("previous_stock", quantity, nullable=False),
        sa.Column("new_stock", quantity, nullable=False),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name=op.f("fk_stock_adjustment_details_product_id_products"),
        ),
        sa.ForeignKeyConstraint(
            ["stock_adjustment_id"],
            ["stock_adjustments.id"],
            name=op.f("fk_stock_adjustment_details_stock_adjustment_id_stock_adjustments"),
        ),
    )
    op.create_index(op.f("ix_stock_adjustment_details_product_id"), "stock_adjustment_details", ["product_id"], unique=False)
    op.create_index(
        op.f("ix_stock_adjustment_details_stock_adjustment_id"),
        "stock_adjustment_details",
        ["stock_adjustment_id"],
        unique=False,
    )

    op.create_table(
        "inventory_movements",
        sa.Column("product_id", uuid_type, nullable=False),
        sa.Column("sale_id", uuid_type, nullable=True),
        sa.Column("purchase_id", uuid_type, nullable=True),
        sa.Column("stock_adjustment_id", uuid_type, nullable=True),
        sa.Column("movement_type", sa.String(length=30), nullable=False),
        sa.Column("quantity", quantity, nullable=False),
        sa.Column("previous_stock", quantity, nullable=False),
        sa.Column("new_stock", quantity, nullable=False),
        sa.Column("reference", sa.String(length=120), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column("id", uuid_type, primary_key=True, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["product_id"], ["products.id"], name=op.f("fk_inventory_movements_product_id_products")),
        sa.ForeignKeyConstraint(["purchase_id"], ["purchases.id"], name=op.f("fk_inventory_movements_purchase_id_purchases")),
        sa.ForeignKeyConstraint(["sale_id"], ["sales.id"], name=op.f("fk_inventory_movements_sale_id_sales")),
        sa.ForeignKeyConstraint(
            ["stock_adjustment_id"],
            ["stock_adjustments.id"],
            name=op.f("fk_inventory_movements_stock_adjustment_id_stock_adjustments"),
        ),
    )
    op.create_index(op.f("ix_inventory_movements_movement_type"), "inventory_movements", ["movement_type"], unique=False)
    op.create_index(op.f("ix_inventory_movements_product_id"), "inventory_movements", ["product_id"], unique=False)
    op.create_index(op.f("ix_inventory_movements_purchase_id"), "inventory_movements", ["purchase_id"], unique=False)
    op.create_index(op.f("ix_inventory_movements_sale_id"), "inventory_movements", ["sale_id"], unique=False)
    op.create_index(
        op.f("ix_inventory_movements_stock_adjustment_id"),
        "inventory_movements",
        ["stock_adjustment_id"],
        unique=False,
    )

    role_table = sa.table(
        "roles",
        sa.column("id", uuid_type),
        sa.column("name", sa.String),
        sa.column("description", sa.Text),
    )
    payment_method_table = sa.table(
        "payment_methods",
        sa.column("id", uuid_type),
        sa.column("name", sa.String),
        sa.column("code", sa.String),
        sa.column("requires_reference", sa.Boolean),
        sa.column("is_active", sa.Boolean),
    )

    op.bulk_insert(
        role_table,
        [
            {"id": uuid.uuid4(), "name": "admin", "description": "Administrador general"},
            {"id": uuid.uuid4(), "name": "manager", "description": "Gestion operativa"},
            {"id": uuid.uuid4(), "name": "cashier", "description": "Operacion de caja"},
        ],
    )
    op.bulk_insert(
        payment_method_table,
        [
            {"id": uuid.uuid4(), "name": "Efectivo", "code": "cash", "requires_reference": False, "is_active": True},
            {"id": uuid.uuid4(), "name": "Debito", "code": "debit", "requires_reference": True, "is_active": True},
            {"id": uuid.uuid4(), "name": "Credito", "code": "credit", "requires_reference": True, "is_active": True},
            {"id": uuid.uuid4(), "name": "Transferencia", "code": "transfer", "requires_reference": True, "is_active": True},
        ],
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_inventory_movements_stock_adjustment_id"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_sale_id"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_purchase_id"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_product_id"), table_name="inventory_movements")
    op.drop_index(op.f("ix_inventory_movements_movement_type"), table_name="inventory_movements")
    op.drop_table("inventory_movements")
    op.drop_index(op.f("ix_stock_adjustment_details_stock_adjustment_id"), table_name="stock_adjustment_details")
    op.drop_index(op.f("ix_stock_adjustment_details_product_id"), table_name="stock_adjustment_details")
    op.drop_table("stock_adjustment_details")
    op.drop_index(op.f("ix_sale_payments_sale_id"), table_name="sale_payments")
    op.drop_index(op.f("ix_sale_payments_payment_method_id"), table_name="sale_payments")
    op.drop_table("sale_payments")
    op.drop_index(op.f("ix_sale_details_sale_id"), table_name="sale_details")
    op.drop_index(op.f("ix_sale_details_product_id"), table_name="sale_details")
    op.drop_table("sale_details")
    op.drop_index(op.f("ix_purchase_details_purchase_id"), table_name="purchase_details")
    op.drop_index(op.f("ix_purchase_details_product_id"), table_name="purchase_details")
    op.drop_table("purchase_details")
    op.drop_index(op.f("ix_stock_adjustments_user_id"), table_name="stock_adjustments")
    op.drop_index(op.f("ix_stock_adjustments_status"), table_name="stock_adjustments")
    op.drop_table("stock_adjustments")
    op.drop_index(op.f("ix_sales_user_id"), table_name="sales")
    op.drop_index(op.f("ix_sales_status"), table_name="sales")
    op.drop_index(op.f("ix_sales_sale_number"), table_name="sales")
    op.drop_index(op.f("ix_sales_cash_session_id"), table_name="sales")
    op.drop_table("sales")
    op.drop_index(op.f("ix_purchases_user_id"), table_name="purchases")
    op.drop_index(op.f("ix_purchases_supplier_id"), table_name="purchases")
    op.drop_index(op.f("ix_purchases_invoice_number"), table_name="purchases")
    op.drop_table("purchases")
    op.drop_index(op.f("ix_cash_sessions_status"), table_name="cash_sessions")
    op.drop_index(op.f("ix_cash_sessions_opened_by_user_id"), table_name="cash_sessions")
    op.drop_index(op.f("ix_cash_sessions_cash_register_id"), table_name="cash_sessions")
    op.drop_table("cash_sessions")
    op.drop_index("ix_products_name_trigram_like", table_name="products")
    op.drop_index(op.f("ix_products_name"), table_name="products")
    op.drop_index(op.f("ix_products_internal_code"), table_name="products")
    op.drop_index(op.f("ix_products_category_id"), table_name="products")
    op.drop_index(op.f("ix_products_barcode"), table_name="products")
    op.drop_table("products")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_role_id"), table_name="users")
    op.drop_index(op.f("ix_users_email"), table_name="users")
    op.drop_table("users")
    op.drop_index(op.f("ix_suppliers_name"), table_name="suppliers")
    op.drop_table("suppliers")
    op.drop_index(op.f("ix_payment_methods_name"), table_name="payment_methods")
    op.drop_index(op.f("ix_payment_methods_code"), table_name="payment_methods")
    op.drop_table("payment_methods")
    op.drop_index(op.f("ix_cash_registers_name"), table_name="cash_registers")
    op.drop_table("cash_registers")
    op.drop_index(op.f("ix_categories_name"), table_name="categories")
    op.drop_table("categories")
    op.drop_index(op.f("ix_roles_name"), table_name="roles")
    op.drop_table("roles")

from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Index, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Money, Quantity, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class Category(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "categories"

    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    description: Mapped[str | None] = mapped_column(Text)

    products: Mapped[list["Product"]] = relationship(back_populates="category")


class Supplier(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "suppliers"

    name: Mapped[str] = mapped_column(String(120), nullable=False, unique=True, index=True)
    tax_id: Mapped[str | None] = mapped_column(String(20), unique=True)
    phone: Mapped[str | None] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(120))
    address: Mapped[str | None] = mapped_column(Text)

    purchases: Mapped[list["Purchase"]] = relationship(back_populates="supplier")


class Product(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "products"
    __table_args__ = (
        Index("ix_products_name_trigram_like", "name"),
    )

    category_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("categories.id"), index=True)
    barcode: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    internal_code: Mapped[str | None] = mapped_column(String(40), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text)
    unit_of_measure: Mapped[str] = mapped_column(String(20), nullable=False, default="unit", server_default="unit")
    sale_price: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    average_cost: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    stock_current: Mapped[Decimal] = mapped_column(Quantity, nullable=False, default=Decimal("0.00"))
    stock_minimum: Mapped[Decimal] = mapped_column(Quantity, nullable=False, default=Decimal("0.00"))
    allows_decimal: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")

    category: Mapped[Category | None] = relationship(back_populates="products")
    sale_details: Mapped[list["SaleDetail"]] = relationship(back_populates="product")
    purchase_details: Mapped[list["PurchaseDetail"]] = relationship(back_populates="product")
    inventory_movements: Mapped[list["InventoryMovement"]] = relationship(back_populates="product")
    adjustment_details: Mapped[list["StockAdjustmentDetail"]] = relationship(back_populates="product")

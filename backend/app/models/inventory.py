from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Quantity, TimestampMixin, UUIDPrimaryKeyMixin


class InventoryMovement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "inventory_movements"

    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    sale_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("sales.id"), index=True)
    purchase_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("purchases.id"), index=True)
    stock_adjustment_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stock_adjustments.id"),
        index=True,
    )
    movement_type: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    quantity: Mapped[Decimal] = mapped_column(Quantity, nullable=False)
    previous_stock: Mapped[Decimal] = mapped_column(Quantity, nullable=False)
    new_stock: Mapped[Decimal] = mapped_column(Quantity, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(120))
    notes: Mapped[str | None] = mapped_column(Text)

    product: Mapped["Product"] = relationship(back_populates="inventory_movements")
    sale: Mapped[Sale | None] = relationship(back_populates="inventory_movements")
    purchase: Mapped[Purchase | None] = relationship(back_populates="inventory_movements")
    stock_adjustment: Mapped[StockAdjustment | None] = relationship(back_populates="movements")


class StockAdjustment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "stock_adjustments"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    reason: Mapped[str] = mapped_column(String(160), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="applied", index=True)

    user: Mapped["User"] = relationship(back_populates="stock_adjustments")
    details: Mapped[list["StockAdjustmentDetail"]] = relationship(
        back_populates="stock_adjustment",
        cascade="all, delete-orphan",
    )
    movements: Mapped[list["InventoryMovement"]] = relationship(back_populates="stock_adjustment")


class StockAdjustmentDetail(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "stock_adjustment_details"

    stock_adjustment_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("stock_adjustments.id"),
        nullable=False,
        index=True,
    )
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[Decimal] = mapped_column(Quantity, nullable=False)
    previous_stock: Mapped[Decimal] = mapped_column(Quantity, nullable=False)
    new_stock: Mapped[Decimal] = mapped_column(Quantity, nullable=False)

    stock_adjustment: Mapped["StockAdjustment"] = relationship(back_populates="details")
    product: Mapped["Product"] = relationship(back_populates="adjustment_details")

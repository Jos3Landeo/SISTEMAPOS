from __future__ import annotations

from datetime import datetime
import uuid
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Money, Quantity, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class PaymentMethod(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "payment_methods"

    name: Mapped[str] = mapped_column(String(80), nullable=False, unique=True, index=True)
    code: Mapped[str] = mapped_column(String(30), nullable=False, unique=True, index=True)
    requires_reference: Mapped[bool] = mapped_column(nullable=False, default=False, server_default="false")

    sale_payments: Mapped[list["SalePayment"]] = relationship(back_populates="payment_method")


class Purchase(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "purchases"

    supplier_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("suppliers.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    invoice_number: Mapped[str | None] = mapped_column(String(60), index=True)
    subtotal: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    tax_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    total: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    notes: Mapped[str | None] = mapped_column(Text)

    supplier: Mapped["Supplier"] = relationship(back_populates="purchases")
    user: Mapped["User"] = relationship(back_populates="purchase_orders")
    details: Mapped[list["PurchaseDetail"]] = relationship(back_populates="purchase", cascade="all, delete-orphan")
    inventory_movements: Mapped[list["InventoryMovement"]] = relationship(back_populates="purchase")


class PurchaseDetail(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "purchase_details"

    purchase_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("purchases.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[Decimal] = mapped_column(Quantity, nullable=False)
    unit_cost: Mapped[Decimal] = mapped_column(Money, nullable=False)
    line_total: Mapped[Decimal] = mapped_column(Money, nullable=False)

    purchase: Mapped["Purchase"] = relationship(back_populates="details")
    product: Mapped["Product"] = relationship(back_populates="purchase_details")


class Sale(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sales"

    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    cash_session_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("cash_sessions.id"), index=True)
    sale_number: Mapped[str] = mapped_column(String(40), nullable=False, unique=True, index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="completed", index=True)
    subtotal: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    discount_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    tax_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    total: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    notes: Mapped[str | None] = mapped_column(Text)
    cancelled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    cancellation_reason: Mapped[str | None] = mapped_column(Text)

    user: Mapped["User"] = relationship(back_populates="sales")
    cash_session: Mapped[CashSession | None] = relationship(back_populates="sales")
    details: Mapped[list["SaleDetail"]] = relationship(back_populates="sale", cascade="all, delete-orphan")
    payments: Mapped[list["SalePayment"]] = relationship(back_populates="sale", cascade="all, delete-orphan")
    inventory_movements: Mapped[list["InventoryMovement"]] = relationship(back_populates="sale")


class SaleDetail(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sale_details"

    sale_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id"), nullable=False, index=True)
    quantity: Mapped[Decimal] = mapped_column(Quantity, nullable=False)
    unit_price: Mapped[Decimal] = mapped_column(Money, nullable=False)
    discount_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    tax_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    line_total: Mapped[Decimal] = mapped_column(Money, nullable=False)

    sale: Mapped["Sale"] = relationship(back_populates="details")
    product: Mapped["Product"] = relationship(back_populates="sale_details")


class SalePayment(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "sale_payments"

    sale_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sales.id"), nullable=False, index=True)
    payment_method_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("payment_methods.id"),
        nullable=False,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False)
    reference: Mapped[str | None] = mapped_column(String(120))

    sale: Mapped["Sale"] = relationship(back_populates="payments")
    payment_method: Mapped["PaymentMethod"] = relationship(back_populates="sale_payments")

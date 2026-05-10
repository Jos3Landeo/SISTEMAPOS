from __future__ import annotations

import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, Money, SoftDeleteMixin, TimestampMixin, UUIDPrimaryKeyMixin


class CashRegister(UUIDPrimaryKeyMixin, TimestampMixin, SoftDeleteMixin, Base):
    __tablename__ = "cash_registers"

    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)
    location: Mapped[str | None] = mapped_column(String(120))

    sessions: Mapped[list["CashSession"]] = relationship(back_populates="cash_register")


class CashSession(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cash_sessions"

    cash_register_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cash_registers.id"),
        nullable=False,
        index=True,
    )
    opened_by_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    opening_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    closing_amount: Mapped[Decimal | None] = mapped_column(Money)
    counted_amount: Mapped[Decimal | None] = mapped_column(Money)
    difference_amount: Mapped[Decimal | None] = mapped_column(Money)
    closing_observation: Mapped[str | None] = mapped_column(Text)
    closed_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    supervised_by_user_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open", index=True)

    cash_register: Mapped["CashRegister"] = relationship(back_populates="sessions")
    opened_by: Mapped["User"] = relationship(
        back_populates="cash_sessions",
        foreign_keys=[opened_by_user_id],
    )
    closed_by: Mapped["User | None"] = relationship(foreign_keys=[closed_by_user_id])
    supervised_by: Mapped["User | None"] = relationship(foreign_keys=[supervised_by_user_id])
    sales: Mapped[list["Sale"]] = relationship(back_populates="cash_session")
    movements: Mapped[list["CashMovement"]] = relationship(
        back_populates="cash_session",
        cascade="all, delete-orphan",
    )
    closures: Mapped[list["CashSessionClosure"]] = relationship(
        back_populates="cash_session",
        cascade="all, delete-orphan",
    )


class CashMovement(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cash_movements"

    cash_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cash_sessions.id"),
        nullable=False,
        index=True,
    )
    created_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    reason: Mapped[str] = mapped_column(String(160), nullable=False)
    notes: Mapped[str | None] = mapped_column(Text)

    cash_session: Mapped["CashSession"] = relationship(back_populates="movements")
    created_by: Mapped["User"] = relationship(back_populates="cash_movements")


class CashSessionClosure(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cash_session_closures"

    cash_session_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cash_sessions.id"),
        nullable=False,
        index=True,
    )
    closed_by_user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        nullable=False,
        index=True,
    )
    supervised_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
    )
    expected_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    counted_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    difference_amount: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    observation: Mapped[str | None] = mapped_column(Text)
    reopened_at: Mapped[datetime | None] = mapped_column()
    reopened_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id"),
        index=True,
    )
    reopen_reason: Mapped[str | None] = mapped_column(Text)

    cash_session: Mapped["CashSession"] = relationship(back_populates="closures")
    closed_by: Mapped["User"] = relationship(foreign_keys=[closed_by_user_id])
    supervised_by: Mapped["User | None"] = relationship(foreign_keys=[supervised_by_user_id])
    reopened_by: Mapped["User | None"] = relationship(foreign_keys=[reopened_by_user_id])
    denominations: Mapped[list["CashSessionClosureDenomination"]] = relationship(
        back_populates="closure",
        cascade="all, delete-orphan",
    )


class CashSessionClosureDenomination(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "cash_session_closure_denominations"

    cash_session_closure_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cash_session_closures.id"),
        nullable=False,
        index=True,
    )
    denomination_value: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))
    quantity: Mapped[int] = mapped_column(nullable=False, default=0)
    subtotal: Mapped[Decimal] = mapped_column(Money, nullable=False, default=Decimal("0.00"))

    closure: Mapped["CashSessionClosure"] = relationship(back_populates="denominations")

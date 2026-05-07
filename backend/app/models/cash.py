from __future__ import annotations

import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, String
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
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="open", index=True)

    cash_register: Mapped["CashRegister"] = relationship(back_populates="sessions")
    opened_by: Mapped["User"] = relationship(back_populates="cash_sessions")
    sales: Mapped[list["Sale"]] = relationship(back_populates="cash_session")

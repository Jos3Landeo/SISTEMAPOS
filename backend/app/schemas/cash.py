from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import SoftDeleteSchema, TimestampedSchema


class CashRegisterCreate(BaseModel):
    name: str = Field(min_length=2, max_length=100)
    location: str | None = Field(default=None, max_length=120)


class CashRegisterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=100)
    location: str | None = Field(default=None, max_length=120)
    is_active: bool | None = None


class CashRegisterRead(SoftDeleteSchema):
    name: str
    location: str | None = None


class CashSessionOpen(BaseModel):
    cash_register_id: UUID
    opening_amount: Decimal = Decimal("0.00")


class CashSessionClose(BaseModel):
    counted_amount: Decimal
    closing_amount: Decimal


class CashSessionRead(TimestampedSchema):
    cash_register_id: UUID
    opened_by_user_id: UUID
    opening_amount: Decimal
    closing_amount: Decimal | None = None
    counted_amount: Decimal | None = None
    difference_amount: Decimal | None = None
    status: str


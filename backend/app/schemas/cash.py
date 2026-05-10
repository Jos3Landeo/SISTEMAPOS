from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import SoftDeleteSchema, TimestampedSchema
from app.schemas.user import UserRead


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


class CashReasonCatalogRead(BaseModel):
    reason_type: str
    code: str
    label: str
    description: str
    requires_notes: bool


class CashSessionCloseDenomination(BaseModel):
    denomination_value: Decimal = Field(gt=0)
    quantity: int = Field(ge=0)


class CashSessionClose(BaseModel):
    counted_amount: Decimal = Field(gt=0)
    denominations: list[CashSessionCloseDenomination] = Field(default_factory=list)
    observation: str | None = Field(default=None, max_length=500)
    supervisor_username: str | None = Field(default=None, min_length=3, max_length=50)
    supervisor_password: str | None = Field(default=None, min_length=8, max_length=128)


class CashSessionReopen(BaseModel):
    reason_code: str = Field(min_length=2, max_length=60)
    notes: str | None = Field(default=None, max_length=500)


class CashMovementCreate(BaseModel):
    movement_type: Literal["income", "withdrawal"]
    amount: Decimal = Field(gt=0)
    reason_code: str = Field(min_length=2, max_length=60)
    notes: str | None = Field(default=None, max_length=500)


class CashMovementRead(TimestampedSchema):
    cash_session_id: UUID
    created_by_user_id: UUID
    movement_type: str
    amount: Decimal
    reason: str
    notes: str | None = None
    created_by: UserRead


class CashSessionClosureDenominationRead(TimestampedSchema):
    cash_session_closure_id: UUID
    denomination_value: Decimal
    quantity: int
    subtotal: Decimal


class CashSessionClosureRead(TimestampedSchema):
    cash_session_id: UUID
    closed_by_user_id: UUID
    supervised_by_user_id: UUID | None = None
    expected_amount: Decimal
    counted_amount: Decimal
    difference_amount: Decimal
    observation: str | None = None
    reopened_at: datetime | None = None
    reopened_by_user_id: UUID | None = None
    reopen_reason: str | None = None
    closed_by: UserRead
    supervised_by: UserRead | None = None
    reopened_by: UserRead | None = None
    denominations: list[CashSessionClosureDenominationRead] = Field(default_factory=list)
    cash_register_name: str
    opened_by_name: str
    opened_at: datetime
    session_status: str


class CashSessionMetricsRead(BaseModel):
    sales_count: int
    completed_sales_count: int
    cancelled_sales_count: int
    total_sales_amount: Decimal
    cash_sales_amount: Decimal
    manual_income_amount: Decimal
    manual_withdrawal_amount: Decimal
    expected_cash_amount: Decimal


class CashSessionRead(TimestampedSchema):
    cash_register_id: UUID
    opened_by_user_id: UUID
    opening_amount: Decimal
    closing_amount: Decimal | None = None
    counted_amount: Decimal | None = None
    difference_amount: Decimal | None = None
    closing_observation: str | None = None
    status: str
    cash_register: CashRegisterRead
    opened_by: UserRead
    closed_by: UserRead | None = None
    supervised_by: UserRead | None = None
    movements: list[CashMovementRead] = Field(default_factory=list)


class CashSessionSummaryRead(CashSessionRead):
    metrics: CashSessionMetricsRead

from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedSchema
from app.schemas.payment_method import PaymentMethodRead
from app.schemas.product import ProductRead


class SaleDetailCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=0)
    unit_price: Decimal = Field(ge=0)
    discount_amount: Decimal = Decimal("0.00")
    tax_amount: Decimal = Decimal("0.00")


class SalePaymentCreate(BaseModel):
    payment_method_id: UUID
    amount: Decimal = Field(gt=0)
    reference: str | None = None


class SaleCreate(BaseModel):
    cash_session_id: UUID | None = None
    notes: str | None = None
    details: list[SaleDetailCreate]
    payments: list[SalePaymentCreate]


class SaleCancellationRequest(BaseModel):
    reason: str = Field(min_length=5, max_length=300)


class SaleDetailRead(TimestampedSchema):
    product_id: UUID
    quantity: Decimal
    unit_price: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    line_total: Decimal
    product: ProductRead


class SalePaymentRead(TimestampedSchema):
    payment_method_id: UUID
    amount: Decimal
    reference: str | None = None
    payment_method: PaymentMethodRead


class SaleRead(TimestampedSchema):
    user_id: UUID
    cash_session_id: UUID | None = None
    sale_number: str
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total: Decimal
    notes: str | None = None
    cancelled_at: datetime | None = None
    cancellation_reason: str | None = None
    details: list[SaleDetailRead]
    payments: list[SalePaymentRead]


class SaleListItem(BaseModel):
    id: UUID
    sale_number: str
    status: str
    created_at: datetime
    total: Decimal

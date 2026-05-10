from __future__ import annotations

from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedSchema
from app.schemas.product import ProductRead
from app.schemas.supplier import SupplierRead
from app.schemas.user import UserRead


class PurchaseDetailCreate(BaseModel):
    product_id: UUID
    quantity: Decimal = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)


class PurchaseCreate(BaseModel):
    supplier_id: UUID
    invoice_number: str | None = Field(default=None, max_length=60)
    tax_amount: Decimal = Field(default=Decimal("0.00"), ge=0)
    notes: str | None = None
    details: list[PurchaseDetailCreate] = Field(min_length=1)


class PurchaseDetailRead(TimestampedSchema):
    product_id: UUID
    quantity: Decimal
    unit_cost: Decimal
    line_total: Decimal
    product: ProductRead


class PurchaseRead(TimestampedSchema):
    supplier_id: UUID
    user_id: UUID
    invoice_number: str | None = None
    subtotal: Decimal
    tax_amount: Decimal
    total: Decimal
    notes: str | None = None
    supplier: SupplierRead
    user: UserRead
    details: list[PurchaseDetailRead]

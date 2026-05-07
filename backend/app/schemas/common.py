from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class TimestampedSchema(ORMModel):
    id: UUID
    created_at: datetime
    updated_at: datetime


class SoftDeleteSchema(TimestampedSchema):
    is_active: bool


class MoneySummary(BaseModel):
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    total: Decimal


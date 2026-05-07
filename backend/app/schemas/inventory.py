from datetime import datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.common import TimestampedSchema
from app.schemas.product import ProductRead


class InventoryMovementRead(TimestampedSchema):
    product_id: UUID
    sale_id: UUID | None = None
    purchase_id: UUID | None = None
    stock_adjustment_id: UUID | None = None
    movement_type: str
    quantity: Decimal
    previous_stock: Decimal
    new_stock: Decimal
    reference: str | None = None
    notes: str | None = None
    product: ProductRead


class StockAdjustmentLineCreate(BaseModel):
    product_id: UUID
    quantity: Decimal


class StockAdjustmentCreate(BaseModel):
    reason: str = Field(min_length=3, max_length=160)
    notes: str | None = None
    details: list[StockAdjustmentLineCreate]


class StockAdjustmentDetailRead(TimestampedSchema):
    product_id: UUID
    quantity: Decimal
    previous_stock: Decimal
    new_stock: Decimal
    product: ProductRead


class StockAdjustmentRead(TimestampedSchema):
    user_id: UUID
    reason: str
    notes: str | None = None
    status: str
    details: list[StockAdjustmentDetailRead]


from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.schemas.category import CategoryRead
from app.schemas.common import SoftDeleteSchema


class ProductCreate(BaseModel):
    category_id: UUID | None = None
    barcode: str = Field(min_length=3, max_length=40)
    internal_code: str = Field(min_length=2, max_length=40)
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None
    sale_price: Decimal
    average_cost: Decimal = Decimal("0.00")
    stock_current: Decimal = Decimal("0.00")
    stock_minimum: Decimal = Decimal("0.00")
    allows_decimal: bool = False


class ProductUpdate(BaseModel):
    category_id: UUID | None = None
    barcode: str | None = Field(default=None, min_length=3, max_length=40)
    internal_code: str | None = Field(default=None, min_length=2, max_length=40)
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = None
    sale_price: Decimal | None = None
    average_cost: Decimal | None = None
    stock_minimum: Decimal | None = None
    allows_decimal: bool | None = None
    is_active: bool | None = None


class ProductRead(SoftDeleteSchema):
    category_id: UUID | None = None
    barcode: str
    internal_code: str
    name: str
    description: str | None = None
    sale_price: Decimal
    average_cost: Decimal
    stock_current: Decimal
    stock_minimum: Decimal
    allows_decimal: bool
    category: CategoryRead | None = None


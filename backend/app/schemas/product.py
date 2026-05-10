from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field, field_validator

from app.core.constants import PRODUCT_UNIT_VALUES
from app.schemas.category import CategoryRead
from app.schemas.common import SoftDeleteSchema

ProductUnit = Literal["unit", "kg", "g", "l"]


class ProductCreate(BaseModel):
    category_id: UUID | None = None
    barcode: str = Field(min_length=1, max_length=40)
    internal_code: str | None = Field(default=None, max_length=40)
    name: str = Field(min_length=2, max_length=160)
    description: str | None = None
    unit_of_measure: ProductUnit = "unit"
    sale_price: Decimal
    average_cost: Decimal = Decimal("0.00")
    stock_current: Decimal = Decimal("0.00")
    stock_minimum: Decimal = Decimal("0.00")
    allows_decimal: bool = False

    @field_validator("unit_of_measure")
    @classmethod
    def validate_unit(cls, value: str) -> str:
        if value not in PRODUCT_UNIT_VALUES:
            raise ValueError("Unidad de medida invalida")
        return value

    @field_validator("allows_decimal")
    @classmethod
    def validate_decimal_sales(cls, value: bool, info):
        unit_of_measure = info.data.get("unit_of_measure")
        if unit_of_measure in {"kg", "g", "l"} and not value:
            raise ValueError("La unidad seleccionada requiere cantidades decimales")
        return value

    @field_validator("internal_code", mode="before")
    @classmethod
    def normalize_internal_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ProductUpdate(BaseModel):
    category_id: UUID | None = None
    barcode: str | None = Field(default=None, min_length=1, max_length=40)
    internal_code: str | None = Field(default=None, max_length=40)
    name: str | None = Field(default=None, min_length=2, max_length=160)
    description: str | None = None
    unit_of_measure: ProductUnit | None = None
    sale_price: Decimal | None = None
    average_cost: Decimal | None = None
    stock_minimum: Decimal | None = None
    allows_decimal: bool | None = None
    is_active: bool | None = None

    @field_validator("unit_of_measure")
    @classmethod
    def validate_update_unit(cls, value: str | None) -> str | None:
        if value is None:
            return value
        if value not in PRODUCT_UNIT_VALUES:
            raise ValueError("Unidad de medida invalida")
        return value

    @field_validator("internal_code", mode="before")
    @classmethod
    def normalize_update_internal_code(cls, value: str | None) -> str | None:
        if value is None:
            return None
        value = value.strip()
        return value or None


class ProductRead(SoftDeleteSchema):
    category_id: UUID | None = None
    barcode: str
    internal_code: str | None = None
    name: str
    description: str | None = None
    unit_of_measure: ProductUnit
    sale_price: Decimal
    average_cost: Decimal
    stock_current: Decimal
    stock_minimum: Decimal
    allows_decimal: bool
    category: CategoryRead | None = None

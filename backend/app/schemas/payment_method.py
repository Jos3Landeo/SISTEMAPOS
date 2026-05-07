from pydantic import BaseModel, Field

from app.schemas.common import SoftDeleteSchema


class PaymentMethodCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    code: str = Field(min_length=2, max_length=30)
    requires_reference: bool = False


class PaymentMethodUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=80)
    code: str | None = Field(default=None, min_length=2, max_length=30)
    requires_reference: bool | None = None
    is_active: bool | None = None


class PaymentMethodRead(SoftDeleteSchema):
    name: str
    code: str
    requires_reference: bool


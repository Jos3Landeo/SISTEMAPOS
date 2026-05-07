from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import SoftDeleteSchema


class SupplierCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    tax_id: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    address: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    tax_id: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=30)
    email: EmailStr | None = None
    address: str | None = None
    is_active: bool | None = None


class SupplierRead(SoftDeleteSchema):
    name: str
    tax_id: str | None = None
    phone: str | None = None
    email: EmailStr | None = None
    address: str | None = None


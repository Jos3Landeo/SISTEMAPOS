from pydantic import BaseModel, Field

from app.schemas.common import SoftDeleteSchema


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    description: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = None
    is_active: bool | None = None


class CategoryRead(SoftDeleteSchema):
    name: str
    description: str | None = None


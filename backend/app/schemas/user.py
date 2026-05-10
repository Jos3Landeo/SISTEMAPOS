from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.schemas.common import SoftDeleteSchema
from app.schemas.role import RoleRead


class UserCreate(BaseModel):
    role_id: UUID
    full_name: str = Field(min_length=3, max_length=120)
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)


class UserUpdate(BaseModel):
    role_id: UUID | None = None
    full_name: str | None = Field(default=None, min_length=3, max_length=120)
    username: str | None = Field(default=None, min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    is_active: bool | None = None


class UserRead(SoftDeleteSchema):
    full_name: str
    username: str
    email: EmailStr | None = None
    role: RoleRead

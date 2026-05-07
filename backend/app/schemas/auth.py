from pydantic import BaseModel, EmailStr, Field

from app.schemas.user import UserRead


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead


class LoginRequest(BaseModel):
    username: str
    password: str


class BootstrapAdminRequest(BaseModel):
    full_name: str = Field(min_length=3, max_length=120)
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr | None = None
    password: str = Field(min_length=8, max_length=128)


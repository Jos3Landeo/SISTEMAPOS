from pydantic import BaseModel, Field

from app.schemas.common import TimestampedSchema


class RoleCreate(BaseModel):
    name: str = Field(min_length=2, max_length=80)
    description: str | None = None


class RoleRead(TimestampedSchema):
    name: str
    description: str | None = None


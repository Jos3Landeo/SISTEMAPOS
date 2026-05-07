from typing import Any, Generic, TypeVar

from sqlalchemy import Select, select
from sqlalchemy.orm import Session

from app.db.base import Base


ModelT = TypeVar("ModelT", bound=Base)


class BaseRepository(Generic[ModelT]):
    def __init__(self, db: Session, model: type[ModelT]) -> None:
        self.db = db
        self.model = model

    def get_by_id(self, entity_id: Any) -> ModelT | None:
        return self.db.get(self.model, entity_id)

    def list(self) -> list[ModelT]:
        stmt: Select[tuple[ModelT]] = select(self.model).order_by(self.model.created_at.desc())
        return list(self.db.scalars(stmt).all())

    def create(self, data: dict[str, Any]) -> ModelT:
        entity = self.model(**data)
        self.db.add(entity)
        self.db.flush()
        self.db.refresh(entity)
        return entity

    def update(self, entity: ModelT, data: dict[str, Any]) -> ModelT:
        for key, value in data.items():
            setattr(entity, key, value)
        self.db.flush()
        self.db.refresh(entity)
        return entity


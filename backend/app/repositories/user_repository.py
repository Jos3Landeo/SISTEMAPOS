from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.user import Role, User
from app.repositories.base import BaseRepository


class RoleRepository(BaseRepository[Role]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Role)

    def get_by_name(self, name: str) -> Role | None:
        return self.db.scalar(select(Role).where(Role.name == name))

    def list(self) -> list[Role]:
        stmt = select(Role).order_by(Role.name.asc())
        return list(self.db.scalars(stmt).all())


class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, User)

    def get_by_id(self, entity_id: str) -> User | None:
        stmt = select(User).options(joinedload(User.role)).where(User.id == entity_id)
        return self.db.scalar(stmt)

    def get_by_username(self, username: str) -> User | None:
        stmt = select(User).options(joinedload(User.role)).where(User.username == username)
        return self.db.scalar(stmt)

    def get_by_email(self, email: str) -> User | None:
        stmt = select(User).options(joinedload(User.role)).where(User.email == email)
        return self.db.scalar(stmt)

    def list(self) -> list[User]:
        stmt = select(User).options(joinedload(User.role)).order_by(User.created_at.desc())
        return list(self.db.scalars(stmt).unique().all())

    def has_users(self) -> bool:
        return self.db.scalar(select(User.id).limit(1)) is not None

from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import get_password_hash
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)

    def list_users(self):
        return self.users.list()

    def create_user(self, payload: UserCreate):
        role = self.roles.get_by_id(payload.role_id)
        if not role:
            raise AppError("Rol no encontrado", status.HTTP_404_NOT_FOUND)
        if self.users.get_by_username(payload.username):
            raise AppError("El nombre de usuario ya existe", status.HTTP_409_CONFLICT)
        if payload.email and self.users.get_by_email(payload.email):
            raise AppError("El correo ya existe", status.HTTP_409_CONFLICT)

        user = self.users.create(
            {
                "role_id": payload.role_id,
                "full_name": payload.full_name,
                "username": payload.username,
                "email": payload.email,
                "password_hash": get_password_hash(payload.password),
            }
        )
        self.db.commit()
        return self.users.get_by_id(str(user.id)) or user

    def update_user(self, user_id: str, payload: UserUpdate):
        user = self.users.get_by_id(user_id)
        if not user:
            raise AppError("Usuario no encontrado", status.HTTP_404_NOT_FOUND)

        data = payload.model_dump(exclude_unset=True)
        if "password" in data:
            data["password_hash"] = get_password_hash(data.pop("password"))
        if "role_id" in data and data["role_id"]:
            role = self.roles.get_by_id(data["role_id"])
            if not role:
                raise AppError("Rol no encontrado", status.HTTP_404_NOT_FOUND)
        if "username" in data and data["username"]:
            existing_user = self.users.get_by_username(data["username"])
            if existing_user and str(existing_user.id) != user_id:
                raise AppError("El nombre de usuario ya existe", status.HTTP_409_CONFLICT)
        if "email" in data and data["email"]:
            existing_user = self.users.get_by_email(data["email"])
            if existing_user:
                if str(existing_user.id) != user_id:
                    raise AppError("El correo ya existe", status.HTTP_409_CONFLICT)

        updated = self.users.update(user, data)
        self.db.commit()
        return self.users.get_by_id(str(updated.id)) or updated

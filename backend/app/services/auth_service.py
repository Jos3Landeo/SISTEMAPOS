from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.core.security import create_access_token, get_password_hash, verify_password
from app.models.user import User
from app.repositories.user_repository import RoleRepository, UserRepository
from app.schemas.auth import BootstrapAdminRequest, LoginRequest


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)

    def bootstrap_admin(self, payload: BootstrapAdminRequest) -> User:
        if self.users.has_users():
            raise AppError("El bootstrap inicial ya fue ejecutado", status.HTTP_409_CONFLICT)

        admin_role = self.roles.get_by_name("admin")
        if not admin_role:
            admin_role = self.roles.create({"name": "admin", "description": "Administrador general"})
            self.roles.create({"name": "cashier", "description": "Operacion de caja"})
            self.roles.create({"name": "manager", "description": "Gestion operativa"})

        user = self.users.create(
            {
                "role_id": admin_role.id,
                "full_name": payload.full_name,
                "username": payload.username,
                "email": payload.email,
                "password_hash": get_password_hash(payload.password),
            }
        )
        self.db.commit()
        return self.users.get_by_id(str(user.id)) or user

    def login(self, payload: LoginRequest) -> tuple[str, User]:
        user = self.users.get_by_username(payload.username)
        if not user or not verify_password(payload.password, user.password_hash):
            raise AppError("Credenciales invalidas", status.HTTP_401_UNAUTHORIZED)
        if not user.is_active:
            raise AppError("Usuario inactivo", status.HTTP_403_FORBIDDEN)

        return create_access_token(str(user.id)), user


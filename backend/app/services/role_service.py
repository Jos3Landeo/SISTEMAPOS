from fastapi import status
from sqlalchemy.orm import Session

from app.core.constants import AVAILABLE_PERMISSIONS
from app.core.exceptions import AppError
from app.repositories.user_repository import RoleRepository
from app.schemas.role import RoleCreate, RoleUpdate


class RoleService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.roles = RoleRepository(db)

    def list_roles(self):
        return self.roles.list()

    def create_role(self, payload: RoleCreate):
        if self.roles.get_by_name(payload.name):
            raise AppError("El rol ya existe", status.HTTP_409_CONFLICT)

        permissions = self._sanitize_permissions(payload.permissions)
        role = self.roles.create(
            {
                "name": payload.name,
                "description": payload.description,
                "permissions": permissions,
            }
        )
        self.db.commit()
        return role

    def update_role(self, role_id: str, payload: RoleUpdate):
        role = self.roles.get_by_id(role_id)
        if not role:
            raise AppError("Rol no encontrado", status.HTTP_404_NOT_FOUND)

        data = payload.model_dump(exclude_unset=True)
        if "name" in data and data["name"]:
            existing_role = self.roles.get_by_name(data["name"])
            if existing_role and str(existing_role.id) != role_id:
                raise AppError("El rol ya existe", status.HTTP_409_CONFLICT)
        if "permissions" in data and data["permissions"] is not None:
            data["permissions"] = self._sanitize_permissions(data["permissions"])

        updated = self.roles.update(role, data)
        self.db.commit()
        return updated

    @staticmethod
    def _sanitize_permissions(permissions: list[str]) -> list[str]:
        invalid_permissions = sorted(set(permissions) - set(AVAILABLE_PERMISSIONS))
        if invalid_permissions:
            raise AppError(
                f"Permisos invalidos: {', '.join(invalid_permissions)}",
                status.HTTP_400_BAD_REQUEST,
            )
        return sorted(set(permissions))

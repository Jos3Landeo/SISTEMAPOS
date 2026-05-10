from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_permissions
from app.core.constants import PERMISSION_CASHIERS
from app.db.session import get_db
from app.schemas.role import RoleCreate, RoleRead, RoleUpdate
from app.services.role_service import RoleService


router = APIRouter()


@router.get("/", response_model=list[RoleRead])
def list_roles(_: object = Depends(require_permissions(PERMISSION_CASHIERS)), db: Session = Depends(get_db)) -> list[RoleRead]:
    return RoleService(db).list_roles()


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(
    payload: RoleCreate,
    _: object = Depends(require_permissions(PERMISSION_CASHIERS)),
    db: Session = Depends(get_db),
) -> RoleRead:
    return RoleService(db).create_role(payload)


@router.patch("/{role_id}", response_model=RoleRead)
def update_role(
    role_id: str,
    payload: RoleUpdate,
    _: object = Depends(require_permissions(PERMISSION_CASHIERS)),
    db: Session = Depends(get_db),
) -> RoleRead:
    return RoleService(db).update_role(role_id, payload)

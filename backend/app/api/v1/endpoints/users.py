from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_permissions
from app.core.constants import PERMISSION_CASHIERS
from app.db.session import get_db
from app.schemas.user import UserCreate, UserRead, UserUpdate
from app.services.user_service import UserService


router = APIRouter()


@router.get("/", response_model=list[UserRead])
def list_users(_: object = Depends(require_permissions(PERMISSION_CASHIERS)), db: Session = Depends(get_db)) -> list[UserRead]:
    return UserService(db).list_users()


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: UserCreate,
    _: object = Depends(require_permissions(PERMISSION_CASHIERS)),
    db: Session = Depends(get_db),
) -> UserRead:
    return UserService(db).create_user(payload)


@router.patch("/{user_id}", response_model=UserRead)
def update_user(
    user_id: str,
    payload: UserUpdate,
    _: object = Depends(require_permissions(PERMISSION_CASHIERS)),
    db: Session = Depends(get_db),
) -> UserRead:
    return UserService(db).update_user(user_id, payload)

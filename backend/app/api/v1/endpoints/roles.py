from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser
from app.db.session import get_db
from app.repositories.user_repository import RoleRepository
from app.schemas.role import RoleCreate, RoleRead


router = APIRouter()


@router.get("/", response_model=list[RoleRead])
def list_roles(_: CurrentUser, db: Session = Depends(get_db)) -> list[RoleRead]:
    return RoleRepository(db).list()


@router.post("/", response_model=RoleRead, status_code=status.HTTP_201_CREATED)
def create_role(payload: RoleCreate, _: CurrentUser, db: Session = Depends(get_db)) -> RoleRead:
    role = RoleRepository(db).create(payload.model_dump())
    db.commit()
    return role


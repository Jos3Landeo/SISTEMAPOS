from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser
from app.db.session import get_db
from app.schemas.auth import BootstrapAdminRequest, LoginRequest, Token
from app.schemas.user import UserRead
from app.services.auth_service import AuthService


router = APIRouter()


@router.post("/bootstrap", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def bootstrap_admin(payload: BootstrapAdminRequest, db: Session = Depends(get_db)) -> UserRead:
    return AuthService(db).bootstrap_admin(payload)


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    token, user = AuthService(db).login(payload)
    return Token(access_token=token, user=user)


@router.get("/me", response_model=UserRead)
def me(current_user: CurrentUser) -> UserRead:
    return current_user


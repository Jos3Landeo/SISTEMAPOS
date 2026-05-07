from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser
from app.db.session import get_db
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.services.catalog_service import CategoryService


router = APIRouter()


@router.get("/", response_model=list[CategoryRead])
def list_categories(_: CurrentUser, db: Session = Depends(get_db)) -> list[CategoryRead]:
    return CategoryService(db).list_categories()


@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(payload: CategoryCreate, _: CurrentUser, db: Session = Depends(get_db)) -> CategoryRead:
    return CategoryService(db).create_category(payload)


@router.patch("/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: str,
    payload: CategoryUpdate,
    _: CurrentUser,
    db: Session = Depends(get_db),
) -> CategoryRead:
    return CategoryService(db).update_category(category_id, payload)


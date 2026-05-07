from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser
from app.db.session import get_db
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services.catalog_service import ProductService


router = APIRouter()


@router.get("/", response_model=list[ProductRead])
def list_products(
    _: CurrentUser,
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, min_length=1),
) -> list[ProductRead]:
    return ProductService(db).list_products(search)


@router.get("/lookup/{code}", response_model=ProductRead)
def lookup_product(code: str, _: CurrentUser, db: Session = Depends(get_db)) -> ProductRead:
    return ProductService(db).find_sellable_product(code)


@router.post("/", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, _: CurrentUser, db: Session = Depends(get_db)) -> ProductRead:
    return ProductService(db).create_product(payload)


@router.patch("/{product_id}", response_model=ProductRead)
def update_product(
    product_id: str,
    payload: ProductUpdate,
    _: CurrentUser,
    db: Session = Depends(get_db),
) -> ProductRead:
    return ProductService(db).update_product(product_id, payload)


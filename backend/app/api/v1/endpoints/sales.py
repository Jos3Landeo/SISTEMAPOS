from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser
from app.db.session import get_db
from app.schemas.sale import SaleCancellationRequest, SaleCreate, SaleListItem, SaleRead
from app.services.sale_service import SaleService


router = APIRouter()


@router.get("/", response_model=list[SaleListItem])
def list_sales(_: CurrentUser, db: Session = Depends(get_db)) -> list[SaleListItem]:
    return SaleService(db).list_sales()


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(sale_id: str, _: CurrentUser, db: Session = Depends(get_db)) -> SaleRead:
    return SaleService(db).get_sale(sale_id)


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(payload: SaleCreate, current_user: CurrentUser, db: Session = Depends(get_db)) -> SaleRead:
    return SaleService(db).create_sale(str(current_user.id), payload)


@router.post("/{sale_id}/cancel", response_model=SaleRead)
def cancel_sale(
    sale_id: str,
    payload: SaleCancellationRequest,
    _: CurrentUser,
    db: Session = Depends(get_db),
) -> SaleRead:
    return SaleService(db).cancel_sale(sale_id, payload)


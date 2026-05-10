from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_permission, require_permissions
from app.core.constants import PERMISSION_POS, PERMISSION_REPORTS
from app.db.session import get_db
from app.schemas.sale import SaleCancellationRequest, SaleCreate, SaleListItem, SaleRead
from app.services.sale_service import SaleService


router = APIRouter()


@router.get("/", response_model=list[SaleListItem])
def list_sales(
    _: object = Depends(require_any_permission(PERMISSION_POS, PERMISSION_REPORTS)),
    db: Session = Depends(get_db),
) -> list[SaleListItem]:
    return SaleService(db).list_sales()


@router.get("/latest", response_model=SaleRead)
def get_latest_sale(
    cash_session_id: UUID | None = Query(default=None),
    current_user = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> SaleRead:
    return SaleService(db).get_latest_sale(str(current_user.id), str(cash_session_id) if cash_session_id else None)


@router.get("/{sale_id}", response_model=SaleRead)
def get_sale(
    sale_id: str,
    _: object = Depends(require_any_permission(PERMISSION_POS, PERMISSION_REPORTS)),
    db: Session = Depends(get_db),
) -> SaleRead:
    return SaleService(db).get_sale(sale_id)


@router.post("/", response_model=SaleRead, status_code=status.HTTP_201_CREATED)
def create_sale(
    payload: SaleCreate,
    current_user = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> SaleRead:
    return SaleService(db).create_sale(str(current_user.id), payload, current_user.role.permissions or [])


@router.post("/{sale_id}/cancel", response_model=SaleRead)
def cancel_sale(
    sale_id: str,
    payload: SaleCancellationRequest,
    _: object = Depends(require_any_permission(PERMISSION_POS, PERMISSION_REPORTS)),
    db: Session = Depends(get_db),
) -> SaleRead:
    return SaleService(db).cancel_sale(sale_id, payload)

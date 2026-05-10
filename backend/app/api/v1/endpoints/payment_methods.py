from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_permission, require_permissions
from app.core.constants import PERMISSION_POS, PERMISSION_SETTINGS
from app.db.session import get_db
from app.schemas.payment_method import PaymentMethodCreate, PaymentMethodRead, PaymentMethodUpdate
from app.services.payment_service import PaymentMethodService


router = APIRouter()


@router.get("/", response_model=list[PaymentMethodRead])
def list_methods(
    _: object = Depends(require_any_permission(PERMISSION_POS, PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> list[PaymentMethodRead]:
    return PaymentMethodService(db).list_methods()


@router.post("/", response_model=PaymentMethodRead, status_code=status.HTTP_201_CREATED)
def create_method(
    payload: PaymentMethodCreate,
    _: object = Depends(require_permissions(PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> PaymentMethodRead:
    return PaymentMethodService(db).create_method(payload)


@router.patch("/{method_id}", response_model=PaymentMethodRead)
def update_method(
    method_id: str,
    payload: PaymentMethodUpdate,
    _: object = Depends(require_permissions(PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> PaymentMethodRead:
    return PaymentMethodService(db).update_method(method_id, payload)

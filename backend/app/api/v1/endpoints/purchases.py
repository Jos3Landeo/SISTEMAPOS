from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_permissions
from app.core.constants import PERMISSION_INVENTORY
from app.db.session import get_db
from app.schemas.purchase import PurchaseCreate, PurchaseRead
from app.services.purchase_service import PurchaseService


router = APIRouter()


@router.get("/", response_model=list[PurchaseRead])
def list_purchases(
    _: object = Depends(require_permissions(PERMISSION_INVENTORY)),
    db: Session = Depends(get_db),
) -> list[PurchaseRead]:
    return PurchaseService(db).list_purchases()


@router.get("/{purchase_id}", response_model=PurchaseRead)
def get_purchase(
    purchase_id: str,
    _: object = Depends(require_permissions(PERMISSION_INVENTORY)),
    db: Session = Depends(get_db),
) -> PurchaseRead:
    return PurchaseService(db).get_purchase(purchase_id)


@router.post("/", response_model=PurchaseRead, status_code=status.HTTP_201_CREATED)
def create_purchase(
    payload: PurchaseCreate,
    current_user = Depends(require_permissions(PERMISSION_INVENTORY)),
    db: Session = Depends(get_db),
) -> PurchaseRead:
    return PurchaseService(db).create_purchase(str(current_user.id), payload)

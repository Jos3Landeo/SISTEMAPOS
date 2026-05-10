from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser, require_permissions
from app.core.constants import PERMISSION_INVENTORY
from app.db.session import get_db
from app.schemas.inventory import InventoryMovementRead, StockAdjustmentCreate, StockAdjustmentRead
from app.services.inventory_service import InventoryService


router = APIRouter()


@router.get("/movements", response_model=list[InventoryMovementRead])
def list_movements(_: object = Depends(require_permissions(PERMISSION_INVENTORY)), db: Session = Depends(get_db)) -> list[InventoryMovementRead]:
    return InventoryService(db).list_movements()


@router.get("/adjustments", response_model=list[StockAdjustmentRead])
def list_adjustments(_: object = Depends(require_permissions(PERMISSION_INVENTORY)), db: Session = Depends(get_db)) -> list[StockAdjustmentRead]:
    return InventoryService(db).list_adjustments()


@router.post("/adjustments", response_model=StockAdjustmentRead, status_code=status.HTTP_201_CREATED)
def create_adjustment(
    payload: StockAdjustmentCreate,
    current_user = Depends(require_permissions(PERMISSION_INVENTORY)),
    db: Session = Depends(get_db),
) -> StockAdjustmentRead:
    return InventoryService(db).create_adjustment(str(current_user.id), payload)

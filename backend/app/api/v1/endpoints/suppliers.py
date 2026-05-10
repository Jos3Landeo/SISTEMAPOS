from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_permissions
from app.core.constants import PERMISSION_INVENTORY
from app.db.session import get_db
from app.schemas.supplier import SupplierCreate, SupplierRead, SupplierUpdate
from app.services.catalog_service import SupplierService


router = APIRouter()


@router.get("/", response_model=list[SupplierRead])
def list_suppliers(
    _: object = Depends(require_permissions(PERMISSION_INVENTORY)),
    db: Session = Depends(get_db),
) -> list[SupplierRead]:
    return SupplierService(db).list_suppliers()


@router.post("/", response_model=SupplierRead, status_code=status.HTTP_201_CREATED)
def create_supplier(
    payload: SupplierCreate,
    _: object = Depends(require_permissions(PERMISSION_INVENTORY)),
    db: Session = Depends(get_db),
) -> SupplierRead:
    return SupplierService(db).create_supplier(payload)


@router.patch("/{supplier_id}", response_model=SupplierRead)
def update_supplier(
    supplier_id: str,
    payload: SupplierUpdate,
    _: object = Depends(require_permissions(PERMISSION_INVENTORY)),
    db: Session = Depends(get_db),
) -> SupplierRead:
    return SupplierService(db).update_supplier(supplier_id, payload)

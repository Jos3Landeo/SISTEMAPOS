from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import require_any_permission, require_permissions
from app.core.constants import PERMISSION_CASHIERS, PERMISSION_POS, PERMISSION_REPORTS, PERMISSION_SETTINGS
from app.db.session import get_db
from app.schemas.cash import (
    CashMovementCreate,
    CashReasonCatalogRead,
    CashRegisterCreate,
    CashRegisterRead,
    CashRegisterUpdate,
    CashSessionClose,
    CashSessionClosureRead,
    CashSessionOpen,
    CashSessionReopen,
    CashSessionSummaryRead,
)
from app.services.cash_service import CashRegisterService, CashSessionService


router = APIRouter()


@router.get("/reasons", response_model=list[CashReasonCatalogRead])
def list_reason_catalog(
    reason_type: str | None = None,
    _: object = Depends(require_any_permission(PERMISSION_POS, PERMISSION_REPORTS)),
    db: Session = Depends(get_db),
) -> list[CashReasonCatalogRead]:
    return CashSessionService(db).list_reason_catalog(reason_type)


@router.get("/registers", response_model=list[CashRegisterRead])
def list_registers(
    _: object = Depends(require_any_permission(PERMISSION_SETTINGS, PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> list[CashRegisterRead]:
    return CashRegisterService(db).list_registers()


@router.post("/registers", response_model=CashRegisterRead, status_code=status.HTTP_201_CREATED)
def create_register(
    payload: CashRegisterCreate,
    _: object = Depends(require_permissions(PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> CashRegisterRead:
    return CashRegisterService(db).create_register(payload)


@router.patch("/registers/{register_id}", response_model=CashRegisterRead)
def update_register(
    register_id: str,
    payload: CashRegisterUpdate,
    _: object = Depends(require_permissions(PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> CashRegisterRead:
    return CashRegisterService(db).update_register(register_id, payload)


@router.get("/sessions/open", response_model=list[CashSessionSummaryRead])
def list_open_sessions(
    _: object = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> list[CashSessionSummaryRead]:
    return CashSessionService(db).list_open_sessions()


@router.get("/sessions/current", response_model=CashSessionSummaryRead | None)
def get_current_session(
    current_user = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> CashSessionSummaryRead | None:
    return CashSessionService(db).get_current_session(str(current_user.id))


@router.get("/sessions/closed", response_model=list[CashSessionClosureRead])
def list_closed_sessions(
    current_user = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> list[CashSessionClosureRead]:
    permissions = list(current_user.role.permissions or [])
    return CashSessionService(db).list_closed_sessions(str(current_user.id), permissions)


@router.post("/sessions/open", response_model=CashSessionSummaryRead, status_code=status.HTTP_201_CREATED)
def open_session(
    payload: CashSessionOpen,
    current_user = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> CashSessionSummaryRead:
    return CashSessionService(db).open_session(str(current_user.id), payload)


@router.post("/sessions/{session_id}/movements", response_model=CashSessionSummaryRead)
def create_manual_movement(
    session_id: str,
    payload: CashMovementCreate,
    current_user = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> CashSessionSummaryRead:
    return CashSessionService(db).create_manual_movement(session_id, str(current_user.id), payload)


@router.post("/sessions/{session_id}/close", response_model=CashSessionSummaryRead)
def close_session(
    session_id: str,
    payload: CashSessionClose,
    current_user = Depends(require_permissions(PERMISSION_POS)),
    db: Session = Depends(get_db),
) -> CashSessionSummaryRead:
    return CashSessionService(db).close_session(session_id, str(current_user.id), payload)


@router.post("/sessions/{session_id}/reopen", response_model=CashSessionSummaryRead)
def reopen_session(
    session_id: str,
    payload: CashSessionReopen,
    current_user = Depends(require_any_permission(PERMISSION_CASHIERS, PERMISSION_SETTINGS)),
    db: Session = Depends(get_db),
) -> CashSessionSummaryRead:
    return CashSessionService(db).reopen_session(session_id, str(current_user.id), payload)

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.dependencies import CurrentUser
from app.db.session import get_db
from app.schemas.cash import CashRegisterCreate, CashRegisterRead, CashRegisterUpdate, CashSessionClose, CashSessionOpen, CashSessionRead
from app.services.cash_service import CashRegisterService, CashSessionService


router = APIRouter()


@router.get("/registers", response_model=list[CashRegisterRead])
def list_registers(_: CurrentUser, db: Session = Depends(get_db)) -> list[CashRegisterRead]:
    return CashRegisterService(db).list_registers()


@router.post("/registers", response_model=CashRegisterRead, status_code=status.HTTP_201_CREATED)
def create_register(payload: CashRegisterCreate, _: CurrentUser, db: Session = Depends(get_db)) -> CashRegisterRead:
    return CashRegisterService(db).create_register(payload)


@router.patch("/registers/{register_id}", response_model=CashRegisterRead)
def update_register(
    register_id: str,
    payload: CashRegisterUpdate,
    _: CurrentUser,
    db: Session = Depends(get_db),
) -> CashRegisterRead:
    return CashRegisterService(db).update_register(register_id, payload)


@router.get("/sessions/open", response_model=list[CashSessionRead])
def list_open_sessions(_: CurrentUser, db: Session = Depends(get_db)) -> list[CashSessionRead]:
    return CashSessionService(db).list_open_sessions()


@router.post("/sessions/open", response_model=CashSessionRead, status_code=status.HTTP_201_CREATED)
def open_session(payload: CashSessionOpen, current_user: CurrentUser, db: Session = Depends(get_db)) -> CashSessionRead:
    return CashSessionService(db).open_session(str(current_user.id), payload)


@router.post("/sessions/{session_id}/close", response_model=CashSessionRead)
def close_session(
    session_id: str,
    payload: CashSessionClose,
    _: CurrentUser,
    db: Session = Depends(get_db),
) -> CashSessionRead:
    return CashSessionService(db).close_session(session_id, payload)

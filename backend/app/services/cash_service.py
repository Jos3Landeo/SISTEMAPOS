from decimal import Decimal

from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.cash import CashSession
from app.repositories.cash_repository import CashRegisterRepository, CashSessionRepository
from app.schemas.cash import CashRegisterCreate, CashRegisterUpdate, CashSessionClose, CashSessionOpen


class CashRegisterService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.cash_registers = CashRegisterRepository(db)

    def list_registers(self):
        return self.cash_registers.list()

    def create_register(self, payload: CashRegisterCreate):
        register = self.cash_registers.create(payload.model_dump())
        self.db.commit()
        return register

    def update_register(self, register_id: str, payload: CashRegisterUpdate):
        register = self.cash_registers.get_by_id(register_id)
        if not register:
            raise AppError("Caja no encontrada", status.HTTP_404_NOT_FOUND)
        register = self.cash_registers.update(register, payload.model_dump(exclude_unset=True))
        self.db.commit()
        return register


class CashSessionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.cash_registers = CashRegisterRepository(db)
        self.cash_sessions = CashSessionRepository(db)

    def list_open_sessions(self):
        return self.cash_sessions.list_open_sessions()

    def open_session(self, user_id: str, payload: CashSessionOpen):
        register = self.cash_registers.get_by_id(payload.cash_register_id)
        if not register or not register.is_active:
            raise AppError("Caja no disponible", status.HTTP_404_NOT_FOUND)

        session = self.cash_sessions.create(
            {
                "cash_register_id": payload.cash_register_id,
                "opened_by_user_id": user_id,
                "opening_amount": payload.opening_amount,
                "status": "open",
            }
        )
        self.db.commit()
        return session

    def close_session(self, session_id: str, payload: CashSessionClose) -> CashSession:
        session = self.cash_sessions.get_by_id(session_id)
        if not session:
            raise AppError("Sesion de caja no encontrada", status.HTTP_404_NOT_FOUND)
        if session.status != "open":
            raise AppError("La sesion ya se encuentra cerrada", status.HTTP_409_CONFLICT)

        session.counted_amount = payload.counted_amount
        session.closing_amount = payload.closing_amount
        session.difference_amount = Decimal(payload.counted_amount) - Decimal(payload.closing_amount)
        session.status = "closed"
        self.db.commit()
        self.db.refresh(session)
        return session


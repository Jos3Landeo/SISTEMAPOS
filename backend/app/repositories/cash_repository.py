from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.cash import CashRegister, CashSession
from app.repositories.base import BaseRepository


class CashRegisterRepository(BaseRepository[CashRegister]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CashRegister)


class CashSessionRepository(BaseRepository[CashSession]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CashSession)

    def list_open_sessions(self) -> list[CashSession]:
        stmt = select(CashSession).where(CashSession.status == "open").order_by(CashSession.created_at.desc())
        return list(self.db.scalars(stmt).all())

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.cash import CashMovement, CashRegister, CashSession, CashSessionClosure, CashSessionClosureDenomination
from app.models.sales import Sale, SalePayment
from app.models.user import User
from app.repositories.base import BaseRepository


class CashRegisterRepository(BaseRepository[CashRegister]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CashRegister)

    def list(self) -> list[CashRegister]:
        stmt = select(CashRegister).where(CashRegister.is_active.is_(True)).order_by(CashRegister.name.asc())
        return list(self.db.scalars(stmt).all())


class CashSessionRepository(BaseRepository[CashSession]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CashSession)

    def list_open_sessions(self) -> list[CashSession]:
        stmt = (
            select(CashSession)
            .options(
                joinedload(CashSession.cash_register),
                joinedload(CashSession.opened_by).joinedload(User.role),
                joinedload(CashSession.sales).joinedload(Sale.payments).joinedload(SalePayment.payment_method),
                joinedload(CashSession.movements).joinedload(CashMovement.created_by).joinedload(User.role),
            )
            .where(CashSession.status == "open")
            .order_by(CashSession.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, entity_id: str) -> CashSession | None:
        stmt = (
            select(CashSession)
            .options(
                joinedload(CashSession.cash_register),
                joinedload(CashSession.opened_by).joinedload(User.role),
                joinedload(CashSession.sales).joinedload(Sale.payments).joinedload(SalePayment.payment_method),
                joinedload(CashSession.movements).joinedload(CashMovement.created_by).joinedload(User.role),
            )
            .where(CashSession.id == entity_id)
        )
        return self.db.scalar(stmt)

    def get_open_by_user(self, user_id: str) -> CashSession | None:
        stmt = (
            select(CashSession)
            .options(
                joinedload(CashSession.cash_register),
                joinedload(CashSession.opened_by).joinedload(User.role),
                joinedload(CashSession.sales).joinedload(Sale.payments).joinedload(SalePayment.payment_method),
                joinedload(CashSession.movements).joinedload(CashMovement.created_by).joinedload(User.role),
            )
            .where(CashSession.opened_by_user_id == user_id, CashSession.status == "open")
            .order_by(CashSession.created_at.desc())
        )
        return self.db.scalar(stmt)

    def get_open_by_register(self, register_id: str) -> CashSession | None:
        stmt = (
            select(CashSession)
            .options(
                joinedload(CashSession.cash_register),
                joinedload(CashSession.opened_by).joinedload(User.role),
                joinedload(CashSession.movements).joinedload(CashMovement.created_by).joinedload(User.role),
            )
            .where(CashSession.cash_register_id == register_id, CashSession.status == "open")
            .order_by(CashSession.created_at.desc())
        )
        return self.db.scalar(stmt)

    def list_closed_sessions(self, user_id: str | None = None, limit: int = 15) -> list[CashSession]:
        stmt = (
            select(CashSession)
            .options(
                joinedload(CashSession.cash_register),
                joinedload(CashSession.opened_by).joinedload(User.role),
                joinedload(CashSession.closed_by).joinedload(User.role),
                joinedload(CashSession.supervised_by).joinedload(User.role),
                joinedload(CashSession.closures)
                .joinedload(CashSessionClosure.closed_by)
                .joinedload(User.role),
                joinedload(CashSession.closures)
                .joinedload(CashSessionClosure.supervised_by)
                .joinedload(User.role),
                joinedload(CashSession.closures)
                .joinedload(CashSessionClosure.reopened_by)
                .joinedload(User.role),
                joinedload(CashSession.closures).joinedload(CashSessionClosure.denominations),
            )
            .where(CashSession.status == "closed")
            .order_by(CashSession.updated_at.desc())
            .limit(limit)
        )
        if user_id:
            stmt = stmt.where(CashSession.opened_by_user_id == user_id)
        return list(self.db.scalars(stmt).unique().all())


class CashMovementRepository(BaseRepository[CashMovement]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CashMovement)


class CashSessionClosureRepository(BaseRepository[CashSessionClosure]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CashSessionClosure)

    def get_latest_for_session(self, session_id: str) -> CashSessionClosure | None:
        stmt = (
            select(CashSessionClosure)
            .options(
                joinedload(CashSessionClosure.closed_by).joinedload(User.role),
                joinedload(CashSessionClosure.supervised_by).joinedload(User.role),
                joinedload(CashSessionClosure.reopened_by).joinedload(User.role),
                joinedload(CashSessionClosure.denominations),
                joinedload(CashSessionClosure.cash_session).joinedload(CashSession.cash_register),
                joinedload(CashSessionClosure.cash_session).joinedload(CashSession.opened_by).joinedload(User.role),
            )
            .where(CashSessionClosure.cash_session_id == session_id)
            .order_by(CashSessionClosure.created_at.desc())
        )
        return self.db.scalar(stmt)


class CashSessionClosureDenominationRepository(BaseRepository[CashSessionClosureDenomination]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, CashSessionClosureDenomination)

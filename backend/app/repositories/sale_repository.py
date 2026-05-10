from __future__ import annotations

from sqlalchemy import select, text
from sqlalchemy.orm import Session, joinedload

from app.models.sales import Sale, SaleDetail, SalePayment
from app.repositories.base import BaseRepository


class SaleRepository(BaseRepository[Sale]):
    SALE_NUMBER_SEQUENCE = "sale_number_seq"
    SALE_NUMBER_PADDING = 7

    def __init__(self, db: Session) -> None:
        super().__init__(db, Sale)

    def list(self) -> list[Sale]:
        stmt = (
            select(Sale)
            .options(
                joinedload(Sale.user),
                joinedload(Sale.details).joinedload(SaleDetail.product),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .order_by(Sale.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, entity_id: str) -> Sale | None:
        stmt = (
            select(Sale)
            .options(
                joinedload(Sale.user),
                joinedload(Sale.details).joinedload(SaleDetail.product),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .where(Sale.id == entity_id)
        )
        return self.db.scalar(stmt)

    def get_latest_completed(self, user_id: str, cash_session_id: str | None = None) -> Sale | None:
        stmt = (
            select(Sale)
            .options(
                joinedload(Sale.user),
                joinedload(Sale.details).joinedload(SaleDetail.product),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .where(Sale.status == "completed")
            .order_by(Sale.created_at.desc(), Sale.id.desc())
        )

        if cash_session_id:
            stmt = stmt.where(Sale.cash_session_id == cash_session_id)
        else:
            stmt = stmt.where(Sale.user_id == user_id)

        return self.db.scalar(stmt)

    def next_sale_number(self) -> str:
        sequence_value = self.db.execute(text(f"SELECT nextval('{self.SALE_NUMBER_SEQUENCE}')")).scalar_one()
        return str(sequence_value).zfill(self.SALE_NUMBER_PADDING)

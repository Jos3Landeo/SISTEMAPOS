from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.sales import Sale, SaleDetail, SalePayment
from app.repositories.base import BaseRepository


class SaleRepository(BaseRepository[Sale]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Sale)

    def list(self) -> list[Sale]:
        stmt = (
            select(Sale)
            .options(
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
                joinedload(Sale.details).joinedload(SaleDetail.product),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .where(Sale.id == entity_id)
        )
        return self.db.scalar(stmt)

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.catalog import Product
from app.models.sales import Purchase, PurchaseDetail
from app.models.user import User
from app.repositories.base import BaseRepository


class PurchaseRepository(BaseRepository[Purchase]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, Purchase)

    def list(self) -> list[Purchase]:
        stmt = (
            select(Purchase)
            .options(
                joinedload(Purchase.supplier),
                joinedload(Purchase.user).joinedload(User.role),
                joinedload(Purchase.details).joinedload(PurchaseDetail.product).joinedload(Product.category),
            )
            .order_by(Purchase.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_by_id(self, entity_id: str) -> Purchase | None:
        stmt = (
            select(Purchase)
            .options(
                joinedload(Purchase.supplier),
                joinedload(Purchase.user).joinedload(User.role),
                joinedload(Purchase.details).joinedload(PurchaseDetail.product).joinedload(Product.category),
            )
            .where(Purchase.id == entity_id)
        )
        return self.db.scalar(stmt)

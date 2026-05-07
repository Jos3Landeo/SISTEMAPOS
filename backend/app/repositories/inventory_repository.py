from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.models.inventory import InventoryMovement, StockAdjustment, StockAdjustmentDetail
from app.repositories.base import BaseRepository


class InventoryMovementRepository(BaseRepository[InventoryMovement]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, InventoryMovement)

    def list(self) -> list[InventoryMovement]:
        stmt = select(InventoryMovement).options(joinedload(InventoryMovement.product)).order_by(
            InventoryMovement.created_at.desc()
        )
        return list(self.db.scalars(stmt).unique().all())


class StockAdjustmentRepository(BaseRepository[StockAdjustment]):
    def __init__(self, db: Session) -> None:
        super().__init__(db, StockAdjustment)

    def list(self) -> list[StockAdjustment]:
        stmt = (
            select(StockAdjustment)
            .options(joinedload(StockAdjustment.details).joinedload(StockAdjustmentDetail.product))
            .order_by(StockAdjustment.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

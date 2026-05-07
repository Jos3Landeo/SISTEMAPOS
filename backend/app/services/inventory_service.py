from decimal import Decimal

from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.inventory import InventoryMovement, StockAdjustment, StockAdjustmentDetail
from app.repositories.catalog_repository import ProductRepository
from app.repositories.inventory_repository import InventoryMovementRepository, StockAdjustmentRepository
from app.schemas.inventory import StockAdjustmentCreate


class InventoryService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.products = ProductRepository(db)
        self.movements = InventoryMovementRepository(db)
        self.adjustments = StockAdjustmentRepository(db)

    def list_movements(self):
        return self.movements.list()

    def list_adjustments(self):
        return self.adjustments.list()

    def create_adjustment(self, user_id: str, payload: StockAdjustmentCreate) -> StockAdjustment:
        try:
            adjustment = StockAdjustment(user_id=user_id, reason=payload.reason, notes=payload.notes, status="applied")
            self.db.add(adjustment)
            self.db.flush()

            for line in payload.details:
                product = self.products.get_by_id(str(line.product_id))
                if not product:
                    raise AppError("Producto no encontrado en ajuste", status.HTTP_404_NOT_FOUND)

                previous_stock = Decimal(product.stock_current)
                new_stock = previous_stock + Decimal(line.quantity)
                product.stock_current = new_stock

                detail = StockAdjustmentDetail(
                    stock_adjustment_id=adjustment.id,
                    product_id=product.id,
                    quantity=line.quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                )
                movement = InventoryMovement(
                    product_id=product.id,
                    stock_adjustment_id=adjustment.id,
                    movement_type="adjustment",
                    quantity=line.quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reference=payload.reason,
                    notes=payload.notes,
                )
                self.db.add_all([detail, movement])

            self.db.commit()
            self.db.refresh(adjustment)
            return adjustment
        except Exception:
            self.db.rollback()
            raise

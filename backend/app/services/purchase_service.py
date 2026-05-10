from __future__ import annotations

from decimal import Decimal, ROUND_HALF_UP

from fastapi import status
from sqlalchemy.orm import Session

from app.core.exceptions import AppError
from app.models.inventory import InventoryMovement
from app.models.sales import Purchase, PurchaseDetail
from app.repositories.catalog_repository import ProductRepository, SupplierRepository
from app.repositories.purchase_repository import PurchaseRepository
from app.schemas.purchase import PurchaseCreate


class PurchaseService:
    MONEY_QUANTIZER = Decimal("0.01")

    def __init__(self, db: Session) -> None:
        self.db = db
        self.products = ProductRepository(db)
        self.suppliers = SupplierRepository(db)
        self.purchases = PurchaseRepository(db)

    def list_purchases(self):
        return self.purchases.list()

    def get_purchase(self, purchase_id: str):
        purchase = self.purchases.get_by_id(purchase_id)
        if not purchase:
            raise AppError("Compra no encontrada", status.HTTP_404_NOT_FOUND)
        return purchase

    def create_purchase(self, user_id: str, payload: PurchaseCreate):
        supplier = self.suppliers.get_by_id(str(payload.supplier_id))
        if not supplier or not supplier.is_active:
            raise AppError("Proveedor no disponible", status.HTTP_404_NOT_FOUND)

        try:
            subtotal = Decimal("0.00")
            tax_amount = self._quantize(Decimal(payload.tax_amount))

            purchase = Purchase(
                supplier_id=payload.supplier_id,
                user_id=user_id,
                invoice_number=payload.invoice_number.strip() if payload.invoice_number else None,
                tax_amount=tax_amount,
                notes=payload.notes.strip() if payload.notes else None,
            )
            self.db.add(purchase)
            self.db.flush()

            for line in payload.details:
                product = self.products.get_by_id(str(line.product_id))
                if not product or not product.is_active:
                    raise AppError("Producto no disponible para ingreso", status.HTTP_404_NOT_FOUND)
                if not product.allows_decimal and Decimal(line.quantity) % 1 != 0:
                    raise AppError(f"El producto {product.name} no permite fracciones", status.HTTP_409_CONFLICT)

                quantity = Decimal(line.quantity)
                unit_cost = self._quantize(Decimal(line.unit_cost))
                line_total = self._quantize(quantity * unit_cost)

                detail = PurchaseDetail(
                    purchase_id=purchase.id,
                    product_id=product.id,
                    quantity=quantity,
                    unit_cost=unit_cost,
                    line_total=line_total,
                )
                self.db.add(detail)

                previous_stock = Decimal(product.stock_current)
                new_stock = self._quantize(previous_stock + quantity)
                previous_average_cost = Decimal(product.average_cost)
                weighted_total_cost = (previous_stock * previous_average_cost) + (quantity * unit_cost)
                new_average_cost = unit_cost if new_stock <= 0 else self._quantize(weighted_total_cost / new_stock)

                product.stock_current = new_stock
                product.average_cost = new_average_cost

                movement = InventoryMovement(
                    product_id=product.id,
                    purchase_id=purchase.id,
                    movement_type="purchase",
                    quantity=quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reference=purchase.invoice_number or f"COMP-{purchase.id}",
                    notes=purchase.notes,
                )
                self.db.add(movement)

                subtotal = self._quantize(subtotal + line_total)

            purchase.subtotal = subtotal
            purchase.total = self._quantize(subtotal + tax_amount)

            self.db.commit()
            return self.get_purchase(str(purchase.id))
        except Exception:
            self.db.rollback()
            raise

    @classmethod
    def _quantize(cls, value: Decimal) -> Decimal:
        return value.quantize(cls.MONEY_QUANTIZER, rounding=ROUND_HALF_UP)

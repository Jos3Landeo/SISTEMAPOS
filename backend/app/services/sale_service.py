from datetime import UTC, datetime
from decimal import Decimal

from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppError
from app.models.inventory import InventoryMovement
from app.models.sales import Sale, SaleDetail, SalePayment
from app.repositories.catalog_repository import ProductRepository
from app.repositories.payment_repository import PaymentMethodRepository
from app.repositories.sale_repository import SaleRepository
from app.schemas.sale import SaleCancellationRequest, SaleCreate


class SaleService:
    TAX_RATE = Decimal("0.19")

    def __init__(self, db: Session) -> None:
        self.db = db
        self.products = ProductRepository(db)
        self.payment_methods = PaymentMethodRepository(db)
        self.sales = SaleRepository(db)

    def list_sales(self):
        stmt = (
            select(Sale)
            .options(
                joinedload(Sale.details).joinedload(SaleDetail.product),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .order_by(Sale.created_at.desc())
        )
        return list(self.db.scalars(stmt).unique().all())

    def get_sale(self, sale_id: str):
        stmt = (
            select(Sale)
            .options(
                joinedload(Sale.details).joinedload(SaleDetail.product),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .where(Sale.id == sale_id)
        )
        sale = self.db.scalar(stmt)
        if not sale:
            raise AppError("Venta no encontrada", status.HTTP_404_NOT_FOUND)
        return sale

    def create_sale(self, user_id: str, payload: SaleCreate) -> Sale:
        if not payload.details:
            raise AppError("La venta debe contener al menos un item")
        if not payload.payments:
            raise AppError("La venta debe contener al menos un pago")

        try:
            subtotal = Decimal("0.00")
            discount_amount = Decimal("0.00")
            tax_amount = Decimal("0.00")
            total = Decimal("0.00")

            sale = Sale(
                user_id=user_id,
                cash_session_id=payload.cash_session_id,
                sale_number=self._generate_sale_number(),
                status="completed",
                notes=payload.notes,
            )
            self.db.add(sale)
            self.db.flush()

            for line in payload.details:
                product = self.products.get_by_id(str(line.product_id))
                if not product or not product.is_active:
                    raise AppError("Producto no disponible para la venta", status.HTTP_404_NOT_FOUND)
                if Decimal(product.stock_current) < Decimal(line.quantity):
                    raise AppError(f"Stock insuficiente para {product.name}", status.HTTP_409_CONFLICT)
                if not product.allows_decimal and Decimal(line.quantity) % 1 != 0:
                    raise AppError(f"El producto {product.name} no permite fracciones", status.HTTP_409_CONFLICT)

                line_subtotal = Decimal(line.unit_price) * Decimal(line.quantity)
                line_tax = Decimal(line.tax_amount)
                line_discount = Decimal(line.discount_amount)
                line_total = line_subtotal - line_discount + line_tax

                detail = SaleDetail(
                    sale_id=sale.id,
                    product_id=product.id,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    discount_amount=line.discount_amount,
                    tax_amount=line.tax_amount,
                    line_total=line_total,
                )
                self.db.add(detail)

                previous_stock = Decimal(product.stock_current)
                new_stock = previous_stock - Decimal(line.quantity)
                product.stock_current = new_stock

                movement = InventoryMovement(
                    product_id=product.id,
                    sale_id=sale.id,
                    movement_type="sale",
                    quantity=Decimal(line.quantity) * Decimal("-1"),
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reference=sale.sale_number,
                )
                self.db.add(movement)

                subtotal += line_subtotal
                discount_amount += line_discount
                tax_amount += line_tax
                total += line_total

            payment_total = Decimal("0.00")
            for payment in payload.payments:
                method = self.payment_methods.get_by_id(str(payment.payment_method_id))
                if not method or not method.is_active:
                    raise AppError("Metodo de pago no disponible", status.HTTP_404_NOT_FOUND)
                if method.requires_reference and not payment.reference:
                    raise AppError(f"El metodo {method.name} requiere referencia")

                sale_payment = SalePayment(
                    sale_id=sale.id,
                    payment_method_id=method.id,
                    amount=payment.amount,
                    reference=payment.reference,
                )
                self.db.add(sale_payment)
                payment_total += Decimal(payment.amount)

            if payment_total != total:
                raise AppError("La suma de pagos debe coincidir con el total", status.HTTP_409_CONFLICT)

            sale.subtotal = subtotal
            sale.discount_amount = discount_amount
            sale.tax_amount = tax_amount
            sale.total = total

            self.db.commit()
            return self.get_sale(str(sale.id))
        except Exception:
            self.db.rollback()
            raise

    def cancel_sale(self, sale_id: str, reason: SaleCancellationRequest) -> Sale:
        try:
            sale = self.get_sale(sale_id)
            if sale.status == "cancelled":
                raise AppError("La venta ya se encuentra anulada", status.HTTP_409_CONFLICT)

            for detail in sale.details:
                product = self.products.get_by_id(str(detail.product_id))
                if not product:
                    raise AppError("Producto de venta no encontrado", status.HTTP_404_NOT_FOUND)

                previous_stock = Decimal(product.stock_current)
                new_stock = previous_stock + Decimal(detail.quantity)
                product.stock_current = new_stock

                movement = InventoryMovement(
                    product_id=product.id,
                    sale_id=sale.id,
                    movement_type="sale_cancellation",
                    quantity=detail.quantity,
                    previous_stock=previous_stock,
                    new_stock=new_stock,
                    reference=sale.sale_number,
                    notes=reason.reason,
                )
                self.db.add(movement)

            sale.status = "cancelled"
            sale.cancelled_at = datetime.now(UTC)
            sale.cancellation_reason = reason.reason
            self.db.commit()
            return self.get_sale(str(sale.id))
        except Exception:
            self.db.rollback()
            raise

    @staticmethod
    def _generate_sale_number() -> str:
        return f"V-{datetime.now(UTC).strftime('%Y%m%d%H%M%S%f')}"

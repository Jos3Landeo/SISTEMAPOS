from datetime import UTC, datetime
from decimal import Decimal, ROUND_HALF_UP

from fastapi import status
from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload

from app.core.constants import PERMISSION_POS_DISCOUNT
from app.core.exceptions import AppError
from app.core.reason_catalog import get_reason_item
from app.models.inventory import InventoryMovement
from app.repositories.cash_repository import CashSessionRepository
from app.models.sales import Sale, SaleDetail, SalePayment
from app.repositories.catalog_repository import ProductRepository
from app.repositories.payment_repository import PaymentMethodRepository
from app.repositories.sale_repository import SaleRepository
from app.schemas.sale import SaleCancellationRequest, SaleCreate


class SaleService:
    TAX_RATE = Decimal("0.19")
    ONE = Decimal("1.00")
    MONEY_QUANTIZER = Decimal("0.01")

    def __init__(self, db: Session) -> None:
        self.db = db
        self.products = ProductRepository(db)
        self.payment_methods = PaymentMethodRepository(db)
        self.cash_sessions = CashSessionRepository(db)
        self.sales = SaleRepository(db)

    def list_sales(self):
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

    def get_sale(self, sale_id: str):
        stmt = (
            select(Sale)
            .options(
                joinedload(Sale.user),
                joinedload(Sale.details).joinedload(SaleDetail.product),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .where(Sale.id == sale_id)
        )
        sale = self.db.scalar(stmt)
        if not sale:
            raise AppError("Venta no encontrada", status.HTTP_404_NOT_FOUND)
        return sale

    def get_latest_sale(self, user_id: str, cash_session_id: str | None = None) -> Sale:
        sale = self.sales.get_latest_completed(user_id=user_id, cash_session_id=cash_session_id)
        if not sale:
            raise AppError("No hay ventas disponibles para reimprimir", status.HTTP_404_NOT_FOUND)
        return sale

    def create_sale(self, user_id: str, payload: SaleCreate, user_permissions: list[str] | None = None) -> Sale:
        if not payload.details:
            raise AppError("La venta debe contener al menos un item")
        if not payload.payments:
            raise AppError("La venta debe contener al menos un pago")

        try:
            if payload.cash_session_id:
                cash_session = self.cash_sessions.get_by_id(str(payload.cash_session_id))
                if not cash_session or cash_session.status != "open":
                    raise AppError("La caja seleccionada no se encuentra abierta", status.HTTP_409_CONFLICT)
                if str(cash_session.opened_by_user_id) != user_id:
                    raise AppError("La venta debe registrarse en tu caja activa", status.HTTP_403_FORBIDDEN)

            subtotal = Decimal("0.00")
            discount_amount = Decimal("0.00")
            tax_amount = Decimal("0.00")
            total = Decimal("0.00")
            requested_discount = self._quantize(Decimal(payload.discount_amount))

            if requested_discount > Decimal("0.00") and PERMISSION_POS_DISCOUNT not in set(user_permissions or []):
                raise AppError("No tienes permisos para aplicar descuentos", status.HTTP_403_FORBIDDEN)

            sale = Sale(
                user_id=user_id,
                cash_session_id=payload.cash_session_id,
                sale_number=self.sales.next_sale_number(),
                status="completed",
                notes=payload.notes,
            )
            self.db.add(sale)
            self.db.flush()

            prepared_lines: list[tuple] = []
            gross_total = Decimal("0.00")

            for line in payload.details:
                product = self.products.get_by_id(str(line.product_id))
                if not product or not product.is_active:
                    raise AppError("Producto no disponible para la venta", status.HTTP_404_NOT_FOUND)
                if Decimal(product.stock_current) < Decimal(line.quantity):
                    raise AppError(f"Stock insuficiente para {product.name}", status.HTTP_409_CONFLICT)
                if not product.allows_decimal and Decimal(line.quantity) % 1 != 0:
                    raise AppError(f"El producto {product.name} no permite fracciones", status.HTTP_409_CONFLICT)

                gross_line_amount = self._quantize(Decimal(line.unit_price) * Decimal(line.quantity))
                prepared_lines.append((line, product, gross_line_amount))
                gross_total = self._quantize(gross_total + gross_line_amount)

            if requested_discount > gross_total:
                raise AppError("El descuento no puede superar el total de la venta", status.HTTP_422_UNPROCESSABLE_ENTITY)

            remaining_discount = requested_discount
            for index, (line, product, gross_line_amount) in enumerate(prepared_lines):
                manual_line_discount = self._quantize(Decimal(line.discount_amount))
                proportional_discount = Decimal("0.00")
                if requested_discount > Decimal("0.00"):
                    if index == len(prepared_lines) - 1:
                        proportional_discount = remaining_discount
                    else:
                        ratio = gross_line_amount / gross_total if gross_total > Decimal("0.00") else Decimal("0.00")
                        proportional_discount = self._quantize(requested_discount * ratio)
                        if proportional_discount > remaining_discount:
                            proportional_discount = remaining_discount
                    remaining_discount = self._quantize(remaining_discount - proportional_discount)

                line_discount = self._quantize(manual_line_discount + proportional_discount)
                if line_discount > gross_line_amount:
                    raise AppError(f"El descuento del producto {product.name} supera su subtotal", status.HTTP_422_UNPROCESSABLE_ENTITY)

                line_total = self._quantize(gross_line_amount - line_discount)
                line_subtotal = self._quantize(line_total / (self.ONE + self.TAX_RATE))
                line_tax = self._quantize(line_total - line_subtotal)

                detail = SaleDetail(
                    sale_id=sale.id,
                    product_id=product.id,
                    quantity=line.quantity,
                    unit_price=line.unit_price,
                    discount_amount=line_discount,
                    tax_amount=line_tax,
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

                subtotal = self._quantize(subtotal + line_subtotal)
                discount_amount = self._quantize(discount_amount + line_discount)
                tax_amount = self._quantize(tax_amount + line_tax)
                total = self._quantize(total + line_total)

            payment_total = Decimal("0.00")
            for payment in payload.payments:
                method = self.payment_methods.get_by_id(str(payment.payment_method_id))
                if not method or not method.is_active:
                    raise AppError("Metodo de pago no disponible", status.HTTP_404_NOT_FOUND)
                if method.requires_reference and not payment.reference:
                    raise AppError(f"El metodo {method.name} requiere referencia")

                payment_amount = self._quantize(Decimal(payment.amount))
                sale_payment = SalePayment(
                    sale_id=sale.id,
                    payment_method_id=method.id,
                    amount=payment_amount,
                    reference=payment.reference,
                )
                self.db.add(sale_payment)
                payment_total = self._quantize(payment_total + payment_amount)

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

            cancellation_reason = self._resolve_cancellation_reason(reason)

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
                    notes=cancellation_reason,
                )
                self.db.add(movement)

            sale.status = "cancelled"
            sale.cancelled_at = datetime.now(UTC)
            sale.cancellation_reason = cancellation_reason
            self.db.commit()
            return self.get_sale(str(sale.id))
        except Exception:
            self.db.rollback()
            raise

    @classmethod
    def _quantize(cls, value: Decimal) -> Decimal:
        return value.quantize(cls.MONEY_QUANTIZER, rounding=ROUND_HALF_UP)

    @staticmethod
    def _resolve_cancellation_reason(payload: SaleCancellationRequest) -> str:
        if payload.reason_code:
            item = get_reason_item("sale_cancellation", payload.reason_code)
            if not item:
                raise AppError("Motivo de anulacion no valido", status.HTTP_422_UNPROCESSABLE_ENTITY)
            notes = payload.notes.strip() if payload.notes else None
            if item["requires_notes"] and not notes:
                raise AppError("Debes detallar el motivo de anulacion seleccionado", status.HTTP_422_UNPROCESSABLE_ENTITY)
            return f"{item['label']}: {notes}" if notes else item["label"]

        if payload.reason:
            return payload.reason.strip()

        raise AppError("Debes indicar un motivo de anulacion", status.HTTP_422_UNPROCESSABLE_ENTITY)

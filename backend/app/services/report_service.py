from __future__ import annotations

from datetime import UTC, datetime, time, timedelta
from decimal import Decimal
from uuid import UUID

from sqlalchemy import String, cast, or_, select
from sqlalchemy.orm import Session, joinedload

from app.core.exceptions import AppError
from app.models.cash import CashMovement, CashSession
from app.models.sales import PaymentMethod, Sale, SalePayment
from app.models.user import User
from app.schemas.report import (
    CashDailyMovementItem,
    CashDailyReportRead,
    CashDailySaleItem,
    CashDailySummary,
    ReportNamedAmount,
    ReportPaymentMethodOption,
    ReportUserOption,
    SalesDayAvailableFilters,
    SalesDayReportRead,
    SalesDaySaleItem,
    SalesDaySummary,
)


class ReportService:
    MONEY_QUANTIZER = Decimal("0.01")

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_sales_day_report(
        self,
        *,
        search: str | None = None,
        payment_method_id: UUID | None = None,
        user_id: UUID | None = None,
        status: str = "completed",
    ) -> SalesDayReportRead:
        today_local = datetime.now().astimezone()
        day_start_local = datetime.combine(today_local.date(), time.min, tzinfo=today_local.tzinfo)
        day_end_local = day_start_local + timedelta(days=1)
        day_start_utc = day_start_local.astimezone(UTC)
        day_end_utc = day_end_local.astimezone(UTC)

        stmt = (
            select(Sale)
            .options(
                joinedload(Sale.user),
                joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            )
            .where(Sale.created_at >= day_start_utc, Sale.created_at < day_end_utc)
            .order_by(Sale.created_at.desc())
        )

        if status and status != "all":
            stmt = stmt.where(Sale.status == status)
        if search:
            like_pattern = f"%{search.strip()}%"
            stmt = stmt.where(
                or_(
                    Sale.sale_number.ilike(like_pattern),
                    cast(Sale.id, String).ilike(like_pattern),
                )
            )
        if user_id:
            stmt = stmt.where(Sale.user_id == user_id)
        if payment_method_id:
            stmt = stmt.where(Sale.payments.any(SalePayment.payment_method_id == payment_method_id))

        sales = list(self.db.scalars(stmt).unique().all())
        summary = self._build_sales_day_summary(sales)
        first_sale_at = min((sale.created_at for sale in sales), default=None)
        last_sale_at = max((sale.created_at for sale in sales), default=None)

        available_payment_methods = list(
            self.db.scalars(
                select(PaymentMethod)
                .where(PaymentMethod.is_active.is_(True))
                .order_by(PaymentMethod.name.asc())
            ).all()
        )
        available_users = list(
            self.db.scalars(
                select(User)
                .where(User.is_active.is_(True))
                .order_by(User.full_name.asc())
            ).all()
        )

        return SalesDayReportRead(
            fecha=today_local.date(),
            generado_en=datetime.now(UTC),
            periodo_desde=first_sale_at,
            periodo_hasta=last_sale_at,
            resumen=summary,
            ventas=[
                SalesDaySaleItem(
                    id=sale.id,
                    folio=sale.sale_number,
                    fecha_hora=sale.created_at,
                    hora=sale.created_at.astimezone(today_local.tzinfo).strftime("%H:%M"),
                    cajero=sale.user.full_name,
                    metodo_pago=", ".join(payment.payment_method.name for payment in sale.payments) or "-",
                    total=sale.total,
                    estado=sale.status,
                )
                for sale in sales
            ],
            filtros_disponibles=SalesDayAvailableFilters(
                metodos_pago=[
                    ReportPaymentMethodOption(id=method.id, name=method.name, code=method.code)
                    for method in available_payment_methods
                ],
                cajeros=[
                    ReportUserOption(id=user.id, full_name=user.full_name, username=user.username)
                    for user in available_users
                ],
                estados=["all", "completed", "cancelled"],
            ),
        )

    def get_cash_daily_report(
        self,
        *,
        current_user_id: UUID,
        session_id: UUID | None = None,
        user_id: UUID | None = None,
        report_date: date | None = None,
    ) -> CashDailyReportRead:
        session = self._resolve_cash_session(
            current_user_id=current_user_id,
            session_id=session_id,
            user_id=user_id,
            report_date=report_date,
        )
        if not session:
            raise AppError("No se encontro una sesion de caja para el criterio indicado", 404)

        summary = self._build_cash_daily_summary(session)
        session_timezone = datetime.now().astimezone().tzinfo

        return CashDailyReportRead(
            fecha=session.created_at.astimezone(session_timezone).date(),
            generado_en=datetime.now(UTC),
            session_id=session.id,
            estado=session.status,
            caja=session.cash_register.name,
            ubicacion_caja=session.cash_register.location,
            usuario=session.opened_by.full_name,
            apertura=session.created_at,
            cierre=session.updated_at if session.status == "closed" else None,
            resumen=summary,
            ventas=[
                CashDailySaleItem(
                    id=sale.id,
                    folio=sale.sale_number,
                    fecha_hora=sale.created_at,
                    cajero=sale.user.full_name,
                    metodo_pago=", ".join(payment.payment_method.name for payment in sale.payments) or "-",
                    total=sale.total,
                    estado=sale.status,
                )
                for sale in sorted(session.sales, key=lambda item: item.created_at)
            ],
            movimientos=[
                CashDailyMovementItem(
                    id=movement.id,
                    fecha_hora=movement.created_at,
                    tipo=movement.movement_type,
                    monto=movement.amount,
                    motivo=movement.reason,
                    observacion=movement.notes,
                    usuario=movement.created_by.full_name,
                )
                for movement in sorted(session.movements, key=lambda item: item.created_at)
            ],
        )

    def _build_sales_day_summary(self, sales: list[Sale]) -> SalesDaySummary:
        cantidad_ventas = len(sales)
        completed_sales = [sale for sale in sales if sale.status == "completed"]
        cancelled_sales = [sale for sale in sales if sale.status == "cancelled"]

        total_bruto = self._quantize(sum((sale.total for sale in sales), Decimal("0.00")))
        total_anulado = self._quantize(sum((sale.total for sale in cancelled_sales), Decimal("0.00")))
        total_descuentos = self._quantize(sum((sale.discount_amount for sale in sales), Decimal("0.00")))
        total_vendido = self._quantize(sum((sale.total for sale in completed_sales), Decimal("0.00")))
        ticket_promedio = self._quantize(
            (total_vendido / len(completed_sales)) if completed_sales else Decimal("0.00")
        )

        total_efectivo = Decimal("0.00")
        total_tarjeta = Decimal("0.00")
        total_transferencia = Decimal("0.00")
        otros: dict[str, Decimal] = {}

        for sale in completed_sales:
            for payment in sale.payments:
                code = payment.payment_method.code
                if code == "cash":
                    total_efectivo += payment.amount
                elif code in {"debit", "credit"}:
                    total_tarjeta += payment.amount
                elif code == "transfer":
                    total_transferencia += payment.amount
                else:
                    others_key = payment.payment_method.name
                    otros[others_key] = otros.get(others_key, Decimal("0.00")) + payment.amount

        total_otros = sum(otros.values(), Decimal("0.00"))

        return SalesDaySummary(
            total_vendido=total_vendido,
            cantidad_ventas=cantidad_ventas,
            cantidad_ventas_completadas=len(completed_sales),
            cantidad_ventas_anuladas=len(cancelled_sales),
            ticket_promedio=ticket_promedio,
            total_bruto=total_bruto,
            total_anulado=total_anulado,
            total_descuentos=total_descuentos,
            total_efectivo=self._quantize(total_efectivo),
            total_tarjeta=self._quantize(total_tarjeta),
            total_transferencia=self._quantize(total_transferencia),
            total_otros=self._quantize(total_otros),
            otros_desglose=[
                ReportNamedAmount(label=label, amount=self._quantize(amount))
                for label, amount in sorted(otros.items(), key=lambda item: item[0].lower())
            ],
        )

    def _resolve_cash_session(
        self,
        *,
        current_user_id: UUID,
        session_id: UUID | None,
        user_id: UUID | None,
        report_date: date | None,
    ) -> CashSession | None:
        base_stmt = select(CashSession).options(
            joinedload(CashSession.cash_register),
            joinedload(CashSession.opened_by).joinedload(User.role),
            joinedload(CashSession.sales).joinedload(Sale.user),
            joinedload(CashSession.sales).joinedload(Sale.payments).joinedload(SalePayment.payment_method),
            joinedload(CashSession.movements).joinedload(CashMovement.created_by).joinedload(User.role),
        )

        if session_id:
            return self.db.scalar(base_stmt.where(CashSession.id == session_id))

        target_user_id = user_id or current_user_id
        stmt = base_stmt.where(CashSession.opened_by_user_id == target_user_id)

        if report_date:
            today_local = datetime.now().astimezone()
            day_start_local = datetime.combine(report_date, time.min, tzinfo=today_local.tzinfo)
            day_end_local = day_start_local + timedelta(days=1)
            stmt = stmt.where(
                CashSession.created_at >= day_start_local.astimezone(UTC),
                CashSession.created_at < day_end_local.astimezone(UTC),
            )
            stmt = stmt.order_by(CashSession.created_at.desc())
            return self.db.scalars(stmt).unique().first()

        open_stmt = stmt.where(CashSession.status == "open").order_by(CashSession.created_at.desc())
        open_session = self.db.scalars(open_stmt).unique().first()
        if open_session:
            return open_session

        today_local = datetime.now().astimezone()
        day_start_local = datetime.combine(today_local.date(), time.min, tzinfo=today_local.tzinfo)
        day_end_local = day_start_local + timedelta(days=1)
        today_stmt = stmt.where(
            CashSession.created_at >= day_start_local.astimezone(UTC),
            CashSession.created_at < day_end_local.astimezone(UTC),
        ).order_by(CashSession.created_at.desc())
        return self.db.scalars(today_stmt).unique().first()

    def _build_cash_daily_summary(self, session: CashSession) -> CashDailySummary:
        sales = list(session.sales or [])
        completed_sales = [sale for sale in sales if sale.status == "completed"]
        cancelled_sales = [sale for sale in sales if sale.status == "cancelled"]
        movements = list(session.movements or [])

        total_bruto = self._quantize(sum((Decimal(sale.total) for sale in sales), Decimal("0.00")))
        total_anulado = self._quantize(sum((Decimal(sale.total) for sale in cancelled_sales), Decimal("0.00")))
        total_descuentos = self._quantize(sum((Decimal(sale.discount_amount) for sale in sales), Decimal("0.00")))
        total_vendido = self._quantize(sum((Decimal(sale.total) for sale in completed_sales), Decimal("0.00")))

        total_efectivo = Decimal("0.00")
        total_tarjeta = Decimal("0.00")
        total_transferencia = Decimal("0.00")
        otros: dict[str, Decimal] = {}

        for sale in completed_sales:
            for payment in sale.payments:
                code = payment.payment_method.code
                if code == "cash":
                    total_efectivo += payment.amount
                elif code in {"debit", "credit"}:
                    total_tarjeta += payment.amount
                elif code == "transfer":
                    total_transferencia += payment.amount
                else:
                    others_key = payment.payment_method.name
                    otros[others_key] = otros.get(others_key, Decimal("0.00")) + payment.amount

        ingresos_manuales = self._quantize(
            sum((Decimal(movement.amount) for movement in movements if movement.movement_type == "income"), Decimal("0.00"))
        )
        retiros_manuales = self._quantize(
            sum((Decimal(movement.amount) for movement in movements if movement.movement_type == "withdrawal"), Decimal("0.00"))
        )
        caja_inicial = self._quantize(Decimal(session.opening_amount))
        caja_esperada = self._quantize(caja_inicial + total_efectivo + ingresos_manuales - retiros_manuales)

        return CashDailySummary(
            ventas_registradas=len(sales),
            ventas_completadas=len(completed_sales),
            ventas_anuladas=len(cancelled_sales),
            total_bruto=total_bruto,
            total_anulado=total_anulado,
            total_descuentos=total_descuentos,
            total_vendido=total_vendido,
            total_efectivo=self._quantize(total_efectivo),
            total_tarjeta=self._quantize(total_tarjeta),
            total_transferencia=self._quantize(total_transferencia),
            total_otros=self._quantize(sum(otros.values(), Decimal("0.00"))),
            otros_desglose=[
                ReportNamedAmount(label=label, amount=self._quantize(amount))
                for label, amount in sorted(otros.items(), key=lambda item: item[0].lower())
            ],
            caja_inicial=caja_inicial,
            ingresos_manuales=ingresos_manuales,
            retiros_manuales=retiros_manuales,
            caja_esperada=caja_esperada,
            caja_contada=self._quantize(Decimal(session.counted_amount)) if session.counted_amount is not None else None,
            diferencia=self._quantize(Decimal(session.difference_amount)) if session.difference_amount is not None else None,
        )

    @classmethod
    def _quantize(cls, value: Decimal) -> Decimal:
        return value.quantize(cls.MONEY_QUANTIZER)

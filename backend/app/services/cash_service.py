from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal

from fastapi import status
from sqlalchemy.orm import Session

from app.core.constants import PERMISSION_CASHIERS, PERMISSION_SETTINGS
from app.core.exceptions import AppError
from app.core.reason_catalog import get_reason_item, list_reason_catalog
from app.core.security import verify_password
from app.models.cash import CashSession, CashSessionClosureDenomination
from app.repositories.cash_repository import (
    CashMovementRepository,
    CashRegisterRepository,
    CashSessionClosureRepository,
    CashSessionRepository,
)
from app.repositories.user_repository import UserRepository
from app.schemas.cash import (
    CashMovementCreate,
    CashMovementRead,
    CashReasonCatalogRead,
    CashRegisterCreate,
    CashRegisterUpdate,
    CashSessionClose,
    CashSessionClosureDenominationRead,
    CashSessionClosureRead,
    CashSessionMetricsRead,
    CashSessionOpen,
    CashSessionReopen,
    CashSessionSummaryRead,
)


class CashRegisterService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.cash_registers = CashRegisterRepository(db)

    def list_registers(self):
        return self.cash_registers.list()

    def create_register(self, payload: CashRegisterCreate):
        register = self.cash_registers.create(payload.model_dump())
        self.db.commit()
        return register

    def update_register(self, register_id: str, payload: CashRegisterUpdate):
        register = self.cash_registers.get_by_id(register_id)
        if not register:
            raise AppError("Caja no encontrada", status.HTTP_404_NOT_FOUND)
        register = self.cash_registers.update(register, payload.model_dump(exclude_unset=True))
        self.db.commit()
        return register


class CashSessionService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.cash_registers = CashRegisterRepository(db)
        self.cash_sessions = CashSessionRepository(db)
        self.cash_movements = CashMovementRepository(db)
        self.cash_closures = CashSessionClosureRepository(db)
        self.users = UserRepository(db)

    def list_reason_catalog(self, reason_type: str | None = None) -> list[CashReasonCatalogRead]:
        if reason_type and reason_type not in {"income", "withdrawal", "sale_cancellation", "cash_reopen"}:
            raise AppError("Tipo de motivo no valido", status.HTTP_422_UNPROCESSABLE_ENTITY)
        return [CashReasonCatalogRead.model_validate(item) for item in list_reason_catalog(reason_type)]

    def list_open_sessions(self):
        return [self._to_summary(session) for session in self.cash_sessions.list_open_sessions()]

    def list_closed_sessions(self, current_user_id: str, current_permissions: list[str]) -> list[CashSessionClosureRead]:
        can_review_all = any(permission in current_permissions for permission in (PERMISSION_CASHIERS, PERMISSION_SETTINGS))
        sessions = self.cash_sessions.list_closed_sessions(None if can_review_all else current_user_id)
        closures: list[CashSessionClosureRead] = []
        for session in sessions:
            latest_closure = max(session.closures or [], key=lambda item: item.created_at, default=None)
            if latest_closure:
                closures.append(self._to_closure_read(latest_closure))
        return closures

    def get_current_session(self, user_id: str) -> CashSessionSummaryRead | None:
        session = self.cash_sessions.get_open_by_user(user_id)
        if not session:
            return None
        return self._to_summary(session)

    def open_session(self, user_id: str, payload: CashSessionOpen):
        register = self.cash_registers.get_by_id(payload.cash_register_id)
        if not register or not register.is_active:
            raise AppError("Caja no disponible", status.HTTP_404_NOT_FOUND)
        if self.cash_sessions.get_open_by_user(user_id):
            raise AppError("Ya tienes una caja abierta", status.HTTP_409_CONFLICT)
        active_register_session = self.cash_sessions.get_open_by_register(str(payload.cash_register_id))
        if active_register_session:
            raise AppError("La caja seleccionada ya se encuentra abierta", status.HTTP_409_CONFLICT)

        session = self.cash_sessions.create(
            {
                "cash_register_id": payload.cash_register_id,
                "opened_by_user_id": user_id,
                "opening_amount": payload.opening_amount,
                "status": "open",
            }
        )
        self.db.commit()
        return self._to_summary(self.cash_sessions.get_by_id(str(session.id)) or session)

    def close_session(self, session_id: str, user_id: str, payload: CashSessionClose) -> CashSessionSummaryRead:
        session = self.cash_sessions.get_by_id(session_id)
        if not session:
            raise AppError("Sesion de caja no encontrada", status.HTTP_404_NOT_FOUND)
        if session.status != "open":
            raise AppError("La sesion ya se encuentra cerrada", status.HTTP_409_CONFLICT)
        if str(session.opened_by_user_id) != user_id:
            raise AppError("Solo el cajero que abrio la caja puede cerrarla", status.HTTP_403_FORBIDDEN)

        metrics = self._build_metrics(session)
        counted_amount = Decimal(payload.counted_amount)
        difference_amount = counted_amount - Decimal(metrics.expected_cash_amount)
        observation = payload.observation.strip() if payload.observation else None
        supervised_by_user_id = None

        if difference_amount != Decimal("0.00"):
            if not observation:
                raise AppError("Debes registrar una observacion cuando existe diferencia de caja", status.HTTP_422_UNPROCESSABLE_ENTITY)
            supervised_by_user_id = self._resolve_supervisor(
                current_user_id=user_id,
                supervisor_username=payload.supervisor_username,
                supervisor_password=payload.supervisor_password,
            )

        try:
            session.counted_amount = counted_amount
            session.closing_amount = metrics.expected_cash_amount
            session.difference_amount = difference_amount
            session.closing_observation = observation
            session.closed_by_user_id = user_id
            session.supervised_by_user_id = supervised_by_user_id
            session.status = "closed"

            closure = self.cash_closures.create(
                {
                    "cash_session_id": session.id,
                    "closed_by_user_id": user_id,
                    "supervised_by_user_id": supervised_by_user_id,
                    "expected_amount": metrics.expected_cash_amount,
                    "counted_amount": counted_amount,
                    "difference_amount": difference_amount,
                    "observation": observation,
                }
            )
            self.db.flush()

            for denomination in payload.denominations:
                if denomination.quantity <= 0:
                    continue
                self.db.add(
                    CashSessionClosureDenomination(
                        cash_session_closure_id=closure.id,
                        denomination_value=denomination.denomination_value,
                        quantity=denomination.quantity,
                        subtotal=Decimal(denomination.denomination_value) * denomination.quantity,
                    )
                )
            self.db.commit()
            refreshed = self.cash_sessions.get_by_id(session_id) or session
            return self._to_summary(refreshed)
        except Exception:
            self.db.rollback()
            raise

    def reopen_session(
        self,
        session_id: str,
        current_user_id: str,
        payload: CashSessionReopen,
    ) -> CashSessionSummaryRead:
        session = self.cash_sessions.get_by_id(session_id)
        if not session:
            raise AppError("Sesion de caja no encontrada", status.HTTP_404_NOT_FOUND)
        if session.status != "closed":
            raise AppError("Solo se pueden reabrir sesiones cerradas", status.HTTP_409_CONFLICT)
        if self.cash_sessions.get_open_by_register(str(session.cash_register_id)):
            raise AppError("La caja ya tiene una sesion abierta", status.HTTP_409_CONFLICT)
        if self.cash_sessions.get_open_by_user(str(session.opened_by_user_id)):
            raise AppError("El cajero responsable ya tiene una caja abierta", status.HTTP_409_CONFLICT)

        reason_item = get_reason_item("cash_reopen", payload.reason_code)
        if not reason_item:
            raise AppError("Motivo de reapertura no valido", status.HTTP_422_UNPROCESSABLE_ENTITY)
        notes = payload.notes.strip() if payload.notes else None
        if reason_item["requires_notes"] and not notes:
            raise AppError("Debes detallar el motivo de reapertura seleccionado", status.HTTP_422_UNPROCESSABLE_ENTITY)

        latest_closure = self.cash_closures.get_latest_for_session(session_id)
        if not latest_closure:
            raise AppError("No existe un cierre registrado para esta sesion", status.HTTP_409_CONFLICT)
        if latest_closure.reopened_at:
            raise AppError("El ultimo cierre de esta caja ya fue reabierto", status.HTTP_409_CONFLICT)

        latest_closure.reopened_at = datetime.now(UTC)
        latest_closure.reopened_by_user_id = current_user_id
        latest_closure.reopen_reason = self._compose_reason_text(reason_item["label"], notes)

        session.status = "open"
        session.counted_amount = None
        session.closing_amount = None
        session.difference_amount = None
        session.closing_observation = None
        session.closed_by_user_id = None
        session.supervised_by_user_id = None

        self.db.commit()
        refreshed = self.cash_sessions.get_by_id(session_id) or session
        return self._to_summary(refreshed)

    def create_manual_movement(
        self,
        session_id: str,
        user_id: str,
        payload: CashMovementCreate,
    ) -> CashSessionSummaryRead:
        session = self.cash_sessions.get_by_id(session_id)
        if not session:
            raise AppError("Sesion de caja no encontrada", status.HTTP_404_NOT_FOUND)
        if session.status != "open":
            raise AppError("La sesion de caja no se encuentra abierta", status.HTTP_409_CONFLICT)
        if str(session.opened_by_user_id) != user_id:
            raise AppError("Solo el cajero responsable puede registrar movimientos en esta caja", status.HTTP_403_FORBIDDEN)

        reason_item = get_reason_item(payload.movement_type, payload.reason_code)
        if not reason_item:
            raise AppError("Motivo de movimiento no valido", status.HTTP_422_UNPROCESSABLE_ENTITY)
        notes = payload.notes.strip() if payload.notes else None
        if reason_item["requires_notes"] and not notes:
            raise AppError("Debes detallar el motivo seleccionado", status.HTTP_422_UNPROCESSABLE_ENTITY)

        self.cash_movements.create(
            {
                "cash_session_id": session.id,
                "created_by_user_id": user_id,
                "movement_type": payload.movement_type,
                "amount": payload.amount,
                "reason": reason_item["label"],
                "notes": notes,
            }
        )
        self.db.commit()
        refreshed = self.cash_sessions.get_by_id(session_id) or session
        return self._to_summary(refreshed)

    def _resolve_supervisor(
        self,
        *,
        current_user_id: str,
        supervisor_username: str | None,
        supervisor_password: str | None,
    ) -> str:
        if not supervisor_username or not supervisor_password:
            raise AppError("Debes validar el cierre con un supervisor cuando existe diferencia", status.HTTP_422_UNPROCESSABLE_ENTITY)
        supervisor = self.users.get_by_username(supervisor_username.strip())
        if not supervisor or not supervisor.is_active:
            raise AppError("Supervisor no disponible", status.HTTP_404_NOT_FOUND)
        if str(supervisor.id) == current_user_id:
            raise AppError("El supervisor debe ser distinto del cajero que cierra la caja", status.HTTP_409_CONFLICT)
        granted_permissions = set(supervisor.role.permissions or [])
        if not ({PERMISSION_CASHIERS, PERMISSION_SETTINGS} & granted_permissions):
            raise AppError("El usuario supervisor no tiene permisos para autorizar cierres con diferencia", status.HTTP_403_FORBIDDEN)
        if not verify_password(supervisor_password, supervisor.password_hash):
            raise AppError("Credenciales de supervisor invalidas", status.HTTP_401_UNAUTHORIZED)
        return str(supervisor.id)

    @staticmethod
    def _compose_reason_text(base_label: str, notes: str | None) -> str:
        return f"{base_label}: {notes}" if notes else base_label

    def _to_summary(self, session: CashSession) -> CashSessionSummaryRead:
        return CashSessionSummaryRead(
            id=session.id,
            created_at=session.created_at,
            updated_at=session.updated_at,
            cash_register_id=session.cash_register_id,
            opened_by_user_id=session.opened_by_user_id,
            opening_amount=session.opening_amount,
            closing_amount=session.closing_amount,
            counted_amount=session.counted_amount,
            difference_amount=session.difference_amount,
            closing_observation=session.closing_observation,
            status=session.status,
            cash_register=session.cash_register,
            opened_by=session.opened_by,
            closed_by=session.closed_by,
            supervised_by=session.supervised_by,
            movements=[
                CashMovementRead.model_validate(movement)
                for movement in sorted(session.movements or [], key=lambda item: item.created_at, reverse=True)
            ],
            metrics=self._build_metrics(session),
        )

    def _to_closure_read(self, closure) -> CashSessionClosureRead:
        session = closure.cash_session
        return CashSessionClosureRead(
            id=closure.id,
            created_at=closure.created_at,
            updated_at=closure.updated_at,
            cash_session_id=closure.cash_session_id,
            closed_by_user_id=closure.closed_by_user_id,
            supervised_by_user_id=closure.supervised_by_user_id,
            expected_amount=closure.expected_amount,
            counted_amount=closure.counted_amount,
            difference_amount=closure.difference_amount,
            observation=closure.observation,
            reopened_at=closure.reopened_at,
            reopened_by_user_id=closure.reopened_by_user_id,
            reopen_reason=closure.reopen_reason,
            closed_by=closure.closed_by,
            supervised_by=closure.supervised_by,
            reopened_by=closure.reopened_by,
            denominations=[
                CashSessionClosureDenominationRead.model_validate(denomination)
                for denomination in sorted(closure.denominations or [], key=lambda item: item.denomination_value, reverse=True)
            ],
            cash_register_name=session.cash_register.name,
            opened_by_name=session.opened_by.full_name,
            opened_at=session.created_at,
            session_status=session.status,
        )

    @staticmethod
    def _build_metrics(session: CashSession) -> CashSessionMetricsRead:
        sales = list(session.sales or [])
        completed_sales = [sale for sale in sales if sale.status == "completed"]
        cancelled_sales = [sale for sale in sales if sale.status == "cancelled"]
        total_sales_amount = sum((Decimal(sale.total) for sale in completed_sales), Decimal("0.00"))
        cash_sales_amount = sum(
            (
                Decimal(payment.amount)
                for sale in completed_sales
                for payment in sale.payments
                if payment.payment_method.code == "cash"
            ),
            Decimal("0.00"),
        )
        manual_income_amount = sum(
            (Decimal(movement.amount) for movement in session.movements if movement.movement_type == "income"),
            Decimal("0.00"),
        )
        manual_withdrawal_amount = sum(
            (Decimal(movement.amount) for movement in session.movements if movement.movement_type == "withdrawal"),
            Decimal("0.00"),
        )
        expected_cash_amount = (
            Decimal(session.opening_amount)
            + cash_sales_amount
            + manual_income_amount
            - manual_withdrawal_amount
        )

        return CashSessionMetricsRead(
            sales_count=len(sales),
            completed_sales_count=len(completed_sales),
            cancelled_sales_count=len(cancelled_sales),
            total_sales_amount=total_sales_amount,
            cash_sales_amount=cash_sales_amount,
            manual_income_amount=manual_income_amount,
            manual_withdrawal_amount=manual_withdrawal_amount,
            expected_cash_amount=expected_cash_amount,
        )

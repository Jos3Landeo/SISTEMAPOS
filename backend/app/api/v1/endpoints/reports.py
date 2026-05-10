from datetime import date
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.api.dependencies import require_permissions
from app.core.constants import PERMISSION_REPORTS
from app.db.session import get_db
from app.schemas.report import CashDailyReportRead, SalesDayReportRead
from app.services.report_service import ReportService


router = APIRouter()


@router.get("/ventas-dia", response_model=SalesDayReportRead)
def get_sales_day_report(
    _: object = Depends(require_permissions(PERMISSION_REPORTS)),
    db: Session = Depends(get_db),
    search: str | None = Query(default=None, min_length=1),
    payment_method_id: UUID | None = Query(default=None),
    user_id: UUID | None = Query(default=None),
    status: str = Query(default="completed"),
) -> SalesDayReportRead:
    return ReportService(db).get_sales_day_report(
        search=search,
        payment_method_id=payment_method_id,
        user_id=user_id,
        status=status,
    )


@router.get("/caja-diaria", response_model=CashDailyReportRead)
def get_cash_daily_report(
    current_user = Depends(require_permissions(PERMISSION_REPORTS)),
    db: Session = Depends(get_db),
    session_id: UUID | None = Query(default=None),
    user_id: UUID | None = Query(default=None),
    report_date: date | None = Query(default=None),
) -> CashDailyReportRead:
    return ReportService(db).get_cash_daily_report(
        current_user_id=current_user.id,
        session_id=session_id,
        user_id=user_id,
        report_date=report_date,
    )

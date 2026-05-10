from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel


class ReportPaymentMethodOption(BaseModel):
    id: UUID
    name: str
    code: str


class ReportUserOption(BaseModel):
    id: UUID
    full_name: str
    username: str


class ReportNamedAmount(BaseModel):
    label: str
    amount: Decimal


class SalesDaySummary(BaseModel):
    total_vendido: Decimal
    cantidad_ventas: int
    cantidad_ventas_completadas: int
    cantidad_ventas_anuladas: int
    ticket_promedio: Decimal
    total_bruto: Decimal
    total_anulado: Decimal
    total_descuentos: Decimal
    total_efectivo: Decimal
    total_tarjeta: Decimal
    total_transferencia: Decimal
    total_otros: Decimal
    otros_desglose: list[ReportNamedAmount]


class SalesDaySaleItem(BaseModel):
    id: UUID
    folio: str
    fecha_hora: datetime
    hora: str
    cajero: str
    metodo_pago: str
    total: Decimal
    estado: str


class SalesDayAvailableFilters(BaseModel):
    metodos_pago: list[ReportPaymentMethodOption]
    cajeros: list[ReportUserOption]
    estados: list[str]


class SalesDayReportRead(BaseModel):
    fecha: date
    generado_en: datetime
    periodo_desde: datetime | None = None
    periodo_hasta: datetime | None = None
    resumen: SalesDaySummary
    ventas: list[SalesDaySaleItem]
    filtros_disponibles: SalesDayAvailableFilters


class CashDailyMovementItem(BaseModel):
    id: UUID
    fecha_hora: datetime
    tipo: str
    monto: Decimal
    motivo: str
    observacion: str | None = None
    usuario: str


class CashDailySaleItem(BaseModel):
    id: UUID
    folio: str
    fecha_hora: datetime
    cajero: str
    metodo_pago: str
    total: Decimal
    estado: str


class CashDailySummary(BaseModel):
    ventas_registradas: int
    ventas_completadas: int
    ventas_anuladas: int
    total_bruto: Decimal
    total_anulado: Decimal
    total_descuentos: Decimal
    total_vendido: Decimal
    total_efectivo: Decimal
    total_tarjeta: Decimal
    total_transferencia: Decimal
    total_otros: Decimal
    otros_desglose: list[ReportNamedAmount]
    caja_inicial: Decimal
    ingresos_manuales: Decimal
    retiros_manuales: Decimal
    caja_esperada: Decimal
    caja_contada: Decimal | None = None
    diferencia: Decimal | None = None


class CashDailyReportRead(BaseModel):
    fecha: date
    generado_en: datetime
    session_id: UUID
    estado: str
    caja: str
    ubicacion_caja: str | None = None
    usuario: str
    apertura: datetime
    cierre: datetime | None = None
    resumen: CashDailySummary
    ventas: list[CashDailySaleItem]
    movimientos: list[CashDailyMovementItem]

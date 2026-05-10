from __future__ import annotations

from typing import Literal, TypedDict


ReasonType = Literal["income", "withdrawal", "sale_cancellation", "cash_reopen"]


class ReasonCatalogItem(TypedDict):
    code: str
    label: str
    description: str
    requires_notes: bool


REASON_CATALOG: dict[ReasonType, list[ReasonCatalogItem]] = {
    "income": [
        {
            "code": "change_fund",
            "label": "Fondo adicional",
            "description": "Ingreso de sencillo o caja de apoyo para operar mejor.",
            "requires_notes": False,
        },
        {
            "code": "cash_adjustment",
            "label": "Regularizacion de caja",
            "description": "Ajuste interno por cuadratura o correccion operativa.",
            "requires_notes": False,
        },
        {
            "code": "other_income",
            "label": "Otro ingreso",
            "description": "Ingreso manual no cubierto por los motivos anteriores.",
            "requires_notes": True,
        },
    ],
    "withdrawal": [
        {
            "code": "treasury_withdrawal",
            "label": "Retiro a tesoreria",
            "description": "Extraccion de efectivo para resguardo o entrega.",
            "requires_notes": False,
        },
        {
            "code": "operational_expense",
            "label": "Gasto operativo",
            "description": "Pago menor relacionado con la operacion del local.",
            "requires_notes": False,
        },
        {
            "code": "other_withdrawal",
            "label": "Otro retiro",
            "description": "Retiro manual no cubierto por los motivos anteriores.",
            "requires_notes": True,
        },
    ],
    "sale_cancellation": [
        {
            "code": "cashier_error",
            "label": "Error de cajero",
            "description": "Cobro o registro incorrecto detectado en caja.",
            "requires_notes": False,
        },
        {
            "code": "customer_cancelled",
            "label": "Cliente desistio",
            "description": "El cliente decidio no continuar con la compra.",
            "requires_notes": False,
        },
        {
            "code": "duplicate_ticket",
            "label": "Ticket duplicado",
            "description": "Se genero una venta duplicada y debe anularse.",
            "requires_notes": False,
        },
        {
            "code": "other_cancellation",
            "label": "Otra anulacion",
            "description": "Motivo no cubierto por los catalogados.",
            "requires_notes": True,
        },
    ],
    "cash_reopen": [
        {
            "code": "closure_correction",
            "label": "Correccion de cierre",
            "description": "El cierre requiere ajuste o una validacion adicional.",
            "requires_notes": False,
        },
        {
            "code": "pending_operation",
            "label": "Operacion pendiente",
            "description": "Quedo una operacion relevante sin completar.",
            "requires_notes": False,
        },
        {
            "code": "other_reopen",
            "label": "Otra reapertura",
            "description": "Motivo no cubierto por las opciones anteriores.",
            "requires_notes": True,
        },
    ],
}


def list_reason_catalog(reason_type: ReasonType | None = None) -> list[dict[str, str | bool]]:
    if reason_type:
        return [dict(item, reason_type=reason_type) for item in REASON_CATALOG[reason_type]]
    items: list[dict[str, str | bool]] = []
    for current_type, reasons in REASON_CATALOG.items():
        items.extend(dict(item, reason_type=current_type) for item in reasons)
    return items


def get_reason_item(reason_type: ReasonType, code: str) -> ReasonCatalogItem | None:
    normalized_code = code.strip().lower()
    for item in REASON_CATALOG[reason_type]:
        if item["code"] == normalized_code:
            return item
    return None

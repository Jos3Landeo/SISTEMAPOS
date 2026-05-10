import type { CajaDiariaReport } from "../types/report";

export function formatMoney(value: string | number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(Number(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatDateOnly(value: string) {
  return new Intl.DateTimeFormat("es-CL").format(new Date(`${value}T00:00:00`));
}

export function formatTimeOnly(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatClosureLine(label: string, value: string, lineWidth = 32) {
  const labelWithColon = `${label}:`;
  const spaces = Math.max(1, lineWidth - labelWithColon.length - value.length);
  return `${labelWithColon}${" ".repeat(spaces)}${value}`;
}

export function buildCajaDiariaPdfLines(report: CajaDiariaReport) {
  const countedLabel = report.estado === "closed" ? formatMoney(report.resumen.caja_contada || 0) : "Pendiente cierre";
  const differenceLabel = report.estado === "closed" ? formatMoney(report.resumen.diferencia || 0) : "Pendiente cierre";
  const lines = [
    "REPORTE CAJA DIARIA",
    `Caja: ${report.caja}`,
    `Usuario: ${report.usuario}`,
    `Fecha: ${formatDateOnly(report.fecha)}`,
    `Apertura: ${formatDateTime(report.apertura)}`,
    `Cierre: ${report.cierre ? formatDateTime(report.cierre) : "Caja abierta"}`,
    "",
    `Caja inicial: ${formatMoney(report.resumen.caja_inicial)}`,
    `Ventas en efectivo: ${formatMoney(report.resumen.total_efectivo)}`,
    `Ingresos manuales: ${formatMoney(report.resumen.ingresos_manuales)}`,
    `Retiros manuales: ${formatMoney(report.resumen.retiros_manuales)}`,
    `Caja esperada: ${formatMoney(report.resumen.caja_esperada)}`,
    `Caja contada: ${countedLabel}`,
    `Diferencia: ${differenceLabel}`,
    "",
    "MOVIMIENTOS",
    "------------------------------------------------------------",
  ];

  report.movimientos.forEach((movement) => {
    lines.push(
      `${formatDateTime(movement.fecha_hora)} | ${movement.tipo === "income" ? "Ingreso" : "Retiro"}`,
      `${movement.motivo} | ${formatMoney(movement.monto)} | ${movement.usuario}`,
      "------------------------------------------------------------",
    );
  });

  lines.push("", "VENTAS", "------------------------------------------------------------");
  report.ventas.forEach((sale) => {
    lines.push(
      `${formatDateTime(sale.fecha_hora)} | ${sale.folio}`,
      `${sale.metodo_pago} | ${sale.estado === "completed" ? "Completada" : "Anulada"} | ${formatMoney(sale.total)}`,
      "------------------------------------------------------------",
    );
  });

  return lines;
}

export function buildCierreCajaLines(
  report: CajaDiariaReport,
  company: { companyName: string; companyTaxId: string; companyAddress: string; companyPhone?: string; companyEmail?: string },
) {
  const salesLines: string[] = [];

  report.ventas.forEach((sale) => {
    salesLines.push(
      `Folio: ${sale.folio}`,
      `Fecha: ${formatDateTime(sale.fecha_hora)}`,
      `Cajero: ${sale.cajero}`,
      `Metodo: ${sale.metodo_pago}`,
      `Estado: ${sale.estado === "completed" ? "Completada" : "Anulada"}`,
      `Total: ${sale.estado === "completed" ? formatMoney(sale.total) : "$0"}`,
    );
    if (sale.estado === "cancelled") {
      salesLines.push(`Anulado original: ${formatMoney(sale.total)}`);
    }
    salesLines.push("--------------------------------");
  });

  const countedLabel = report.estado === "closed" ? formatMoney(report.resumen.caja_contada || 0) : "Pendiente cierre";
  const differenceLabel = report.estado === "closed" ? formatMoney(report.resumen.diferencia || 0) : "Pendiente cierre";
  const observation =
    report.estado !== "closed"
      ? "Caja aun abierta. Cierre definitivo pendiente."
      : report.resumen.diferencia && Number(report.resumen.diferencia) !== 0
        ? "Diferencia detectada en caja."
        : "Caja cerrada sin diferencias.";

  return [
    "================================",
    `       ${company.companyName || "MINIMARKET"}`.slice(0, 32),
    "        CIERRE DE CAJA",
    "================================",
    company.companyTaxId ? `RUT: ${company.companyTaxId}` : "",
    company.companyAddress || "",
    company.companyPhone ? `Tel: ${company.companyPhone}` : "",
    company.companyEmail ? `Email: ${company.companyEmail}` : "",
    `Fecha cierre: ${formatDateOnly(report.fecha)}`,
    `Hora cierre: ${formatTimeOnly(report.generado_en)}`,
    `Usuario: ${report.usuario}`,
    `Caja: ${report.caja}`,
    "--------------------------------",
    "PERIODO",
    "--------------------------------",
    `Desde: ${formatDateTime(report.apertura)}`,
    `Hasta: ${report.cierre ? formatDateTime(report.cierre) : formatDateTime(report.generado_en)}`,
    "--------------------------------",
    "VENTAS DEL DIA",
    "--------------------------------",
    ...salesLines,
    "RESUMEN DE VENTAS",
    "--------------------------------",
    formatClosureLine("Ventas registradas", String(report.resumen.ventas_registradas)),
    formatClosureLine("Ventas completadas", String(report.resumen.ventas_completadas)),
    formatClosureLine("Ventas anuladas", String(report.resumen.ventas_anuladas)),
    "--------------------------------",
    formatClosureLine("Total bruto", formatMoney(report.resumen.total_bruto)),
    formatClosureLine("Total anulado", formatMoney(report.resumen.total_anulado)),
    formatClosureLine("Descuentos", formatMoney(report.resumen.total_descuentos)),
    "--------------------------------",
    formatClosureLine("TOTAL VENDIDO", formatMoney(report.resumen.total_vendido)),
    "--------------------------------",
    "MEDIOS DE PAGO",
    "--------------------------------",
    formatClosureLine("Efectivo", formatMoney(report.resumen.total_efectivo)),
    formatClosureLine("Debito/Tarjeta", formatMoney(report.resumen.total_tarjeta)),
    formatClosureLine("Transferencia", formatMoney(report.resumen.total_transferencia)),
    formatClosureLine("Otro", formatMoney(report.resumen.total_otros)),
    "--------------------------------",
    formatClosureLine("TOTAL PAGOS", formatMoney(report.resumen.total_vendido)),
    "--------------------------------",
    "CAJA",
    "--------------------------------",
    formatClosureLine("Caja inicial", formatMoney(report.resumen.caja_inicial)),
    formatClosureLine("Efectivo ventas", formatMoney(report.resumen.total_efectivo)),
    formatClosureLine("Ingresos manuales", formatMoney(report.resumen.ingresos_manuales)),
    formatClosureLine("Retiros manuales", formatMoney(report.resumen.retiros_manuales)),
    "--------------------------------",
    formatClosureLine("Caja esperada", formatMoney(report.resumen.caja_esperada)),
    formatClosureLine("Caja contada", countedLabel),
    formatClosureLine("Diferencia", differenceLabel),
    "--------------------------------",
    "OBSERVACION",
    "--------------------------------",
    observation,
    "--------------------------------",
    "Firma responsable:",
    "",
    "________________________",
    "================================",
    "        FIN DEL CIERRE",
    "================================",
  ].filter(Boolean);
}

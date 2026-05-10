import { Download, FileText, Printer } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useGeneralSettings } from "../../settings/hooks/useSettings";
import { useSettingsStore } from "../../settings/store/useSettingsStore";
import { useCajaDiariaReport } from "../hooks/useReports";
import { buildCajaDiariaPdfLines, buildCierreCajaLines, formatDateTime, formatMoney } from "../lib/cashDailyReport";
import { downloadTextPdf, exportHtmlTableToExcel, printThermalReport } from "../lib/reportExport";

function exportCajaDiariaExcel(report: ReturnType<typeof useCajaDiariaReport>["data"]) {
  if (!report) {
    return;
  }

  const salesRows = report.ventas
    .map(
      (sale) => `
        <tr>
          <td>${formatDateTime(sale.fecha_hora)}</td>
          <td>${sale.folio}</td>
          <td>${sale.cajero}</td>
          <td>${sale.metodo_pago}</td>
          <td>${sale.estado === "completed" ? "Completada" : "Anulada"}</td>
          <td>${formatMoney(sale.total)}</td>
        </tr>
      `,
    )
    .join("");

  const movementRows = report.movimientos
    .map(
      (movement) => `
        <tr>
          <td>${formatDateTime(movement.fecha_hora)}</td>
          <td>${movement.tipo === "income" ? "Ingreso" : "Retiro"}</td>
          <td>${movement.motivo}</td>
          <td>${movement.usuario}</td>
          <td>${formatMoney(movement.monto)}</td>
        </tr>
      `,
    )
    .join("");

  exportHtmlTableToExcel(
    `caja-diaria-${report.fecha}.xls`,
    "Caja diaria",
    `
      <h1>Caja diaria</h1>
      <p>Caja: ${report.caja}</p>
      <p>Usuario: ${report.usuario}</p>
      <p>Apertura: ${formatDateTime(report.apertura)}</p>
      <p>Cierre: ${report.cierre ? formatDateTime(report.cierre) : "Caja abierta"}</p>
      <table border="1">
        <tr><th>Indicador</th><th>Valor</th></tr>
        <tr><td>Caja inicial</td><td>${formatMoney(report.resumen.caja_inicial)}</td></tr>
        <tr><td>Ventas en efectivo</td><td>${formatMoney(report.resumen.total_efectivo)}</td></tr>
        <tr><td>Ingresos manuales</td><td>${formatMoney(report.resumen.ingresos_manuales)}</td></tr>
        <tr><td>Retiros manuales</td><td>${formatMoney(report.resumen.retiros_manuales)}</td></tr>
        <tr><td>Caja esperada</td><td>${formatMoney(report.resumen.caja_esperada)}</td></tr>
        <tr><td>Caja contada</td><td>${formatMoney(report.resumen.caja_contada || 0)}</td></tr>
        <tr><td>Diferencia</td><td>${formatMoney(report.resumen.diferencia || 0)}</td></tr>
      </table>
      <br />
      <h2>Movimientos manuales</h2>
      <table border="1">
        <tr><th>Fecha</th><th>Tipo</th><th>Motivo</th><th>Usuario</th><th>Monto</th></tr>
        ${movementRows}
      </table>
      <br />
      <h2>Ventas</h2>
      <table border="1">
        <tr><th>Fecha</th><th>Folio</th><th>Cajero</th><th>Metodo</th><th>Estado</th><th>Total</th></tr>
        ${salesRows}
      </table>
    `,
  );
}

export function CajaDiariaReportePage() {
  const generalSettings = useSettingsStore((state) => state.general);
  useGeneralSettings();
  const { data, isLoading, error } = useCajaDiariaReport();

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Caja diaria"
        description={data ? `Caja ${data.caja} - ${data.usuario}` : "Resumen del turno, efectivo esperado y diferencia de caja."}
      />

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => exportCajaDiariaExcel(data)} disabled={!data}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => data && downloadTextPdf(`caja-diaria-${data.fecha}.pdf`, "Caja diaria", buildCajaDiariaPdfLines(data))}
          disabled={!data}
        >
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
        <Button
          type="button"
          onClick={() =>
            data &&
            printThermalReport(
              "Cierre de caja",
              buildCierreCajaLines(data, {
                companyName: generalSettings.companyName,
                companyTaxId: generalSettings.companyTaxId,
                companyAddress: generalSettings.companyAddress,
                companyPhone: generalSettings.companyPhone,
                companyEmail: generalSettings.companyEmail,
              }),
            )
          }
          disabled={!data}
        >
          <Printer className="mr-2 h-4 w-4" />
          Imprimir cierre
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Cargando reporte...</p> : null}
      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error instanceof Error ? error.message : "No fue posible cargar el reporte"}
        </p>
      ) : null}

      {data ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Caja inicial</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(data.resumen.caja_inicial)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Ventas en efectivo</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(data.resumen.total_efectivo)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Ingresos manuales</p>
              <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatMoney(data.resumen.ingresos_manuales)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Retiros manuales</p>
              <p className="mt-2 text-2xl font-semibold text-amber-700">{formatMoney(data.resumen.retiros_manuales)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Caja esperada</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(data.resumen.caja_esperada)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Caja contada</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(data.resumen.caja_contada || 0)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Diferencia</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{formatMoney(data.resumen.diferencia || 0)}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
              <p className="text-sm text-slate-500">Ventas registradas</p>
              <p className="mt-2 text-2xl font-semibold text-slate-950">{data.resumen.ventas_registradas}</p>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_420px]">
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
              <h2 className="text-lg font-semibold text-slate-950">Ventas del turno</h2>
              <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Folio</th>
                      <th className="px-4 py-3 font-medium">Metodo</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.ventas.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-slate-500" colSpan={5}>
                          No hay ventas asociadas a esta sesion.
                        </td>
                      </tr>
                    ) : (
                      data.ventas.map((sale) => (
                        <tr key={sale.id}>
                          <td className="px-4 py-3 text-slate-600">{formatDateTime(sale.fecha_hora)}</td>
                          <td className="px-4 py-3 font-medium text-slate-900">{sale.folio}</td>
                          <td className="px-4 py-3 text-slate-600">{sale.metodo_pago}</td>
                          <td className="px-4 py-3 text-slate-600">{sale.estado === "completed" ? "Completada" : "Anulada"}</td>
                          <td className="px-4 py-3 text-right text-slate-700">{formatMoney(sale.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className="space-y-6">
              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slate-950">Sesion</h2>
                <div className="mt-4 space-y-2 text-sm text-slate-600">
                  <p>Caja: {data.caja}</p>
                  {data.ubicacion_caja ? <p>Ubicacion: {data.ubicacion_caja}</p> : null}
                  <p>Usuario: {data.usuario}</p>
                  <p>Apertura: {formatDateTime(data.apertura)}</p>
                  <p>Cierre: {data.cierre ? formatDateTime(data.cierre) : "Caja abierta"}</p>
                  <p>Estado: {data.estado === "closed" ? "Cerrada" : "Abierta"}</p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
                <h2 className="text-lg font-semibold text-slate-950">Movimientos manuales</h2>
                <div className="mt-4 space-y-3">
                  {data.movimientos.length === 0 ? (
                    <p className="text-sm text-slate-500">No hay ingresos ni retiros manuales en esta sesion.</p>
                  ) : (
                    data.movimientos.map((movement) => (
                      <div key={movement.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-sm font-medium text-slate-900">
                            {movement.tipo === "income" ? "Ingreso" : "Retiro"}
                          </span>
                          <span className={`text-sm font-semibold ${movement.tipo === "income" ? "text-emerald-700" : "text-amber-700"}`}>
                            {movement.tipo === "income" ? "+" : "-"}
                            {formatMoney(movement.monto)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-700">{movement.motivo}</p>
                        {movement.observacion ? <p className="mt-1 text-xs text-slate-500">{movement.observacion}</p> : null}
                        <p className="mt-2 text-xs text-slate-500">
                          {movement.usuario} - {formatDateTime(movement.fecha_hora)}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </aside>
          </div>
        </>
      ) : null}
    </section>
  );
}

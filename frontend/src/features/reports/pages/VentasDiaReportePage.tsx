import { useState } from "react";
import { Download, FileText, Printer } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useAuthStore } from "../../auth/hooks/useAuth";
import { useCashReasonCatalog } from "../../cash/hooks/useCash";
import { printSaleTicket } from "../../pos/lib/printTicket";
import { useGeneralSettings } from "../../settings/hooks/useSettings";
import { useSettingsStore } from "../../settings/store/useSettingsStore";
import { CancelarVentaModal } from "../components/CancelarVentaModal";
import { DetalleVentaModal } from "../components/DetalleVentaModal";
import { FiltrosVentasDia } from "../components/FiltrosVentasDia";
import { ResumenVentasDia } from "../components/ResumenVentasDia";
import { TablaVentasDia } from "../components/TablaVentasDia";
import { buildCierreCajaLines, formatMoney } from "../lib/cashDailyReport";
import { useSaleDetailReport, useVentasDiaReport } from "../hooks/useReports";
import { downloadTextPdf, exportHtmlTableToExcel, printThermalReport } from "../lib/reportExport";
import { reportService } from "../services/reportService";
import type { SaleDetailReport, VentaDiaItem, VentasDiaFilters, VentasDiaReport } from "../types/report";

const defaultFilters: Required<VentasDiaFilters> = {
  search: "",
  payment_method_id: "",
  user_id: "",
  status: "completed",
};

function formatDateLabel(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "full",
  }).format(new Date(`${value}T00:00:00`));
}

function buildVentasDiaPdfLines(report: VentasDiaReport) {
  const lines = [
    "REPORTE VENTAS DEL DIA",
    `Fecha: ${formatDateLabel(report.fecha)}`,
    "",
    `Total vendido hoy: ${formatMoney(report.resumen.total_vendido)}`,
    `Cantidad de ventas: ${report.resumen.cantidad_ventas}`,
    `Ticket promedio: ${formatMoney(report.resumen.ticket_promedio)}`,
    `Efectivo: ${formatMoney(report.resumen.total_efectivo)}`,
    `Tarjeta: ${formatMoney(report.resumen.total_tarjeta)}`,
    `Transferencia: ${formatMoney(report.resumen.total_transferencia)}`,
    `Otros: ${formatMoney(report.resumen.total_otros)}`,
    "",
    "DETALLE DE VENTAS",
    "------------------------------------------------------------",
  ];

  report.ventas.forEach((sale) => {
    lines.push(
      `${sale.hora} | ${sale.folio} | ${sale.cajero}`,
      `${sale.metodo_pago} | ${sale.estado === "completed" ? "Completada" : "Anulada"} | ${formatMoney(sale.total)}`,
      "------------------------------------------------------------",
    );
  });

  return lines;
}

function exportVentasDiaExcel(report: VentasDiaReport) {
  const summaryRows = `
    <table border="1">
      <tr><th>Indicador</th><th>Valor</th></tr>
      <tr><td>Total vendido hoy</td><td>${formatMoney(report.resumen.total_vendido)}</td></tr>
      <tr><td>Cantidad de ventas</td><td>${report.resumen.cantidad_ventas}</td></tr>
      <tr><td>Ticket promedio</td><td>${formatMoney(report.resumen.ticket_promedio)}</td></tr>
      <tr><td>Efectivo</td><td>${formatMoney(report.resumen.total_efectivo)}</td></tr>
      <tr><td>Tarjeta</td><td>${formatMoney(report.resumen.total_tarjeta)}</td></tr>
      <tr><td>Transferencia</td><td>${formatMoney(report.resumen.total_transferencia)}</td></tr>
      <tr><td>Otros</td><td>${formatMoney(report.resumen.total_otros)}</td></tr>
    </table>
  `;

  const detailRows = report.ventas
    .map(
      (sale) => `
        <tr>
          <td>${sale.hora}</td>
          <td>${sale.folio}</td>
          <td>${sale.cajero}</td>
          <td>${sale.metodo_pago}</td>
          <td>${formatMoney(sale.total)}</td>
          <td>${sale.estado === "completed" ? "Completada" : "Anulada"}</td>
        </tr>
      `,
    )
    .join("");

  exportHtmlTableToExcel(
    `ventas-dia-${report.fecha}.xls`,
    "Ventas del dia",
    `
      <h1>Ventas del dia</h1>
      <p>Fecha: ${formatDateLabel(report.fecha)}</p>
      ${summaryRows}
      <br />
      <table border="1">
        <tr>
          <th>Hora</th>
          <th>Folio venta</th>
          <th>Cajero</th>
          <th>Metodo de pago</th>
          <th>Total</th>
          <th>Estado</th>
        </tr>
        ${detailRows}
      </table>
    `,
  );
}

export function VentasDiaReportePage() {
  const token = useAuthStore((state) => state.token);
  const generalSettings = useSettingsStore((state) => state.general);
  const queryClient = useQueryClient();
  useGeneralSettings();
  const [draftFilters, setDraftFilters] = useState<Required<VentasDiaFilters>>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<Required<VentasDiaFilters>>(defaultFilters);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [saleToCancel, setSaleToCancel] = useState<VentaDiaItem | null>(null);
  const [cancelReasonCode, setCancelReasonCode] = useState("");
  const [cancelNotes, setCancelNotes] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isPrintingClosure, setIsPrintingClosure] = useState(false);
  const [isReprintingTicket, setIsReprintingTicket] = useState(false);
  const [isCancellingSale, setIsCancellingSale] = useState(false);
  const { data: cancellationReasons = [] } = useCashReasonCatalog("sale_cancellation");

  const { data, isLoading, error } = useVentasDiaReport(appliedFilters);
  const {
    data: saleDetail,
    isLoading: detailLoading,
    error: detailError,
  } = useSaleDetailReport(selectedSaleId);

  async function handleExportPdf() {
    if (!data) {
      return;
    }

    try {
      setActionError(null);
      setIsExportingPdf(true);
      downloadTextPdf(`ventas-dia-${data.fecha}.pdf`, "Ventas del dia", buildVentasDiaPdfLines(data));
    } catch (exportError) {
      setActionError(exportError instanceof Error ? exportError.message : "No fue posible generar el PDF");
    } finally {
      setIsExportingPdf(false);
    }
  }

  async function handlePrintClosure() {
    if (!token) {
      return;
    }

    try {
      setActionError(null);
      setIsPrintingClosure(true);
      const closureReport = await reportService.getCajaDiaria(token, {});
      const lines = buildCierreCajaLines(
        closureReport,
        {
          companyName: generalSettings.companyName,
          companyTaxId: generalSettings.companyTaxId,
          companyAddress: generalSettings.companyAddress,
          companyPhone: generalSettings.companyPhone,
          companyEmail: generalSettings.companyEmail,
        },
      );
      printThermalReport("Cierre de caja", lines);
    } catch (printError) {
      setActionError(printError instanceof Error ? printError.message : "No fue posible imprimir el cierre");
    } finally {
      setIsPrintingClosure(false);
    }
  }

  async function handleReprintSaleTicket() {
    if (!saleDetail) {
      return;
    }

    try {
      setActionError(null);
      setIsReprintingTicket(true);
      printSaleTicket({
        sale: saleDetail,
        general: generalSettings,
        cashierName: saleDetail.user.full_name,
      });
    } catch (printError) {
      setActionError(printError instanceof Error ? printError.message : "No fue posible reimprimir el ticket");
    } finally {
      setIsReprintingTicket(false);
    }
  }

  async function handleCancelSale() {
    if (!token || !saleToCancel) {
      return;
    }

    const selectedReason = cancellationReasons.find((item) => item.code === cancelReasonCode);
    if (!selectedReason) {
      setCancelError("Debes seleccionar un motivo de anulacion");
      return;
    }
    if (selectedReason.requires_notes && !cancelNotes.trim()) {
      setCancelError("Debes detallar el motivo de anulacion seleccionado");
      return;
    }

    const confirmed = window.confirm(`Se anulara la boleta ${saleToCancel.folio}. Esta accion dejara registro y revertira el stock. Deseas continuar?`);
    if (!confirmed) {
      return;
    }

    try {
      setCancelError(null);
      setIsCancellingSale(true);
      await reportService.cancelSale(token, saleToCancel.id, {
        reason_code: cancelReasonCode,
        notes: cancelNotes || undefined,
      });
      setCancelReasonCode("");
      setCancelNotes("");
      setSaleToCancel(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["report-ventas-dia"] }),
        queryClient.invalidateQueries({ queryKey: ["report-sale-detail"] }),
        queryClient.invalidateQueries({ queryKey: ["report-caja-diaria"] }),
        queryClient.invalidateQueries({ queryKey: ["sales-list"] }),
        queryClient.invalidateQueries({ queryKey: ["inventory-movements"] }),
        queryClient.invalidateQueries({ queryKey: ["products"] }),
        queryClient.invalidateQueries({ queryKey: ["cash-current-session"] }),
      ]);
    } catch (cancelError) {
      setCancelError(cancelError instanceof Error ? cancelError.message : "No fue posible anular la boleta");
    } finally {
      setIsCancellingSale(false);
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Ventas del dia"
        description={data ? `Fecha del servidor: ${formatDateLabel(data.fecha)}` : "Resumen operativo de ventas del dia actual."}
      />

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => data && exportVentasDiaExcel(data)} disabled={!data}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button type="button" variant="secondary" onClick={handleExportPdf} disabled={!data || isExportingPdf}>
          <FileText className="mr-2 h-4 w-4" />
          {isExportingPdf ? "Generando PDF..." : "Exportar PDF"}
        </Button>
        <Button type="button" onClick={handlePrintClosure} disabled={isPrintingClosure}>
          <Printer className="mr-2 h-4 w-4" />
          {isPrintingClosure ? "Preparando cierre..." : "Imprimir cierre"}
        </Button>
      </div>

      <FiltrosVentasDia
        values={draftFilters}
        availableFilters={data?.filtros_disponibles}
        onChange={setDraftFilters}
        onApply={() => setAppliedFilters(draftFilters)}
        onReset={() => {
          setDraftFilters(defaultFilters);
          setAppliedFilters(defaultFilters);
        }}
      />

      {isLoading ? <p className="text-sm text-slate-500">Cargando reporte...</p> : null}
      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error instanceof Error ? error.message : "No fue posible cargar el reporte"}
        </p>
      ) : null}
      {actionError ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{actionError}</p> : null}

      {data ? (
        <>
          <ResumenVentasDia resumen={data.resumen} />
          <TablaVentasDia
            ventas={data.ventas}
            onViewDetail={setSelectedSaleId}
            onCancelSale={(sale) => {
              setCancelError(null);
              setCancelReasonCode("");
              setCancelNotes("");
              setSaleToCancel(sale);
            }}
          />
        </>
      ) : null}

      {selectedSaleId ? (
        <DetalleVentaModal
          sale={saleDetail as SaleDetailReport | undefined}
          loading={detailLoading}
          error={detailError instanceof Error ? detailError.message : null}
          isReprinting={isReprintingTicket}
          onClose={() => {
            setSelectedSaleId(null);
          }}
          onReprint={handleReprintSaleTicket}
        />
      ) : null}

      {saleToCancel ? (
        <CancelarVentaModal
          saleNumber={saleToCancel.folio}
          reasonCode={cancelReasonCode}
          reasons={cancellationReasons}
          notes={cancelNotes}
          error={cancelError}
          isSubmitting={isCancellingSale}
          onReasonCodeChange={setCancelReasonCode}
          onNotesChange={setCancelNotes}
          onClose={() => {
            setSaleToCancel(null);
            setCancelReasonCode("");
            setCancelNotes("");
            setCancelError(null);
          }}
          onConfirm={handleCancelSale}
        />
      ) : null}
    </section>
  );
}

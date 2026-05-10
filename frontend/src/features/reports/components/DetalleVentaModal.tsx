import { Printer, X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "../../../components/ui/Button";
import { formatCurrency } from "../../../lib/currency";
import type { SaleDetailReport } from "../types/report";

type DetalleVentaModalProps = {
  sale: SaleDetailReport | undefined;
  loading: boolean;
  error: string | null;
  isReprinting?: boolean;
  onClose: () => void;
  onReprint: () => void;
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DetalleVentaModal({
  sale,
  loading,
  error,
  isReprinting = false,
  onClose,
  onReprint,
}: DetalleVentaModalProps) {
  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[85vh] w-full max-w-5xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Detalle de venta</h2>
            <p className="text-sm text-slate-500">Consulta productos, cajero, pagos y estado final.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={onReprint}
              disabled={loading || !sale || sale.status !== "completed" || isReprinting}
            >
              <Printer className="mr-2 h-4 w-4" />
              {isReprinting ? "Reimprimiendo..." : "Reimprimir ticket"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              <X className="mr-2 h-4 w-4" />
              Cerrar
            </Button>
          </div>
        </div>

        <div className="max-h-[calc(85vh-72px)] overflow-auto p-5">
          {loading ? <p className="text-sm text-slate-500">Cargando detalle...</p> : null}
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          {!loading && !error && sale ? (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Folio</p>
                  <p className="mt-2 font-semibold text-slate-950">{sale.sale_number}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Fecha y hora</p>
                  <p className="mt-2 font-semibold text-slate-950">{formatDateTime(sale.created_at)}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Cajero</p>
                  <p className="mt-2 font-semibold text-slate-950">{sale.user.full_name}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Estado</p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {sale.status === "completed" ? "Completada" : "Anulada"}
                  </p>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-200 px-4 py-4">
                  <h3 className="text-base font-semibold text-slate-950">Productos vendidos</h3>
                </div>
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-medium">Producto</th>
                      <th className="px-4 py-3 font-medium">Codigo de barra</th>
                      <th className="px-4 py-3 font-medium">Cantidad</th>
                      <th className="px-4 py-3 font-medium">Precio unitario</th>
                      <th className="px-4 py-3 font-medium">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sale.details.map((detail) => (
                      <tr key={detail.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{detail.product.name}</td>
                        <td className="px-4 py-3 text-slate-600">{detail.product.barcode || "-"}</td>
                        <td className="px-4 py-3 text-slate-600">{detail.quantity}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(detail.unit_price))}</td>
                        <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(detail.line_total))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_320px]">
                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-base font-semibold text-slate-950">Pagos</h3>
                  <div className="mt-4 space-y-3">
                    {sale.payments.map((payment) => (
                      <div key={payment.id} className="rounded-md border border-slate-200 px-3 py-3">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-900">{payment.payment_method.name}</p>
                            <p className="text-sm text-slate-500">{payment.reference || "Sin referencia"}</p>
                          </div>
                          <p className="font-semibold text-slate-950">{formatCurrency(Number(payment.amount))}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-4">
                  <h3 className="text-base font-semibold text-slate-950">Totales</h3>
                  <div className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-slate-600">
                      <span>Subtotal</span>
                      <span>{formatCurrency(Number(sale.subtotal))}</span>
                    </div>
                    <div className="flex items-center justify-between text-slate-600">
                      <span>IVA</span>
                      <span>{formatCurrency(Number(sale.tax_amount))}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
                      <span>Total final</span>
                      <span>{formatCurrency(Number(sale.total))}</span>
                    </div>
                    {sale.notes ? (
                      <div className="rounded-md bg-slate-50 px-3 py-3 text-slate-600">
                        <p className="font-medium text-slate-800">Notas</p>
                        <p className="mt-1">{sale.notes}</p>
                      </div>
                    ) : null}
                    {sale.cancellation_reason ? (
                      <div className="rounded-md bg-rose-50 px-3 py-3 text-rose-700">
                        <p className="font-medium">Motivo de anulacion</p>
                        <p className="mt-1">{sale.cancellation_reason}</p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

            </div>
          ) : null}
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}

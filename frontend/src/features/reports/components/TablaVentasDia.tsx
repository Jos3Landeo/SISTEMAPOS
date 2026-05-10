import { Ban, Eye } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { formatCurrency } from "../../../lib/currency";
import type { VentaDiaItem } from "../types/report";

type TablaVentasDiaProps = {
  ventas: VentaDiaItem[];
  onViewDetail: (saleId: string) => void;
  onCancelSale: (sale: VentaDiaItem) => void;
};

export function TablaVentasDia({ ventas, onViewDetail, onCancelSale }: TablaVentasDiaProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
      <div className="border-b border-slate-200 px-4 py-4">
        <h2 className="text-base font-semibold text-slate-950">Detalle de ventas del dia</h2>
      </div>

      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50 text-left text-slate-500">
          <tr>
            <th className="px-4 py-3 font-medium">Hora</th>
            <th className="px-4 py-3 font-medium">Folio venta</th>
            <th className="px-4 py-3 font-medium">Cajero</th>
            <th className="px-4 py-3 font-medium">Metodo de pago</th>
            <th className="px-4 py-3 font-medium">Total</th>
            <th className="px-4 py-3 font-medium">Estado</th>
            <th className="px-4 py-3 font-medium text-right">Accion</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {ventas.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-slate-500" colSpan={7}>
                No hay ventas para mostrar con los filtros actuales.
              </td>
            </tr>
          ) : (
            ventas.map((venta) => (
              <tr key={venta.id}>
                <td className="px-4 py-3 text-slate-600">{venta.hora}</td>
                <td className="px-4 py-3 font-medium text-slate-900">{venta.folio}</td>
                <td className="px-4 py-3 text-slate-600">{venta.cajero}</td>
                <td className="px-4 py-3 text-slate-600">{venta.metodo_pago}</td>
                <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(venta.total))}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      venta.estado === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {venta.estado === "completed" ? "Completada" : "Anulada"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    {venta.estado === "completed" ? (
                      <Button type="button" variant="danger" onClick={() => onCancelSale(venta)}>
                        <Ban className="mr-2 h-4 w-4" />
                        Anular boleta
                      </Button>
                    ) : null}
                    <Button type="button" variant="secondary" onClick={() => onViewDetail(venta.id)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver detalle
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

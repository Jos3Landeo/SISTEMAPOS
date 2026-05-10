import { X } from "lucide-react";
import { createPortal } from "react-dom";

import { Button } from "../../../components/ui/Button";

import type { CashReasonCatalogItem } from "../../cash/types/cash";

type CancelarVentaModalProps = {
  saleNumber: string;
  reasonCode: string;
  reasons: CashReasonCatalogItem[];
  notes: string;
  error?: string | null;
  isSubmitting?: boolean;
  onReasonCodeChange: (value: string) => void;
  onNotesChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
};

export function CancelarVentaModal({
  saleNumber,
  reasonCode,
  reasons,
  notes,
  error,
  isSubmitting = false,
  onReasonCodeChange,
  onNotesChange,
  onClose,
  onConfirm,
}: CancelarVentaModalProps) {
  const selectedReason = reasons.find((item) => item.code === reasonCode) ?? null;
  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-xl overflow-hidden rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-950">Anular boleta</h2>
            <p className="text-sm text-slate-500">La venta {saleNumber} quedara anulada, con trazabilidad y reversa de stock.</p>
          </div>
          <Button type="button" variant="secondary" onClick={onClose}>
            <X className="mr-2 h-4 w-4" />
            Cerrar
          </Button>
        </div>

        <div className="space-y-4 px-5 py-5">
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Esta accion no elimina el registro. La boleta quedara marcada como anulada y el inventario se revertira.
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Motivo de anulacion</span>
            <select className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={reasonCode} onChange={(event) => onReasonCodeChange(event.target.value)} autoFocus>
              <option value="">Seleccionar motivo</option>
              {reasons.map((reason) => (
                <option key={reason.code} value={reason.code}>
                  {reason.label}
                </option>
              ))}
            </select>
            {selectedReason ? <p className="text-xs text-slate-500">{selectedReason.description}</p> : null}
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Observacion</span>
            <textarea
              className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
              placeholder={selectedReason?.requires_notes ? "Este motivo requiere detalle" : "Detalle opcional de la anulacion"}
            />
          </label>

          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="button" variant="danger" onClick={onConfirm} disabled={isSubmitting}>
              {isSubmitting ? "Anulando..." : "Confirmar anulacion"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") {
    return modal;
  }

  return createPortal(modal, document.body);
}

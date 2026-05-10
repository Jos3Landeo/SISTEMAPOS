import { Search } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import type { VentasDiaFilters, VentasDiaReport } from "../types/report";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";

type FiltrosVentasDiaProps = {
  values: Required<VentasDiaFilters>;
  availableFilters: VentasDiaReport["filtros_disponibles"] | undefined;
  onChange: (next: Required<VentasDiaFilters>) => void;
  onApply: () => void;
  onReset: () => void;
};

export function FiltrosVentasDia({
  values,
  availableFilters,
  onChange,
  onApply,
  onReset,
}: FiltrosVentasDiaProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-center gap-3">
        <Search className="h-5 w-5 text-slate-500" />
        <div>
          <h2 className="text-base font-semibold text-slate-950">Filtros</h2>
          <p className="text-sm text-slate-500">Refina las ventas del dia por folio, pago, cajero o estado.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Buscar por folio o ID</span>
          <input
            className={inputClassName}
            value={values.search}
            onChange={(event) => onChange({ ...values, search: event.target.value })}
            placeholder="Ej. 0000001, UUID..."
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Metodo de pago</span>
          <select
            className={inputClassName}
            value={values.payment_method_id}
            onChange={(event) => onChange({ ...values, payment_method_id: event.target.value })}
          >
            <option value="">Todos</option>
            {availableFilters?.metodos_pago.map((method) => (
              <option key={method.id} value={method.id}>
                {method.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Cajero</span>
          <select
            className={inputClassName}
            value={values.user_id}
            onChange={(event) => onChange({ ...values, user_id: event.target.value })}
          >
            <option value="">Todos</option>
            {availableFilters?.cajeros.map((user) => (
              <option key={user.id} value={user.id}>
                {user.full_name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Estado</span>
          <select
            className={inputClassName}
            value={values.status}
            onChange={(event) => onChange({ ...values, status: event.target.value })}
          >
            <option value="completed">Completada</option>
            <option value="cancelled">Anulada</option>
            <option value="all">Todas</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onReset}>
          Limpiar
        </Button>
        <Button type="button" onClick={onApply}>
          Aplicar filtros
        </Button>
      </div>
    </div>
  );
}

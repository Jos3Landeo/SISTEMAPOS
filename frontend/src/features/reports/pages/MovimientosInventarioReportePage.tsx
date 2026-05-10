import { Download, FileText } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useInventoryMovements } from "../../inventory/hooks/useInventory";
import type { InventoryMovement } from "../../inventory/types/inventory";
import { getProductUnitMeta } from "../../products/types/product";
import { downloadTextPdf, exportHtmlTableToExcel } from "../lib/reportExport";

const movementLabels: Record<string, string> = {
  purchase: "Compra",
  sale: "Venta",
  sale_cancellation: "Anulacion",
  adjustment: "Ajuste",
  adjustment_in: "Ingreso manual",
  adjustment_out: "Salida manual",
};

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatQuantity(value: string, unit: string) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("es-CL", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${unit}`;
}

function getMovementLabel(movementType: string) {
  return movementLabels[movementType] ?? movementType;
}

function buildMovementPdfLines(movements: InventoryMovement[]) {
  const lines = ["MOVIMIENTOS DE INVENTARIO", "", `Movimientos listados: ${movements.length}`, "", "DETALLE", "--------------------------------"];

  if (movements.length === 0) {
    lines.push("No hay movimientos para mostrar.");
    return lines;
  }

  movements.forEach((movement) => {
    const unit = getProductUnitMeta(movement.product.unit_of_measure).stockLabel;
    lines.push(formatDateTime(movement.created_at));
    lines.push(`${movement.product.name} - ${getMovementLabel(movement.movement_type)}`);
    lines.push(`Cantidad: ${formatQuantity(movement.quantity, unit)}`);
    lines.push(`Stock: ${formatQuantity(movement.previous_stock, unit)} -> ${formatQuantity(movement.new_stock, unit)}`);
    lines.push(`Referencia: ${movement.reference || "-"}`);
    if (movement.notes) {
      lines.push(`Notas: ${movement.notes}`);
    }
    lines.push("--------------------------------");
  });

  return lines;
}

function exportMovementsExcel(movements: InventoryMovement[]) {
  const rows = movements
    .map((movement) => {
      const unit = getProductUnitMeta(movement.product.unit_of_measure).stockLabel;
      return `
        <tr>
          <td>${formatDateTime(movement.created_at)}</td>
          <td>${movement.product.name}</td>
          <td>${movement.product.barcode}</td>
          <td>${getMovementLabel(movement.movement_type)}</td>
          <td>${formatQuantity(movement.quantity, unit)}</td>
          <td>${formatQuantity(movement.previous_stock, unit)}</td>
          <td>${formatQuantity(movement.new_stock, unit)}</td>
          <td>${movement.reference || "-"}</td>
          <td>${movement.notes || "-"}</td>
        </tr>
      `;
    })
    .join("");

  exportHtmlTableToExcel(
    "movimientos-inventario.xls",
    "Movimientos de inventario",
    `
      <h1>Movimientos de inventario</h1>
      <p>Movimientos listados: ${movements.length}</p>
      <table border="1">
        <tr>
          <th>Fecha</th>
          <th>Producto</th>
          <th>Codigo de barras</th>
          <th>Tipo</th>
          <th>Cantidad</th>
          <th>Stock previo</th>
          <th>Stock nuevo</th>
          <th>Referencia</th>
          <th>Notas</th>
        </tr>
        ${rows}
      </table>
    `,
  );
}

export function MovimientosInventarioReportePage() {
  const { data: movements = [], isLoading, error } = useInventoryMovements();
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState("all");

  const filteredMovements = useMemo(() => {
    return movements.filter((movement) => {
      const matchesType = movementType === "all" || movement.movement_type === movementType;
      const searchValue = search.trim().toLowerCase();
      const matchesSearch =
        !searchValue ||
        movement.product.name.toLowerCase().includes(searchValue) ||
        movement.product.barcode.toLowerCase().includes(searchValue) ||
        (movement.product.internal_code || "").toLowerCase().includes(searchValue) ||
        (movement.reference || "").toLowerCase().includes(searchValue);

      return matchesType && matchesSearch;
    });
  }, [movementType, movements, search]);

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Movimientos de inventario"
        description="Entradas, ventas, anulaciones y correcciones manuales con trazabilidad."
      />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Buscar</span>
            <input
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
              placeholder="Producto, codigo o referencia"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Tipo</span>
            <select
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
              value={movementType}
              onChange={(event) => setMovementType(event.target.value)}
            >
              <option value="all">Todos</option>
              <option value="purchase">Compra</option>
              <option value="sale">Venta</option>
              <option value="sale_cancellation">Anulacion</option>
              <option value="adjustment_in">Ingreso manual</option>
              <option value="adjustment_out">Salida manual</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button type="button" variant="secondary" onClick={() => exportMovementsExcel(filteredMovements)}>
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() =>
              downloadTextPdf("movimientos-inventario.pdf", "Movimientos de inventario", buildMovementPdfLines(filteredMovements))
            }
          >
            <FileText className="mr-2 h-4 w-4" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Cargando movimientos...</p> : null}
      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error instanceof Error ? error.message : "No fue posible cargar el reporte"}
        </p>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Historial de stock</h2>
          <p className="mt-1 text-sm text-slate-500">{filteredMovements.length} movimientos encontrados</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium text-right">Cantidad</th>
                <th className="px-4 py-3 font-medium">Cambio</th>
                <th className="px-4 py-3 font-medium">Referencia</th>
                <th className="px-4 py-3 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={7}>
                    No hay movimientos para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((movement) => {
                  const unit = getProductUnitMeta(movement.product.unit_of_measure).stockLabel;
                  return (
                    <tr key={movement.id}>
                      <td className="px-4 py-3 text-slate-600">{formatDateTime(movement.created_at)}</td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{movement.product.name}</div>
                        <div className="text-xs text-slate-500">
                          {movement.product.barcode}
                          {movement.product.internal_code ? ` - ${movement.product.internal_code}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{getMovementLabel(movement.movement_type)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatQuantity(movement.quantity, unit)}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatQuantity(movement.previous_stock, unit)} {"->"} {formatQuantity(movement.new_stock, unit)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{movement.reference || "-"}</td>
                      <td className="px-4 py-3 text-slate-600">{movement.notes || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

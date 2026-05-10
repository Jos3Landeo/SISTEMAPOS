import { Download, FileText } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useProducts } from "../../products/hooks/useProducts";
import { getProductUnitMeta, type Product } from "../../products/types/product";
import { downloadTextPdf, exportHtmlTableToExcel } from "../lib/reportExport";

function formatStock(value: string, unit: Product["unit_of_measure"]) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("es-CL", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  })} ${getProductUnitMeta(unit).stockLabel}`;
}

function buildLowStockPdfLines(products: Product[]) {
  const lines = ["STOCK BAJO", "", `Productos bajo minimo: ${products.length}`, "", "DETALLE", "--------------------------------"];

  if (products.length === 0) {
    lines.push("No hay productos bajo minimo.");
    return lines;
  }

  products.forEach((product) => {
    lines.push(product.name);
    lines.push(`Codigo: ${product.barcode}`);
    lines.push(`Categoria: ${product.category?.name ?? "Sin categoria"}`);
    lines.push(`Actual: ${formatStock(product.stock_current, product.unit_of_measure)}`);
    lines.push(`Minimo: ${formatStock(product.stock_minimum, product.unit_of_measure)}`);
    lines.push("--------------------------------");
  });

  return lines;
}

function exportLowStockExcel(products: Product[]) {
  const rows = products
    .map(
      (product) => `
        <tr>
          <td>${product.name}</td>
          <td>${product.barcode}</td>
          <td>${product.internal_code || "-"}</td>
          <td>${product.category?.name ?? "Sin categoria"}</td>
          <td>${formatStock(product.stock_current, product.unit_of_measure)}</td>
          <td>${formatStock(product.stock_minimum, product.unit_of_measure)}</td>
          <td>${Number(product.stock_current) - Number(product.stock_minimum)}</td>
        </tr>
      `,
    )
    .join("");

  exportHtmlTableToExcel(
    "stock-bajo.xls",
    "Stock bajo",
    `
      <h1>Stock bajo</h1>
      <p>Productos bajo minimo: ${products.length}</p>
      <table border="1">
        <tr>
          <th>Producto</th>
          <th>Codigo de barras</th>
          <th>Codigo interno</th>
          <th>Categoria</th>
          <th>Stock actual</th>
          <th>Stock minimo</th>
          <th>Diferencia</th>
        </tr>
        ${rows}
      </table>
    `,
  );
}

export function StockBajoReportePage() {
  const { data: products = [], isLoading, error } = useProducts();
  const lowStockProducts = products
    .filter((product) => Number(product.stock_current) <= Number(product.stock_minimum))
    .sort((left, right) => Number(left.stock_current) - Number(right.stock_current));

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Stock bajo"
        description="Productos que ya llegaron a su minimo o estan por debajo para reaccionar a tiempo."
      />

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => exportLowStockExcel(lowStockProducts)}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => downloadTextPdf("stock-bajo.pdf", "Stock bajo", buildLowStockPdfLines(lowStockProducts))}
        >
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      {isLoading ? <p className="text-sm text-slate-500">Cargando productos...</p> : null}
      {error ? (
        <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error instanceof Error ? error.message : "No fue posible cargar el reporte"}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <p className="text-sm text-slate-500">Productos bajo minimo</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{lowStockProducts.length}</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="border-b border-slate-200 px-5 py-4">
          <h2 className="text-base font-semibold text-slate-950">Detalle</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Codigo de barras</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium text-right">Stock actual</th>
                <th className="px-4 py-3 font-medium text-right">Stock minimo</th>
                <th className="px-4 py-3 font-medium text-right">Diferencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockProducts.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    No hay productos en alerta de stock minimo.
                  </td>
                </tr>
              ) : (
                lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{product.name}</div>
                      <div className="text-xs text-slate-500">{product.internal_code || "-"}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{product.barcode}</td>
                    <td className="px-4 py-3 text-slate-600">{product.category?.name ?? "Sin categoria"}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatStock(product.stock_current, product.unit_of_measure)}</td>
                    <td className="px-4 py-3 text-right text-slate-700">{formatStock(product.stock_minimum, product.unit_of_measure)}</td>
                    <td className="px-4 py-3 text-right font-medium text-rose-700">
                      {formatStock(String(Number(product.stock_current) - Number(product.stock_minimum)), product.unit_of_measure)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

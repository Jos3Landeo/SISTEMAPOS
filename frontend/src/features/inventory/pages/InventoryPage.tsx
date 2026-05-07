import { SectionTitle } from "../../../components/ui/SectionTitle";
import { useProducts } from "../../products/hooks/useProducts";
import { useInventoryMovements } from "../hooks/useInventory";

export function InventoryPage() {
  const { data: products = [] } = useProducts();
  const { data: movements = [], isLoading } = useInventoryMovements();

  const lowStockProducts = products.filter(
    (product) => Number(product.stock_current) <= Number(product.stock_minimum),
  );

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Inventario"
        description="Vista operativa de quiebres de stock y trazabilidad reciente."
      />

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <h2 className="text-base font-semibold text-slate-950">Alertas de stock minimo</h2>
          <div className="mt-4 space-y-3">
            {lowStockProducts.length === 0 ? (
              <p className="text-sm text-slate-500">No hay productos en umbral critico.</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="rounded-md border border-amber-200 bg-amber-50 px-3 py-3">
                  <p className="font-medium text-amber-950">{product.name}</p>
                  <p className="text-sm text-amber-800">
                    Stock {product.stock_current} / minimo {product.stock_minimum}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Stock</th>
                <th className="px-4 py-3 font-medium">Referencia</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Cargando movimientos...
                  </td>
                </tr>
              ) : movements.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={6}>
                    Aun no hay movimientos registrados.
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id}>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(movement.created_at).toLocaleString("es-CL")}
                    </td>
                    <td className="px-4 py-3 text-slate-900">{movement.product.name}</td>
                    <td className="px-4 py-3 text-slate-600">{movement.movement_type}</td>
                    <td className="px-4 py-3 text-slate-600">{movement.quantity}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {movement.previous_stock} {"->"} {movement.new_stock}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{movement.reference || "-"}</td>
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

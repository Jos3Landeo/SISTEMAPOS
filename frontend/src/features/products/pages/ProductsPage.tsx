import { useState } from "react";

import { SectionTitle } from "../../../components/ui/SectionTitle";
import { formatCurrency } from "../../../lib/currency";
import { useProducts } from "../hooks/useProducts";

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading } = useProducts(search || undefined);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionTitle
          title="Productos"
          description="Catalogo base para venta, stock minimo y futuras compras."
        />
        <div className="w-full max-w-sm">
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Buscar</span>
            <input
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
              placeholder="Nombre, codigo o barra"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Codigos</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  Cargando productos...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={6}>
                  No hay productos para mostrar.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="text-slate-500">{product.description || "Sin descripcion"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{product.barcode}</div>
                    <div>{product.internal_code}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category?.name || "Sin categoria"}</td>
                  <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(product.sale_price))}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.stock_current} / min. {product.stock_minimum}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        product.is_active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {product.is_active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}


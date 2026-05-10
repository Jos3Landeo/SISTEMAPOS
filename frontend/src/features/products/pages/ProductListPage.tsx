import { useMemo, useState } from "react";
import { PencilLine } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { formatCurrency } from "../../../lib/currency";
import { useProducts } from "../hooks/useProducts";
import { getProductUnitMeta } from "../types/product";

export function ProductListPage() {
  const [search, setSearch] = useState("");
  const { data: products = [], isLoading } = useProducts(search || undefined);
  const visibleProducts = useMemo(() => products.slice(0, 10), [products]);

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Listado de productos"
        description="Consulta el catalogo, busca rapido y entra a modificacion cuando lo necesites."
      />

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
        <div className="flex flex-col gap-4 border-b border-slate-200 px-4 py-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Productos creados</h2>
            <p className="text-sm text-slate-500">Se muestran hasta 10 resultados para mantener la vista operativa.</p>
          </div>
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

        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Producto</th>
              <th className="px-4 py-3 font-medium">Codigos</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Precio</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={7}>
                  Cargando productos...
                </td>
              </tr>
            ) : visibleProducts.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-slate-500" colSpan={7}>
                  No hay productos para mostrar.
                </td>
              </tr>
            ) : (
              visibleProducts.map((product) => (
                <tr key={product.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{product.name}</div>
                    <div className="text-slate-500">{product.description || "Sin descripcion"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    <div>{product.barcode}</div>
                    <div>{product.internal_code || "-"}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{product.category?.name || "Sin categoria"}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatCurrency(Number(product.sale_price))} / {getProductUnitMeta(product.unit_of_measure).stockLabel}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {product.stock_current} / min. {product.stock_minimum} {getProductUnitMeta(product.unit_of_measure).stockLabel}
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
                  <td className="px-4 py-3 text-right">
                    <Link to={`/products/edit/${product.id}`}>
                      <Button type="button" variant="secondary">
                        <PencilLine className="mr-2 h-4 w-4" />
                        Editar
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {products.length > 10 ? (
          <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
            Hay mas resultados disponibles. Usa el buscador para acotar el listado.
          </div>
        ) : null}
      </div>
    </section>
  );
}

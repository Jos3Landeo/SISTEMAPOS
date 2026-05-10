import { FormEvent, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { getProductUnitMeta } from "../../products/types/product";
import { useProduct, useProducts } from "../../products/hooks/useProducts";
import { useCreateStockAdjustment } from "../hooks/useInventory";

export function InventoryPage() {
  const createAdjustment = useCreateStockAdjustment();
  const [productId, setProductId] = useState("");
  const [adjustmentType, setAdjustmentType] = useState<"in" | "out">("in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Reposicion manual");
  const [notes, setNotes] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: selectedProduct } = useProduct(productId || undefined);
  const { data: searchedProducts = [], isLoading: searchLoading } = useProducts(productSearch || undefined);
  const visibleSearchedProducts = useMemo(() => searchedProducts.slice(0, 10), [searchedProducts]);

  function closeProductSearch() {
    setIsSearchOpen(false);
    setProductSearch("");
  }

  function handleSelectProduct(nextProductId: string) {
    setProductId(nextProductId);
    closeProductSearch();
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    if (!productId) {
      setError("Selecciona un producto.");
      return;
    }

    try {
      const normalizedQuantity = Number(quantity);
      await createAdjustment.mutateAsync({
        reason,
        notes: notes || null,
        details: [
          {
            product_id: productId,
            quantity: adjustmentType === "out" ? normalizedQuantity * -1 : normalizedQuantity,
          },
        ],
      });
      setFeedback(adjustmentType === "out" ? "Salida manual registrada correctamente." : "Ingreso manual registrado correctamente.");
      setQuantity("");
      setNotes("");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible registrar la correccion.");
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Inventario"
        description="Correcciones manuales de stock para reposiciones puntuales, mermas, vencimientos o regularizaciones."
      />

      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
        <h2 className="text-base font-semibold text-slate-950">Correccion manual</h2>
        <p className="mt-1 text-sm text-slate-500">Registra ingresos o salidas manuales por reposicion puntual, merma, vencimiento o regularizacion.</p>

        <form className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Tipo de correccion</span>
            <select
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
              value={adjustmentType}
              onChange={(event) => {
                const nextType = event.target.value as "in" | "out";
                setAdjustmentType(nextType);
                setReason(nextType === "out" ? "Merma" : "Reposicion manual");
              }}
            >
              <option value="in">Agregar stock</option>
              <option value="out">Quitar stock</option>
            </select>
          </label>

          <div className="space-y-2 xl:col-span-2">
            <span className="block text-sm font-medium text-slate-700">Producto</span>
            <div className="grid gap-3 xl:grid-cols-[190px_minmax(0,1fr)] xl:items-start">
              <Button type="button" variant="secondary" onClick={() => setIsSearchOpen(true)} className="h-11 justify-start">
                <Search className="mr-2 h-4 w-4" />
                {selectedProduct ? "Cambiar producto" : "Buscar producto"}
              </Button>

              {selectedProduct ? (
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                  <p className="font-medium text-slate-900">{selectedProduct.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {selectedProduct.barcode}
                    {selectedProduct.internal_code ? ` - ${selectedProduct.internal_code}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Stock actual {selectedProduct.stock_current} {getProductUnitMeta(selectedProduct.unit_of_measure).stockLabel}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">
                  Selecciona un producto para registrar la correccion.
                </div>
              )}
            </div>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>
              Cantidad{selectedProduct ? ` (${getProductUnitMeta(selectedProduct.unit_of_measure).stockLabel})` : ""}
            </span>
            <input
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
              type="number"
              min={selectedProduct?.allows_decimal ? "0.01" : "1"}
              step={selectedProduct?.allows_decimal ? "0.01" : "1"}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Motivo</span>
            <input
              className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              required
            />
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-1">
            <span>Stock actual</span>
            <div className="flex h-11 items-center rounded-md border border-slate-200 bg-slate-50 px-3 text-sm text-slate-600">
              {selectedProduct
                ? `${selectedProduct.stock_current} ${getProductUnitMeta(selectedProduct.unit_of_measure).stockLabel}`
                : "Selecciona un producto"}
            </div>
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700 md:col-span-2 xl:col-span-3">
            <span>Notas</span>
            <textarea
              className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>

          {feedback ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 md:col-span-2 xl:col-span-3">{feedback}</p> : null}
          {error ? <p className="rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700 md:col-span-2 xl:col-span-3">{error}</p> : null}

          <div className="md:col-span-2 xl:col-span-3 flex justify-end">
            <Button disabled={createAdjustment.isPending} type="submit">
              {createAdjustment.isPending
                ? "Guardando..."
                : adjustmentType === "out"
                  ? "Registrar salida manual"
                  : "Registrar ingreso manual"}
            </Button>
          </div>
        </form>
      </div>

      {isSearchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Buscar producto para inventario</h2>
                <p className="text-sm text-slate-500">Busca por nombre, codigo de barras o codigo interno.</p>
              </div>
              <Button type="button" variant="secondary" onClick={closeProductSearch}>
                Cerrar
              </Button>
            </div>

            <div className="px-5 py-4">
              <label className="block space-y-2 text-sm font-medium text-slate-700">
                <span>Buscar</span>
                <input
                  className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
                  placeholder="Ej. Manzana, 780..., FRU..."
                  value={productSearch}
                  onChange={(event) => setProductSearch(event.target.value)}
                  autoFocus
                />
              </label>
            </div>

            <div className="max-h-[420px] overflow-auto px-5 pb-5">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Codigos</th>
                    <th className="px-4 py-3 font-medium">Stock actual</th>
                    <th className="px-4 py-3 font-medium text-right">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>
                        Buscando productos...
                      </td>
                    </tr>
                  ) : visibleSearchedProducts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>
                        No hay productos para mostrar.
                      </td>
                    </tr>
                  ) : (
                    visibleSearchedProducts.map((product) => (
                      <tr key={product.id}>
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{product.name}</div>
                          <div className="text-slate-500">{product.category?.name || "Sin categoria"}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div>{product.barcode}</div>
                          <div>{product.internal_code || "-"}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {product.stock_current} {getProductUnitMeta(product.unit_of_measure).stockLabel}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" onClick={() => handleSelectProduct(product.id)}>
                            Agregar
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {searchedProducts.length > 10 ? (
                <p className="mt-3 text-sm text-slate-500">
                  Mostrando 10 de {searchedProducts.length} resultados. Refina la busqueda para acotar la lista.
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

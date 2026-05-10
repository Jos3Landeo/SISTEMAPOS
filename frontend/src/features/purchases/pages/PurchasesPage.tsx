import { FormEvent, useMemo, useState } from "react";
import { Plus, ReceiptText, Search, Trash2 } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { formatCurrency } from "../../../lib/currency";
import { useProducts } from "../../products/hooks/useProducts";
import { getProductUnitMeta, type Product } from "../../products/types/product";
import { useCreatePurchase, usePurchases, useSuppliers } from "../hooks/usePurchases";

const inputClassName = "h-11 w-full rounded-md border border-slate-200 bg-white px-3 text-sm";

type PurchaseLineForm = {
  product_id: string;
  product: Product | null;
  quantity: string;
  unit_cost: string;
};

const emptyLine = (): PurchaseLineForm => ({
  product_id: "",
  product: null,
  quantity: "1",
  unit_cost: "0",
});

export function PurchasesPage() {
  const { data: suppliers = [] } = useSuppliers();
  const { data: purchases = [], isLoading } = usePurchases();
  const createPurchase = useCreatePurchase();

  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [taxAmount, setTaxAmount] = useState("0");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<PurchaseLineForm[]>([emptyLine()]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState<number | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { data: searchedProducts = [], isLoading: searchLoading } = useProducts(productSearch || undefined);
  const visibleSearchedProducts = useMemo(() => searchedProducts.slice(0, 10), [searchedProducts]);

  const lineSummaries = useMemo(
    () =>
      lines.map((line) => {
        const product = line.product;
        const quantity = Number(line.quantity || "0");
        const unitCost = Number(line.unit_cost || "0");
        return {
          product,
          quantity,
          unitCost,
          total: quantity * unitCost,
        };
      }),
    [lines],
  );

  const subtotal = useMemo(
    () => lineSummaries.reduce((acc, line) => acc + line.total, 0),
    [lineSummaries],
  );
  const total = subtotal + Number(taxAmount || "0");

  function updateLine(index: number, nextValues: Partial<PurchaseLineForm>) {
    setLines((current) => current.map((line, lineIndex) => (lineIndex === index ? { ...line, ...nextValues } : line)));
  }

  function addLine() {
    setLines((current) => [...current, emptyLine()]);
  }

  function removeLine(index: number) {
    setLines((current) => (current.length === 1 ? current : current.filter((_, lineIndex) => lineIndex !== index)));
  }

  function openProductSearch(lineIndex: number) {
    setActiveLineIndex(lineIndex);
    setProductSearch("");
    setIsSearchOpen(true);
  }

  function closeProductSearch() {
    setIsSearchOpen(false);
    setActiveLineIndex(null);
    setProductSearch("");
  }

  function handleAddProductToLine(product: Product) {
    if (activeLineIndex === null) {
      return;
    }

    setLines((current) =>
      current.map((line, index) =>
        index === activeLineIndex
          ? {
              ...line,
              product_id: product.id,
              product,
              unit_cost: !line.unit_cost || Number(line.unit_cost) === 0 ? product.average_cost : line.unit_cost,
            }
          : line,
      ),
    );
    closeProductSearch();
  }

  function resetForm() {
    setSupplierId("");
    setInvoiceNumber("");
    setTaxAmount("0");
    setNotes("");
    setLines([emptyLine()]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    const validLines = lines
      .map((line) => ({
        product_id: line.product_id,
        quantity: Number(line.quantity || "0"),
        unit_cost: Number(line.unit_cost || "0"),
      }))
      .filter((line) => line.product_id && line.quantity > 0);

    if (!supplierId) {
      setError("Selecciona un proveedor.");
      return;
    }
    if (validLines.length === 0) {
      setError("Agrega al menos una linea valida a la compra.");
      return;
    }

    try {
      const purchase = await createPurchase.mutateAsync({
        supplier_id: supplierId,
        invoice_number: invoiceNumber || null,
        tax_amount: Number(taxAmount || "0"),
        notes: notes || null,
        details: validLines,
      });
      setFeedback("Compra registrada e inventario actualizado.");
      resetForm();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "No fue posible registrar la compra.");
    }
  }

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Compras"
        description="Ingresa mercaderia por factura o folio, actualizando stock y costo promedio en una sola operacion."
      />

      {(feedback || error) && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-700"
              : "border-emerald-200 bg-emerald-50 text-emerald-700"
          }`}
        >
          {error || feedback}
        </div>
      )}

      <div className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex items-center gap-3">
            <div className="rounded-md bg-brand-50 p-2 text-brand-600">
              <ReceiptText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-950">Nueva compra</h2>
              <p className="text-sm text-slate-500">Asocia el ingreso a un proveedor y folio para mantener trazabilidad comercial.</p>
            </div>
          </div>

          <form className="mt-5 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <label className="space-y-2 text-sm font-medium text-slate-700 xl:col-span-2">
                <span>Proveedor</span>
                <select
                  className={inputClassName}
                  value={supplierId}
                  onChange={(event) => setSupplierId(event.target.value)}
                  required
                >
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.filter((supplier) => supplier.is_active !== false).map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Folio factura</span>
                <input
                  className={inputClassName}
                  value={invoiceNumber}
                  onChange={(event) => setInvoiceNumber(event.target.value)}
                  placeholder="Opcional"
                />
              </label>

              <label className="space-y-2 text-sm font-medium text-slate-700">
                <span>Impuesto</span>
                <input
                  className={inputClassName}
                  type="number"
                  min="0"
                  step="0.01"
                  value={taxAmount}
                  onChange={(event) => setTaxAmount(event.target.value)}
                />
              </label>
            </div>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Notas</span>
              <textarea
                className="min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Observaciones de la recepcion, diferencias o comentario interno"
              />
            </label>

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Cantidad</th>
                    <th className="px-4 py-3 font-medium">Costo unitario</th>
                    <th className="px-4 py-3 font-medium">Total linea</th>
                    <th className="px-4 py-3 font-medium text-right">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((line, index) => {
                    const summary = lineSummaries[index];
                    return (
                      <tr key={`line-${index}`} className="align-top">
                        <td className="px-4 py-3">
                          <div className="grid gap-3 xl:grid-cols-[180px_minmax(0,1fr)] xl:items-start">
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => openProductSearch(index)}
                              className="h-11 justify-start"
                            >
                              <Search className="mr-2 h-4 w-4" />
                              {summary?.product ? "Cambiar producto" : "Buscar producto"}
                            </Button>

                            {summary?.product ? (
                              <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                                <p className="font-medium text-slate-900">{summary.product.name}</p>
                                <p className="mt-1 text-xs text-slate-500">
                                  {summary.product.barcode} {summary.product.internal_code ? `- ${summary.product.internal_code}` : ""}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                  Stock actual {summary.product.stock_current} {getProductUnitMeta(summary.product.unit_of_measure).stockLabel}
                                </p>
                              </div>
                            ) : (
                              <div className="rounded-md border border-dashed border-slate-200 px-3 py-3 text-xs text-slate-500">
                                Selecciona un producto para esta linea.
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className={`${inputClassName}`}
                            type="number"
                            min={summary?.product?.allows_decimal ? "0.01" : "1"}
                            step={summary?.product?.allows_decimal ? "0.01" : "1"}
                            value={line.quantity}
                            onChange={(event) => updateLine(index, { quantity: event.target.value })}
                            required
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input
                            className={`${inputClassName}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={line.unit_cost}
                            onChange={(event) => updateLine(index, { unit_cost: event.target.value })}
                            required
                          />
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{formatCurrency(summary?.total ?? 0)}</td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" variant="secondary" onClick={() => removeLine(index)} disabled={lines.length === 1}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap justify-between gap-3">
              <Button type="button" variant="secondary" onClick={addLine}>
                <Plus className="mr-2 h-4 w-4" />
                Agregar linea
              </Button>

              <div className="grid min-w-[240px] gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Impuesto</span>
                  <span>{formatCurrency(Number(taxAmount || "0"))}</span>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-base font-semibold text-slate-950">
                  <span>Total</span>
                  <span>{formatCurrency(total)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={createPurchase.isPending}>
                {createPurchase.isPending ? "Registrando compra..." : "Registrar compra"}
              </Button>
            </div>
          </form>
        </div>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
          <div className="border-b border-slate-200 px-4 py-4">
            <h2 className="text-base font-semibold text-slate-950">Compras recientes</h2>
            <p className="text-sm text-slate-500">Cada registro deja folio, proveedor, detalle y movimientos de inventario asociados.</p>
          </div>
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Folio</th>
                <th className="px-4 py-3 font-medium">Proveedor</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    Cargando compras...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-slate-500" colSpan={5}>
                    Aun no hay compras registradas.
                  </td>
                </tr>
              ) : (
                purchases.slice(0, 10).map((purchase) => (
                  <tr key={purchase.id}>
                    <td className="px-4 py-3 text-slate-600">{new Date(purchase.created_at).toLocaleString("es-CL")}</td>
                    <td className="px-4 py-3 font-medium text-slate-900">{purchase.invoice_number || "-"}</td>
                    <td className="px-4 py-3 text-slate-600">{purchase.supplier.name}</td>
                    <td className="px-4 py-3 text-slate-600">{purchase.details.length}</td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(Number(purchase.total))}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isSearchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Buscar producto para compra</h2>
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
                    <th className="px-4 py-3 font-medium">Costo promedio</th>
                    <th className="px-4 py-3 font-medium">Stock</th>
                    <th className="px-4 py-3 font-medium text-right">Accion</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {searchLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={5}>
                        Buscando productos...
                      </td>
                    </tr>
                  ) : visibleSearchedProducts.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={5}>
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
                          {formatCurrency(Number(product.average_cost))} / {getProductUnitMeta(product.unit_of_measure).stockLabel}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {product.stock_current} {getProductUnitMeta(product.unit_of_measure).stockLabel}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" onClick={() => handleAddProductToLine(product)}>
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

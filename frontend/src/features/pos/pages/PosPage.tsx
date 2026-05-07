import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { formatCurrency } from "../../../lib/currency";
import { useAuthStore } from "../../auth/hooks/useAuth";
import { productService } from "../../products/services/productService";
import { usePosStore } from "../store/usePosStore";
import { useCreateSale, usePaymentMethods } from "../hooks/usePos";

export function PosPage() {
  const token = useAuthStore((state) => state.token);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const items = usePosStore((state) => state.items);
  const addItem = usePosStore((state) => state.addItem);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeItem = usePosStore((state) => state.removeItem);
  const clearCart = usePosStore((state) => state.clearCart);
  const createSale = useCreateSale();
  const { data: paymentMethods = [] } = usePaymentMethods();

  const [barcode, setBarcode] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const tax = Math.round(subtotal * 0.19);
    const total = subtotal + tax;
    return { subtotal, tax, total };
  }, [items]);

  async function handleScanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!barcode.trim() || !token) {
      return;
    }

    try {
      setError(null);
      const product = await productService.lookupByCode(token, barcode.trim());
      addItem(product);
      setBarcode("");
      barcodeInputRef.current?.focus();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "No fue posible agregar el producto");
    }
  }

  async function handleCheckout() {
    if (!selectedPaymentMethodId) {
      setError("Selecciona un metodo de pago");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }

    try {
      setError(null);
      await createSale.mutateAsync({
        details: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: 0,
          tax_amount: Math.round(item.quantity * item.unitPrice * 0.19),
        })),
        payments: [
          {
            payment_method_id: selectedPaymentMethodId,
            amount: totals.total,
            reference: paymentReference || undefined,
          },
        ],
      });
      clearCart();
      setPaymentReference("");
      setBarcode("");
      barcodeInputRef.current?.focus();
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "No fue posible registrar la venta");
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
      <div className="space-y-6">
        <SectionTitle
          title="Punto de venta"
          description="Flujo enfocado en velocidad: lector siempre listo, carrito visible y cierre inmediato."
        />

        <form onSubmit={handleScanSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Codigo de barras o codigo interno</span>
            <input
              ref={barcodeInputRef}
              className="h-14 w-full rounded-md border border-slate-200 px-4 text-lg"
              placeholder="Escanear o escribir y presionar Enter"
              value={barcode}
              onChange={(event) => setBarcode(event.target.value)}
            />
          </label>
        </form>

        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-panel">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">Producto</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Cantidad</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-slate-500" colSpan={5}>
                    Aun no hay productos en el carrito.
                  </td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.product.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900">{item.product.name}</div>
                      <div className="text-slate-500">{item.product.barcode}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3">
                      <input
                        className="h-10 w-20 rounded-md border border-slate-200 px-3"
                        type="number"
                        min="1"
                        step={item.product.allows_decimal ? "0.01" : "1"}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => removeItem(item.product.id)} type="button">
                        Quitar
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-slate-950">Resumen</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>IVA</span>
              <span>{formatCurrency(totals.tax)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-slate-200 pt-3 text-base font-semibold text-slate-950">
              <span>Total</span>
              <span>{formatCurrency(totals.total)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-slate-950">Cobro</h2>
          <div className="mt-4 space-y-4">
            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Metodo de pago</span>
              <select
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
                value={selectedPaymentMethodId}
                onChange={(event) => setSelectedPaymentMethodId(event.target.value)}
              >
                <option value="">Seleccionar</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Referencia</span>
              <input
                className="h-11 w-full rounded-md border border-slate-200 px-3"
                placeholder="Voucher, transferencia o folio"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
              />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="mt-6 space-y-3">
            <Button fullWidth disabled={createSale.isPending} onClick={handleCheckout} type="button">
              {createSale.isPending ? "Procesando..." : "Confirmar venta"}
            </Button>
            <Button fullWidth variant="secondary" onClick={clearCart} type="button">
              Vaciar carrito
            </Button>
          </div>
        </div>
      </aside>
    </section>
  );
}


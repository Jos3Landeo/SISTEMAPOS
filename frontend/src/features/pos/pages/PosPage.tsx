import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Printer, Search, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { formatCurrency } from "../../../lib/currency";
import { hasPermission, PERMISSION_POS_DISCOUNT } from "../../auth/access";
import { useAuthStore } from "../../auth/hooks/useAuth";
import { useCurrentCashSession } from "../../cash/hooks/useCash";
import { useProducts } from "../../products/hooks/useProducts";
import { productService } from "../../products/services/productService";
import { getProductUnitMeta, type Product } from "../../products/types/product";
import { useGeneralSettings, useScaleSettings } from "../../settings/hooks/useSettings";
import { useSettingsStore } from "../../settings/store/useSettingsStore";
import { useCreateSale, usePaymentMethods } from "../hooks/usePos";
import { printSaleTicket } from "../lib/printTicket";
import { posService } from "../services/posService";
import { parseScaleBarcode, resolveScaleSale } from "../lib/scaleBarcode";
import { usePosStore } from "../store/usePosStore";
import type { SaleReceipt } from "../types/pos";

export function PosPage() {
  const navigate = useNavigate();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const generalSettings = useSettingsStore((state) => state.general);
  const scaleSettings = useSettingsStore((state) => state.scale);
  useGeneralSettings();
  useScaleSettings();
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const items = usePosStore((state) => state.items);
  const addItem = usePosStore((state) => state.addItem);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeItem = usePosStore((state) => state.removeItem);
  const clearCart = usePosStore((state) => state.clearCart);
  const createSale = useCreateSale();
  const { data: paymentMethods = [] } = usePaymentMethods();
  const { data: currentCashSession, isLoading: loadingCashSession } = useCurrentCashSession();
  const canApplyDiscount = hasPermission(user, PERMISSION_POS_DISCOUNT);

  const [barcode, setBarcode] = useState("");
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("");
  const [paymentReference, setPaymentReference] = useState("");
  const [cashReceived, setCashReceived] = useState("");
  const [discountMode, setDiscountMode] = useState<"amount" | "percent">("amount");
  const [discountAmount, setDiscountAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [lastSale, setLastSale] = useState<SaleReceipt | null>(null);
  const [isReprinting, setIsReprinting] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const { data: searchedProducts = [], isLoading: searchLoading } = useProducts(productSearch || undefined);

  const visibleSearchedProducts = useMemo(() => searchedProducts.slice(0, 10), [searchedProducts]);
  const selectedPaymentMethod = useMemo(
    () => paymentMethods.find((method) => method.id === selectedPaymentMethodId) ?? null,
    [paymentMethods, selectedPaymentMethodId],
  );
  const isCashPayment = selectedPaymentMethod?.code === "cash";

  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, [currentCashSession?.id]);

  useEffect(() => {
    if (!isCashPayment) {
      setCashReceived("");
    }
  }, [isCashPayment]);

  function handleAddProductFromModal(product: Product) {
    addItem(product);
    setIsSearchOpen(false);
    setProductSearch("");
    barcodeInputRef.current?.focus();
  }

  const totals = useMemo(() => {
    const grossTotal = items.reduce((acc, item) => acc + item.quantity * item.unitPrice, 0);
    const rawDiscount = canApplyDiscount ? Number(discountAmount || "0") : 0;
    const requestedDiscount =
      discountMode === "percent" ? grossTotal * (Math.min(Math.max(rawDiscount, 0), 100) / 100) : rawDiscount;
    const discount = Math.min(Math.max(requestedDiscount, 0), grossTotal);
    const total = grossTotal - discount;
    const subtotal = total / 1.19;
    const tax = total - subtotal;
    return { grossTotal, discount, subtotal, tax, total };
  }, [canApplyDiscount, discountAmount, discountMode, items]);

  const cashReceivedAmount = Number(cashReceived || "0");
  const cashDifference = cashReceivedAmount - totals.total;
  const changeDue = cashDifference > 0 ? cashDifference : 0;
  const remainingCash = cashDifference < 0 ? Math.abs(cashDifference) : 0;

  async function handleScanSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!barcode.trim() || !token) {
      return;
    }

    try {
      setError(null);
      const scannedCode = barcode.trim();
      const parsedScaleBarcode = parseScaleBarcode(scannedCode, scaleSettings);

      if (parsedScaleBarcode) {
        const strippedLookupCode = parsedScaleBarcode.lookupCode.replace(/^0+/, "") || "0";
        const lookupCandidates = Array.from(new Set([parsedScaleBarcode.lookupCode, strippedLookupCode]));
        let matched = false;

        for (const candidate of lookupCandidates) {
          try {
            const product = await productService.lookupByCode(token, candidate, scaleSettings.lookupField);
            const resolvedSale = resolveScaleSale(product, parsedScaleBarcode.embeddedValue, scaleSettings);
            addItem(product, resolvedSale.quantity);
            matched = true;
            break;
          } catch {
            // continue with next candidate
          }
        }

        if (!matched) {
          const product = await productService.lookupByCode(token, scannedCode);
          addItem(product);
        }
      } else {
        const product = await productService.lookupByCode(token, scannedCode);
        addItem(product);
      }

      setBarcode("");
      barcodeInputRef.current?.focus();
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : "No fue posible agregar el producto");
    }
  }

  async function handleCheckout() {
    if (!currentCashSession) {
      setError("Debes abrir una caja antes de registrar ventas");
      return;
    }
    if (!selectedPaymentMethodId) {
      setError("Selecciona un metodo de pago");
      return;
    }
    if (items.length === 0) {
      setError("Agrega al menos un producto");
      return;
    }
    if (isCashPayment && cashReceivedAmount < totals.total) {
      setError("El monto recibido en efectivo no cubre el total de la venta");
      return;
    }

    try {
      setError(null);
      const sale = await createSale.mutateAsync({
        cash_session_id: currentCashSession.id,
        discount_amount: totals.discount,
        details: items.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          discount_amount: 0,
          tax_amount: 0,
        })),
        payments: [
          {
            payment_method_id: selectedPaymentMethodId,
            amount: totals.total,
            reference: paymentReference || undefined,
          },
        ],
      });
      setLastSale(sale);
      clearCart();
      setPaymentReference("");
      setCashReceived("");
      setDiscountMode("amount");
      setDiscountAmount("");
      setBarcode("");
      barcodeInputRef.current?.focus();
      printSaleTicket({
        sale,
        general: generalSettings,
        cashierName: user?.full_name,
      });
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "No fue posible registrar la venta");
    }
  }

  async function handleReprintLastTicket() {
    if (!token) {
      setError("Tu sesion no es valida para consultar la ultima venta");
      return;
    }

    try {
      setIsReprinting(true);
      setError(null);
      const latestSale = await posService.getLatestSale(token, currentCashSession?.id);
      setLastSale(latestSale);
      printSaleTicket({
        sale: latestSale,
        general: generalSettings,
        cashierName: latestSale.user?.full_name ?? user?.full_name,
      });
    } catch (reprintError) {
      setError(reprintError instanceof Error ? reprintError.message : "No fue posible reimprimir el ultimo ticket");
    } finally {
      setIsReprinting(false);
    }
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_420px]">
      <div className="space-y-6">
        <SectionTitle
          title="Punto de venta"
          description="Flujo enfocado en velocidad: lector siempre listo, carrito visible y cierre inmediato."
        />

        {loadingCashSession ? <p className="text-sm text-slate-500">Verificando caja activa...</p> : null}

        {!loadingCashSession && !currentCashSession ? (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-panel">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-3">
                <div className="rounded-md bg-amber-100 p-2 text-amber-700">
                  <WalletCards className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Caja no abierta</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Antes de vender debes registrar la caja inicial del turno para dejar trazabilidad completa.
                  </p>
                </div>
              </div>
              <Button type="button" onClick={() => navigate("/cash")}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Abrir caja
              </Button>
            </div>
          </div>
        ) : null}

        {currentCashSession ? (
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-500">Caja activa</p>
                <p className="text-base font-semibold text-slate-950">{currentCashSession.cash_register.name}</p>
              </div>
              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div>
                  <p className="text-slate-500">Inicial</p>
                  <p className="font-medium text-slate-900">{formatCurrency(Number(currentCashSession.opening_amount))}</p>
                </div>
                <div>
                  <p className="text-slate-500">Efectivo esperado</p>
                  <p className="font-medium text-slate-900">
                    {formatCurrency(Number(currentCashSession.metrics.expected_cash_amount))}
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">Ventas completadas</p>
                  <p className="font-medium text-slate-900">{currentCashSession.metrics.completed_sales_count}</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <form onSubmit={handleScanSubmit} className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            <label className="block flex-1 space-y-2">
              <span className="text-sm font-medium text-slate-700">Codigo de barras o codigo interno</span>
              <input
                ref={barcodeInputRef}
                className="h-14 w-full rounded-md border border-slate-200 px-4 text-lg"
                placeholder="Escanear o escribir y presionar Enter"
                value={barcode}
                onChange={(event) => setBarcode(event.target.value)}
                disabled={!currentCashSession}
              />
            </label>
            <Button type="button" variant="secondary" onClick={() => setIsSearchOpen(true)} disabled={!currentCashSession}>
              <Search className="mr-2 h-4 w-4" />
              Buscar producto
            </Button>
          </div>
          {scaleSettings.enabled ? (
            <p className="mt-3 text-xs text-slate-500">
              Balanza activa: EAN-13 prefijo {scaleSettings.ean13Prefix}, valor por{" "}
              {scaleSettings.valueMode === "weight" ? "peso" : "precio"}.
            </p>
          ) : null}
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
                      <div className="text-slate-500">
                        {item.product.barcode} - {getProductUnitMeta(item.product.unit_of_measure).label}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(item.unitPrice)} / {getProductUnitMeta(item.product.unit_of_measure).stockLabel}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        className="h-10 w-20 rounded-md border border-slate-200 px-3"
                        type="number"
                        min={item.product.allows_decimal ? "0.01" : "1"}
                        step={item.product.allows_decimal ? "0.01" : "1"}
                        value={item.quantity}
                        onChange={(event) => updateQuantity(item.product.id, Number(event.target.value))}
                        disabled={!currentCashSession}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{formatCurrency(item.unitPrice * item.quantity)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="secondary" onClick={() => removeItem(item.product.id)} type="button" disabled={!currentCashSession}>
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

      {isSearchOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-4xl rounded-lg bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Buscar producto</h2>
                <p className="text-sm text-slate-500">Busca por nombre, codigo de barras o codigo interno.</p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsSearchOpen(false);
                  setProductSearch("");
                  barcodeInputRef.current?.focus();
                }}
              >
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
                    <th className="px-4 py-3 font-medium">Precio</th>
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
                          {formatCurrency(Number(product.sale_price))} / {getProductUnitMeta(product.unit_of_measure).stockLabel}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {product.stock_current} {getProductUnitMeta(product.unit_of_measure).stockLabel}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button type="button" onClick={() => handleAddProductFromModal(product)}>
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

      <aside className="space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <h2 className="text-lg font-semibold text-slate-950">Resumen</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatCurrency(totals.subtotal)}</span>
            </div>
            {totals.discount > 0 ? (
              <div className="flex items-center justify-between text-emerald-700">
                <span>Descuento</span>
                <span>-{formatCurrency(totals.discount)}</span>
              </div>
            ) : null}
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
            {canApplyDiscount ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">Descuento total</span>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDiscountMode("amount");
                      setDiscountAmount("");
                    }}
                  >
                    Quitar descuento
                  </Button>
                </div>

                <div className="grid grid-cols-2 overflow-hidden rounded-md border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    className={`rounded-sm px-3 py-2 text-sm font-medium transition ${
                      discountMode === "amount" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                    }`}
                    onClick={() => setDiscountMode("amount")}
                  >
                    Por monto
                  </button>
                  <button
                    type="button"
                    className={`rounded-sm px-3 py-2 text-sm font-medium transition ${
                      discountMode === "percent" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"
                    }`}
                    onClick={() => setDiscountMode("percent")}
                  >
                    Por porcentaje
                  </button>
                </div>

                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <span>{discountMode === "amount" ? "Monto de descuento" : "Porcentaje de descuento"}</span>
                  <input
                    className="h-11 w-full rounded-md border border-slate-200 px-3"
                    type="number"
                    min="0"
                    max={discountMode === "amount" ? (totals.grossTotal > 0 ? totals.grossTotal : undefined) : 100}
                    step={discountMode === "amount" ? "0.01" : "1"}
                    placeholder={discountMode === "amount" ? "Ej. 500" : "Ej. 10"}
                    value={discountAmount}
                    onChange={(event) => setDiscountAmount(event.target.value)}
                    disabled={!currentCashSession}
                  />
                </label>
                <p className="text-xs text-slate-500">
                  Se aplica al total de la venta antes de confirmar.
                  {discountMode === "percent" ? ` Descuento calculado: ${formatCurrency(totals.discount)}.` : null}
                </p>
              </div>
            ) : null}

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Metodo de pago</span>
              <select
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3"
                value={selectedPaymentMethodId}
                onChange={(event) => {
                  setSelectedPaymentMethodId(event.target.value);
                  setError(null);
                }}
                disabled={!currentCashSession}
              >
                <option value="">Seleccionar</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </label>

            {isCashPayment ? (
              <>
                <label className="block space-y-2 text-sm font-medium text-slate-700">
                  <div className="flex items-center justify-between gap-3">
                    <span>Monto recibido</span>
                    <Button type="button" variant="secondary" onClick={() => setCashReceived(String(totals.total))}>
                      Monto exacto
                    </Button>
                  </div>
                  <input
                    className="h-11 w-full rounded-md border border-slate-200 px-3"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Ej. 10000"
                    value={cashReceived}
                    onChange={(event) => setCashReceived(event.target.value)}
                    disabled={!currentCashSession}
                  />
                </label>

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Vuelto</p>
                    <p className="mt-2 text-lg font-semibold text-emerald-700">{formatCurrency(changeDue)}</p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Falta por cubrir</p>
                    <p className={`mt-2 text-lg font-semibold ${remainingCash > 0 ? "text-rose-700" : "text-slate-950"}`}>
                      {formatCurrency(remainingCash)}
                    </p>
                  </div>
                </div>
              </>
            ) : null}

            <label className="block space-y-2 text-sm font-medium text-slate-700">
              <span>Referencia</span>
              <input
                className="h-11 w-full rounded-md border border-slate-200 px-3"
                placeholder="Voucher, transferencia o folio"
                value={paymentReference}
                onChange={(event) => setPaymentReference(event.target.value)}
                disabled={!currentCashSession}
              />
            </label>
          </div>

          {error ? <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}

          <div className="mt-6 space-y-3">
            <Button fullWidth disabled={createSale.isPending || !currentCashSession} onClick={handleCheckout} type="button">
              {createSale.isPending ? "Procesando..." : "Confirmar venta"}
            </Button>
            <Button fullWidth variant="secondary" onClick={handleReprintLastTicket} type="button" disabled={isReprinting}>
              <Printer className="mr-2 h-4 w-4" />
              {isReprinting ? "Buscando ultimo ticket..." : "Reimprimir ultimo ticket"}
            </Button>
            <Button fullWidth variant="secondary" onClick={clearCart} type="button" disabled={!currentCashSession}>
              Vaciar carrito
            </Button>
          </div>
        </div>
      </aside>
    </section>
  );
}

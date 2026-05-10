import {
  AlertTriangle,
  ArrowRight,
  CalendarDays,
  ChartColumn,
  Receipt,
  WalletCards,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";

import { SectionTitle } from "../../../components/ui/SectionTitle";
import { hasPermission, PERMISSION_INVENTORY, PERMISSION_POS, PERMISSION_PRODUCTS, PERMISSION_REPORTS } from "../../auth/access";
import { useAuthStore } from "../../auth/hooks/useAuth";
import { useCurrentCashSession } from "../../cash/hooks/useCash";
import { useProducts } from "../../products/hooks/useProducts";
import { getProductUnitMeta } from "../../products/types/product";
import { useSalesList } from "../../pos/hooks/usePos";
import { useVentasDiaReport } from "../../reports/hooks/useReports";
import { formatMoney } from "../../reports/lib/cashDailyReport";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

function toDateKey(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatCompactDate(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "short",
  }).format(new Date(`${value}T00:00:00`));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function DashboardMetricCard({
  title,
  value,
  description,
  icon,
}: {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <div className="rounded-md border border-slate-200 bg-slate-50 p-2 text-slate-600">{icon}</div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const canUsePos = hasPermission(user, PERMISSION_POS);
  const canViewReports = hasPermission(user, PERMISSION_REPORTS);
  const canViewCatalog = hasPermission(user, PERMISSION_PRODUCTS) || canUsePos;
  const canViewInventory = hasPermission(user, PERMISSION_INVENTORY);

  const { data: sales = [], isLoading: salesLoading } = useSalesList(canUsePos || canViewReports);
  const { data: todayReport, isLoading: todayLoading } = useVentasDiaReport({}, canViewReports);
  const { data: currentCashSession, isLoading: cashLoading } = useCurrentCashSession(canUsePos);
  const { data: products = [], isLoading: productsLoading } = useProducts(undefined, canViewCatalog);

  const now = new Date();
  const todayKey = todayReport?.fecha ?? toDateKey(now);
  const currentMonthKey = `${todayKey.slice(0, 7)}`;

  const dashboardData = useMemo(() => {
    const completedSales = sales.filter((sale) => sale.status === "completed");
    const cancelledSales = sales.filter((sale) => sale.status === "cancelled");

    const todaySales = completedSales.filter((sale) => toDateKey(sale.created_at) === todayKey);
    const monthSales = completedSales.filter((sale) => toDateKey(sale.created_at).startsWith(currentMonthKey));

    const monthTotal = monthSales.reduce((acc, sale) => acc + Number(sale.total), 0);
    const todayTotal = todayReport ? Number(todayReport.resumen.total_vendido) : todaySales.reduce((acc, sale) => acc + Number(sale.total), 0);
    const todayCount = todayReport ? todayReport.resumen.cantidad_ventas_completadas : todaySales.length;
    const todayAverage = todayCount > 0 ? todayTotal / todayCount : 0;

    const monthDailyMap = new Map<string, number>();
    monthSales.forEach((sale) => {
      const dayKey = toDateKey(sale.created_at);
      monthDailyMap.set(dayKey, (monthDailyMap.get(dayKey) ?? 0) + Number(sale.total));
    });

    const trendEntries = Array.from(monthDailyMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-10)
      .map(([date, total]) => ({ date, total }));

    const maxTrendTotal = trendEntries.reduce((acc, item) => Math.max(acc, item.total), 0);

    const lowStockProducts = products
      .filter((product) => Number(product.stock_current) <= Number(product.stock_minimum))
      .sort((left, right) => Number(left.stock_current) - Number(right.stock_current))
      .slice(0, 5);

    return {
      todayTotal,
      todayCount,
      todayAverage,
      monthTotal,
      monthCount: monthSales.length,
      cancelledTodayCount: cancelledSales.filter((sale) => toDateKey(sale.created_at) === todayKey).length,
      recentSales: sales.slice(0, 6),
      trendEntries,
      maxTrendTotal,
      lowStockProducts,
      lowStockCount: products.filter((product) => Number(product.stock_current) <= Number(product.stock_minimum)).length,
    };
  }, [currentMonthKey, products, sales, todayKey, todayReport]);

  return (
    <section className="space-y-6">
      <SectionTitle
        title="Resumen operativo"
        description="Una vista rapida de ventas, caja, alertas y accesos para arrancar el turno con contexto."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DashboardMetricCard
          title="Venta de hoy"
          value={salesLoading || todayLoading ? "..." : formatCurrency(dashboardData.todayTotal)}
          description={`${dashboardData.todayCount} ventas completadas hoy`}
          icon={<Receipt className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Venta del mes"
          value={salesLoading ? "..." : formatCurrency(dashboardData.monthTotal)}
          description={`${dashboardData.monthCount} ventas completadas en el mes`}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Ticket promedio"
          value={salesLoading || todayLoading ? "..." : formatCurrency(dashboardData.todayAverage)}
          description={`${dashboardData.cancelledTodayCount} ventas anuladas hoy`}
          icon={<ChartColumn className="h-5 w-5" />}
        />
        <DashboardMetricCard
          title="Stock bajo"
          value={productsLoading ? "..." : String(dashboardData.lowStockCount)}
          description="Productos que ya llegaron a su minimo"
          icon={<AlertTriangle className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_380px]">
        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Tendencia del mes</h2>
                <p className="mt-1 text-sm text-slate-500">Ultimos dias con ventas completadas para leer ritmo comercial.</p>
              </div>
              <Link
                className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700"
                to={canViewReports ? "/reports/ventas-dia" : "/pos"}
              >
                Ver detalle
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid min-h-[230px] grid-cols-10 items-end gap-3">
              {dashboardData.trendEntries.length === 0 ? (
                <div className="col-span-10 flex h-full items-center justify-center rounded-md border border-dashed border-slate-200 text-sm text-slate-500">
                  Aun no hay suficientes ventas del mes para mostrar una tendencia.
                </div>
              ) : (
                dashboardData.trendEntries.map((entry) => {
                  const height = dashboardData.maxTrendTotal > 0 ? Math.max(14, (entry.total / dashboardData.maxTrendTotal) * 160) : 14;
                  return (
                    <div key={entry.date} className="flex h-full flex-col justify-end gap-2">
                      <div className="text-center text-[11px] text-slate-500">{formatCurrency(entry.total)}</div>
                      <div
                        className="rounded-t-md bg-brand-500"
                        style={{ height: `${height}px` }}
                        title={`${formatCompactDate(entry.date)}: ${formatCurrency(entry.total)}`}
                      />
                      <div className="text-center text-xs text-slate-500">{formatCompactDate(entry.date)}</div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white shadow-panel">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Ventas recientes</h2>
                <p className="mt-1 text-sm text-slate-500">Ultimos folios registrados para comprobar ritmo y estado.</p>
              </div>
              {canViewReports ? (
                <Link className="text-sm font-medium text-brand-600 hover:text-brand-700" to="/reports/ventas-dia">
                  Ir a ventas del dia
                </Link>
              ) : null}
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50 text-left text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Folio</th>
                    <th className="px-4 py-3 font-medium">Fecha</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesLoading ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>
                        Cargando ventas...
                      </td>
                    </tr>
                  ) : dashboardData.recentSales.length === 0 ? (
                    <tr>
                      <td className="px-4 py-6 text-slate-500" colSpan={4}>
                        Aun no hay ventas registradas.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.recentSales.map((sale) => (
                      <tr key={sale.id}>
                        <td className="px-4 py-3 font-medium text-slate-900">{sale.sale_number}</td>
                        <td className="px-4 py-3 text-slate-600">{formatDateTime(sale.created_at)}</td>
                        <td className="px-4 py-3 text-slate-600">{sale.status === "completed" ? "Completada" : "Anulada"}</td>
                        <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(Number(sale.total))}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <h2 className="text-lg font-semibold text-slate-950">Estado de caja</h2>
            {canUsePos ? (
              cashLoading ? (
                <p className="mt-4 text-sm text-slate-500">Consultando caja activa...</p>
              ) : currentCashSession ? (
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div>
                    <p className="text-slate-500">Caja</p>
                    <p className="font-medium text-slate-950">{currentCashSession.cash_register.name}</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-slate-500">Inicial</p>
                      <p className="mt-1 font-semibold text-slate-950">{formatMoney(currentCashSession.opening_amount)}</p>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                      <p className="text-slate-500">Esperado</p>
                      <p className="mt-1 font-semibold text-slate-950">
                        {formatMoney(currentCashSession.metrics.expected_cash_amount)}
                      </p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-slate-500">Ventas completadas</p>
                      <p className="font-medium text-slate-950">{currentCashSession.metrics.completed_sales_count}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Ventas anuladas</p>
                      <p className="font-medium text-slate-950">{currentCashSession.metrics.cancelled_sales_count}</p>
                    </div>
                  </div>
                  <Link className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700" to="/cash">
                    Ir a caja
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : (
                <div className="mt-4 rounded-md border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                  No hay una caja abierta para este usuario en este momento.
                </div>
              )
            ) : (
              <p className="mt-4 text-sm text-slate-500">Tu rol actual no usa flujo de caja.</p>
            )}
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-950">Alertas de stock</h2>
                <p className="mt-1 text-sm text-slate-500">Productos mas comprometidos para priorizar reposicion.</p>
              </div>
              {canViewReports ? (
                <Link className="text-sm font-medium text-brand-600 hover:text-brand-700" to="/reports/stock-bajo">
                  Ver reporte
                </Link>
              ) : null}
            </div>

            <div className="mt-4 space-y-3">
              {productsLoading ? (
                <p className="text-sm text-slate-500">Cargando alertas...</p>
              ) : dashboardData.lowStockProducts.length === 0 ? (
                <div className="rounded-md border border-dashed border-slate-200 px-4 py-4 text-sm text-slate-500">
                  No hay productos bajo minimo ahora mismo.
                </div>
              ) : (
                dashboardData.lowStockProducts.map((product) => (
                  <div key={product.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">{product.name}</p>
                        <p className="text-xs text-slate-500">{product.barcode}</p>
                      </div>
                      <span className="text-sm font-semibold text-rose-700">
                        {product.stock_current} / {product.stock_minimum}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500">
                      Unidad: {getProductUnitMeta(product.unit_of_measure).stockLabel}
                    </p>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

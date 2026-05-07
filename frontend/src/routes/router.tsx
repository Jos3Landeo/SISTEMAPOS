import { createBrowserRouter } from "react-router-dom";

import { AdminLayout } from "../components/layout/AdminLayout";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { InventoryPage } from "../features/inventory/pages/InventoryPage";
import { PosPage } from "../features/pos/pages/PosPage";
import { ProductsPage } from "../features/products/pages/ProductsPage";
import { ReportsPage } from "../features/reports/pages/ReportsPage";
import { LoginPage } from "../features/auth/pages/LoginPage";
import { SectionTitle } from "../components/ui/SectionTitle";

function DashboardPage() {
  return (
    <section className="space-y-6">
      <SectionTitle
        title="Resumen operativo"
        description="Entrada corta a caja, inventario y salud general del local."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-slate-500">Ventas</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">POS listo</p>
          <p className="mt-2 text-sm text-slate-500">Usa el modulo POS para registrar ventas y movimientos.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-slate-500">Stock</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">Trazable</p>
          <p className="mt-2 text-sm text-slate-500">Cada venta y ajuste queda preparado para historial.</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-slate-500">Escalabilidad</p>
          <p className="mt-2 text-3xl font-semibold text-slate-950">Modular</p>
          <p className="mt-2 text-sm text-slate-500">Separacion por dominios para crecer a nube y sucursales.</p>
        </div>
      </div>
    </section>
  );
}

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: "/",
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "pos", element: <PosPage /> },
          { path: "products", element: <ProductsPage /> },
          { path: "inventory", element: <InventoryPage /> },
          { path: "reports", element: <ReportsPage /> },
        ],
      },
    ],
  },
]);

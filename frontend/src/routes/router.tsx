import { Navigate, createBrowserRouter } from "react-router-dom";

import { AdminLayout } from "../components/layout/AdminLayout";
import { PermissionRoute } from "../components/layout/PermissionRoute";
import { ProtectedRoute } from "../components/layout/ProtectedRoute";
import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import {
  PERMISSION_CATEGORIES,
  PERMISSION_CASHIERS,
  PERMISSION_INVENTORY,
  PERMISSION_POS,
  PERMISSION_PRODUCTS,
  PERMISSION_REPORTS,
  PERMISSION_SETTINGS,
} from "../features/auth/access";
import { CashPage } from "../features/cash/pages/CashPage";
import { CashiersPage } from "../features/cashiers/pages/CashiersPage";
import { CategoriesPage } from "../features/categories/pages/CategoriesPage";
import { InventoryPage } from "../features/inventory/pages/InventoryPage";
import { PosPage } from "../features/pos/pages/PosPage";
import { ProductFormPage } from "../features/products/pages/ProductFormPage";
import { ProductListPage } from "../features/products/pages/ProductListPage";
import { PurchasesPage } from "../features/purchases/pages/PurchasesPage";
import { SuppliersPage } from "../features/suppliers/pages/SuppliersPage";
import { ReportePlaceholderPage } from "../features/reports/components/ReportePlaceholderPage";
import { CajaDiariaReportePage } from "../features/reports/pages/CajaDiariaReportePage";
import { MovimientosInventarioReportePage } from "../features/reports/pages/MovimientosInventarioReportePage";
import { ReportsPage } from "../features/reports/pages/ReportsPage";
import { StockBajoReportePage } from "../features/reports/pages/StockBajoReportePage";
import { VentasDiaReportePage } from "../features/reports/pages/VentasDiaReportePage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";
import { LoginPage } from "../features/auth/pages/LoginPage";

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
          {
            element: <PermissionRoute permission={PERMISSION_POS} />,
            children: [
              { path: "cash", element: <CashPage /> },
              { path: "pos", element: <PosPage /> },
            ],
          },
          {
            element: <PermissionRoute permission={PERMISSION_PRODUCTS} />,
            children: [
              { path: "products", element: <Navigate to="/products/list" replace /> },
              { path: "products/list", element: <ProductListPage /> },
              { path: "products/new", element: <ProductFormPage /> },
              { path: "products/edit/:productId", element: <ProductFormPage /> },
            ],
          },
          {
            element: <PermissionRoute permission={PERMISSION_CATEGORIES} />,
            children: [{ path: "categories", element: <CategoriesPage /> }],
          },
          {
            element: <PermissionRoute permission={PERMISSION_INVENTORY} />,
            children: [
              { path: "suppliers", element: <SuppliersPage /> },
              { path: "purchases", element: <PurchasesPage /> },
              { path: "inventory", element: <InventoryPage /> },
            ],
          },
          {
            element: <PermissionRoute permission={PERMISSION_REPORTS} />,
            children: [
              { path: "reports", element: <ReportsPage /> },
              { path: "reports/ventas-dia", element: <VentasDiaReportePage /> },
              {
                path: "reports/ventas-fecha",
                element: (
                  <ReportePlaceholderPage
                    title="Ventas por fecha"
                    description="Rango de fechas, metodo de pago, cajero y estado."
                  />
                ),
              },
              {
                path: "reports/detalle-ventas",
                element: (
                  <ReportePlaceholderPage
                    title="Detalle de ventas"
                    description="Vista consolidada de ventas, folios y estados."
                  />
                ),
              },
              {
                path: "reports/productos-mas-vendidos",
                element: (
                  <ReportePlaceholderPage
                    title="Productos mas vendidos"
                    description="Ranking comercial por cantidad y total vendido."
                  />
                ),
              },
              {
                path: "reports/stock-bajo",
                element: <StockBajoReportePage />,
              },
              {
                path: "reports/caja-diaria",
                element: <CajaDiariaReportePage />,
              },
              {
                path: "reports/movimientos-inventario",
                element: <MovimientosInventarioReportePage />,
              },
              {
                path: "reports/ganancia-utilidad",
                element: (
                  <ReportePlaceholderPage
                    title="Ganancia / utilidad"
                    description="Base preparada para utilidad bruta y margenes."
                  />
                ),
              },
              {
                path: "reports/ventas-categoria",
                element: (
                  <ReportePlaceholderPage
                    title="Ventas por categoria"
                    description="Distribucion de ventas agrupada por categoria comercial."
                  />
                ),
              },
            ],
          },
          {
            element: <PermissionRoute permission={PERMISSION_CASHIERS} />,
            children: [{ path: "cashiers", element: <CashiersPage /> }],
          },
          {
            element: <PermissionRoute permission={PERMISSION_SETTINGS} />,
            children: [{ path: "settings", element: <SettingsPage /> }],
          },
        ],
      },
    ],
  },
]);

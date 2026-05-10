import { Barcode, Boxes, Building2, LayoutDashboard, LineChart, LogOut, PackagePlus, Settings, ShoppingCart, Tags, UsersRound, WalletCards } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import {
  type AppPermission,
  PERMISSION_CATEGORIES,
  PERMISSION_CASHIERS,
  PERMISSION_INVENTORY,
  PERMISSION_POS,
  PERMISSION_PRODUCTS,
  PERMISSION_REPORTS,
  PERMISSION_SETTINGS,
  hasPermission,
} from "../../features/auth/access";
import { useAuthStore } from "../../features/auth/hooks/useAuth";
import { useCurrentCashSession } from "../../features/cash/hooks/useCash";

type NavigationItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  end?: boolean;
  permission?: AppPermission;
};

const navigation: NavigationItem[] = [
  { to: "/", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/cash", label: "Caja", icon: WalletCards, permission: PERMISSION_POS },
  { to: "/pos", label: "POS", icon: Barcode, permission: PERMISSION_POS },
  { to: "/products/list", label: "Productos", icon: Boxes, permission: PERMISSION_PRODUCTS },
  { to: "/products/new", label: "Nuevo producto", icon: PackagePlus, permission: PERMISSION_PRODUCTS },
  { to: "/categories", label: "Categorias", icon: Tags, permission: PERMISSION_CATEGORIES },
  { to: "/suppliers", label: "Proveedores", icon: Building2, permission: PERMISSION_INVENTORY },
  { to: "/purchases", label: "Compras", icon: ShoppingCart, permission: PERMISSION_INVENTORY },
  { to: "/inventory", label: "Inventario", icon: Boxes, permission: PERMISSION_INVENTORY },
  { to: "/reports", label: "Reportes", icon: LineChart, permission: PERMISSION_REPORTS },
  { to: "/cashiers", label: "Cajeros", icon: UsersRound, permission: PERMISSION_CASHIERS },
  { to: "/settings", label: "Config", icon: Settings, permission: PERMISSION_SETTINGS },
];

export function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);
  const canUsePos = hasPermission(user, PERMISSION_POS);
  const { data: currentCashSession } = useCurrentCashSession(canUsePos);
  const visibleNavigation = navigation.filter((item) => !item.permission || hasPermission(user, item.permission));

  return (
    <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-r border-slate-200 bg-slate-950 px-4 py-6 text-white">
        <div className="space-y-1 px-2">
          <p className="text-xs uppercase tracking-normal text-slate-400">Minimarket</p>
          <p className="text-xl font-semibold">Sistema POS</p>
        </div>

        <nav className="mt-8 space-y-1">
          {visibleNavigation.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                  isActive ? "bg-brand-500 text-white" : "text-slate-300 hover:bg-slate-900 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mt-8 rounded-md border border-slate-800 px-3 py-3 text-sm text-slate-300">
          <p className="font-medium text-white">{user?.full_name}</p>
          <p>{user?.role.name}</p>
        </div>

        <button
          className="mt-4 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-300 transition hover:bg-slate-900 hover:text-white"
          onClick={clearSession}
          type="button"
        >
          <LogOut className="h-4 w-4" />
          <span>Salir</span>
        </button>
      </aside>

      <main className="min-w-0">
        <header className="border-b border-slate-200 bg-white px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-500">Operacion local</p>
              <p className="text-lg font-semibold text-slate-950">Control de ventas e inventario</p>
            </div>
            <div className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">
              {canUsePos
                ? currentCashSession
                  ? `${currentCashSession.cash_register.name} abierta`
                  : "Caja pendiente de apertura"
                : "Panel administrativo"}
            </div>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

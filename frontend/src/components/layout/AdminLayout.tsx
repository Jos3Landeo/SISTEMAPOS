import { Barcode, Boxes, LayoutDashboard, LineChart, LogOut } from "lucide-react";
import { NavLink, Outlet } from "react-router-dom";

import { useAuthStore } from "../../features/auth/hooks/useAuth";

const navigation = [
  { to: "/", label: "Resumen", icon: LayoutDashboard, end: true },
  { to: "/pos", label: "POS", icon: Barcode },
  { to: "/products", label: "Productos", icon: Boxes },
  { to: "/inventory", label: "Inventario", icon: Boxes },
  { to: "/reports", label: "Reportes", icon: LineChart },
];

export function AdminLayout() {
  const user = useAuthStore((state) => state.user);
  const clearSession = useAuthStore((state) => state.clearSession);

  return (
    <div className="grid min-h-screen lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="border-r border-slate-200 bg-slate-950 px-4 py-6 text-white">
        <div className="space-y-1 px-2">
          <p className="text-xs uppercase tracking-normal text-slate-400">Minimarket</p>
          <p className="text-xl font-semibold">Sistema POS</p>
        </div>

        <nav className="mt-8 space-y-1">
          {navigation.map(({ to, label, icon: Icon, end }) => (
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
            <div className="rounded-md bg-slate-100 px-3 py-2 text-sm text-slate-600">Caja lista para operar</div>
          </div>
        </header>

        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}


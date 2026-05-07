import { SectionTitle } from "../../../components/ui/SectionTitle";

export function ReportsPage() {
  return (
    <section className="space-y-6">
      <SectionTitle
        title="Reportes"
        description="Espacio base para evolucionar hacia dashboard administrativo y conciliacion operativa."
      />
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-slate-500">Ventas</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">Base lista para historico y cortes</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-slate-500">Inventario</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">Preparado para quiebres, rotacion y ajustes</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
          <p className="text-sm text-slate-500">Caja</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">Preparado para arqueos y diferencias</p>
        </div>
      </div>
    </section>
  );
}


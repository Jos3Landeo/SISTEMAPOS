import { SectionTitle } from "../../../components/ui/SectionTitle";
import { ReporteCard } from "../components/ReporteCard";

const reportCards = [
  {
    title: "Ventas del dia",
    description: "Resumen operativo de hoy, filtros, detalle y cierre imprimible.",
    to: "/reports/ventas-dia",
    status: "available" as const,
  },
  {
    title: "Ventas por fecha",
    description: "Consulta por rango de fechas, cajero, estado y metodo de pago.",
    to: "/reports/ventas-fecha",
    status: "coming-soon" as const,
  },
  {
    title: "Detalle de ventas",
    description: "Vista consolidada de folios, horas, cajeros y totales.",
    to: "/reports/detalle-ventas",
    status: "coming-soon" as const,
  },
  {
    title: "Productos mas vendidos",
    description: "Rotacion del catalogo por unidades y total vendido.",
    to: "/reports/productos-mas-vendidos",
    status: "coming-soon" as const,
  },
  {
    title: "Stock bajo",
    description: "Productos bajo minimo para reaccionar antes del quiebre.",
    to: "/reports/stock-bajo",
    status: "available" as const,
  },
  {
    title: "Caja diaria",
    description: "Resumen de caja, diferencias y conciliacion del turno.",
    to: "/reports/caja-diaria",
    status: "available" as const,
  },
  {
    title: "Movimientos de inventario",
    description: "Entradas, ventas, ajustes y anulaciones con trazabilidad.",
    to: "/reports/movimientos-inventario",
    status: "available" as const,
  },
  {
    title: "Ganancia / utilidad",
    description: "Base preparada para utilidad bruta y margenes.",
    to: "/reports/ganancia-utilidad",
    status: "coming-soon" as const,
  },
  {
    title: "Ventas por categoria",
    description: "Agrupa el rendimiento comercial por familia de productos.",
    to: "/reports/ventas-categoria",
    status: "coming-soon" as const,
  },
];

export function ReportsPage() {
  return (
    <section className="space-y-6">
      <SectionTitle
        title="Reportes"
        description="Selecciona el reporte operativo que necesitas revisar o exportar."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reportCards.map((card) => (
          <ReporteCard
            key={card.to}
            title={card.title}
            description={card.description}
            to={card.to}
            status={card.status}
          />
        ))}
      </div>
    </section>
  );
}

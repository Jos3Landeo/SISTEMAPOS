import type { ReactNode } from "react";
import { CreditCard, Receipt, ScanBarcode, Wallet } from "lucide-react";

import { formatCurrency } from "../../../lib/currency";
import type { VentasDiaResumen } from "../types/report";

type ResumenVentasDiaProps = {
  resumen: VentasDiaResumen;
};

function SummaryCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold text-slate-950">{value}</p>
        </div>
        <div className="rounded-md bg-brand-50 p-2 text-brand-600">{icon}</div>
      </div>
    </div>
  );
}

export function ResumenVentasDia({ resumen }: ResumenVentasDiaProps) {
  const otros = Number(resumen.total_otros);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total vendido hoy" value={formatCurrency(Number(resumen.total_vendido))} icon={<Wallet className="h-5 w-5" />} />
        <SummaryCard title="Cantidad de ventas" value={String(resumen.cantidad_ventas)} icon={<Receipt className="h-5 w-5" />} />
        <SummaryCard title="Ticket promedio" value={formatCurrency(Number(resumen.ticket_promedio))} icon={<ScanBarcode className="h-5 w-5" />} />
        <SummaryCard title="Efectivo" value={formatCurrency(Number(resumen.total_efectivo))} icon={<Wallet className="h-5 w-5" />} />
        <SummaryCard title="Tarjeta" value={formatCurrency(Number(resumen.total_tarjeta))} icon={<CreditCard className="h-5 w-5" />} />
        <SummaryCard
          title="Transferencia"
          value={formatCurrency(Number(resumen.total_transferencia))}
          icon={<CreditCard className="h-5 w-5" />}
        />
        {otros > 0 ? (
          <SummaryCard title="Otros metodos" value={formatCurrency(otros)} icon={<CreditCard className="h-5 w-5" />} />
        ) : null}
      </div>

      {resumen.otros_desglose.length > 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-panel">
          <h3 className="text-sm font-semibold text-slate-950">Desglose de otros metodos</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {resumen.otros_desglose.map((item) => (
              <span key={item.label} className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                {item.label}: {formatCurrency(Number(item.amount))}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

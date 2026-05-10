import { ArrowRight, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

type ReporteCardProps = {
  title: string;
  description: string;
  to: string;
  status: "available" | "coming-soon";
};

export function ReporteCard({ title, description, to, status }: ReporteCardProps) {
  return (
    <Link
      to={to}
      className="group rounded-lg border border-slate-200 bg-white p-5 shadow-panel transition hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
        <span
          className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
            status === "available"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {status === "available" ? (
            <>
              <ArrowRight className="h-3.5 w-3.5" />
              Disponible
            </>
          ) : (
            <>
              <Wrench className="h-3.5 w-3.5" />
              En desarrollo
            </>
          )}
        </span>
      </div>
    </Link>
  );
}

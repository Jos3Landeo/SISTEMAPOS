import { Download, FileText } from "lucide-react";

import { Button } from "../../../components/ui/Button";
import { SectionTitle } from "../../../components/ui/SectionTitle";
import { exportPlaceholderExcel, exportPlaceholderPdf } from "../lib/reportExport";

type ReportePlaceholderPageProps = {
  title: string;
  description: string;
};

export function ReportePlaceholderPage({ title, description }: ReportePlaceholderPageProps) {
  return (
    <section className="space-y-6">
      <SectionTitle title={title} description={description} />

      <div className="flex flex-wrap justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => exportPlaceholderExcel(title)}>
          <Download className="mr-2 h-4 w-4" />
          Exportar Excel
        </Button>
        <Button type="button" variant="secondary" onClick={() => exportPlaceholderPdf(title)}>
          <FileText className="mr-2 h-4 w-4" />
          Exportar PDF
        </Button>
      </div>

      <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center shadow-panel">
        <h2 className="text-xl font-semibold text-slate-950">Reporte en desarrollo</h2>
        <p className="mt-3 text-sm text-slate-500">
          La estructura del reporte ya esta preparada para crecer sin romper el modulo.
        </p>
      </div>
    </section>
  );
}

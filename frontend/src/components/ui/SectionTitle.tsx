type SectionTitleProps = {
  title: string;
  description?: string;
};

export function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-slate-950">{title}</h1>
      {description ? <p className="text-sm text-slate-500">{description}</p> : null}
    </div>
  );
}


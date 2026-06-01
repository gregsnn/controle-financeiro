import { ChartNoAxesColumn } from 'lucide-react';

interface ChartEmptyProps {
  title: string;
  hint: string;
}

export function ChartEmpty({ title, hint }: ChartEmptyProps) {
  return (
    <div className="chart-empty">
      <span className="chart-empty-icon" aria-hidden>
        <ChartNoAxesColumn size={22} strokeWidth={1.8} />
      </span>
      <p className="chart-empty-title">{title}</p>
      <p className="chart-empty-hint">{hint}</p>
    </div>
  );
}

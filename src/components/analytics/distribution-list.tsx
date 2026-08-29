import { EmptyState } from "@/components/shared/empty-state";
import { formatNumber, percent } from "@/lib/utils";
import { PieChart } from "lucide-react";

export function DistributionList({ items }: { items: { key: string; total: number }[] }) {
  if (items.length === 0) {
    return <EmptyState icon={PieChart} title="Not enough data yet" className="py-8" />;
  }
  const grandTotal = items.reduce((s, i) => s + i.total, 0);
  const max = Math.max(...items.map((i) => i.total), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.key} className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{item.key}</span>
            <span className="tabular-nums text-muted-foreground">
              {formatNumber(item.total)} · {percent(item.total, grandTotal)}%
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div className="h-1.5 rounded-full bg-chart-1" style={{ width: `${Math.max(4, (item.total / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

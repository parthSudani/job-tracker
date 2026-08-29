import { formatDisplay, isToday, type DateKey } from "@/lib/date";
import { formatNumber, cn } from "@/lib/utils";

export function WeeklyOverview({ days }: { days: { date: DateKey; total: number }[] }) {
  const max = Math.max(...days.map((d) => d.total), 1);
  const strongest = days.reduce((a, b) => (b.total > a.total ? b : a), days[0]);

  return (
    <div className="space-y-3">
      {days.map((day) => (
        <div key={day.date} className="flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs font-medium text-muted-foreground">{formatDisplay(day.date, "weekday")}</span>
          <div className="h-2 flex-1 rounded-full bg-muted">
            <div
              className={cn(
                "h-2 rounded-full transition-all",
                day.total > 0 && day.date === strongest.date ? "bg-success" : "bg-primary"
              )}
              style={{ width: `${Math.max(day.total > 0 ? 4 : 0, (day.total / max) * 100)}%` }}
            />
          </div>
          <span className={cn("w-8 shrink-0 text-right text-xs tabular-nums font-medium", isToday(day.date) && "text-primary")}>
            {formatNumber(day.total)}
          </span>
        </div>
      ))}
    </div>
  );
}

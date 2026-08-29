import { Progress } from "@/components/ui/progress";
import { formatNumber, percent, cn } from "@/lib/utils";

export function GoalProgress({
  label,
  completed,
  target,
  unit = "applications",
  className,
}: {
  label?: string;
  completed: number;
  target: number;
  unit?: string;
  className?: string;
}) {
  const pct = percent(completed, target);
  const exceeded = completed > target;
  const remaining = Math.max(0, target - completed);

  return (
    <div className={cn("space-y-3", className)}>
      {label && <p className="text-sm font-medium text-muted-foreground">{label}</p>}
      <div className="flex items-end justify-between">
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-semibold tabular-nums tracking-tight">{formatNumber(completed)}</span>
          <span className="text-muted-foreground text-lg">/ {formatNumber(target)}</span>
        </div>
        <span className={cn("text-sm font-semibold tabular-nums", exceeded ? "text-success" : "text-primary")}>
          {pct}%
        </span>
      </div>
      <Progress
        value={Math.min(100, pct)}
        indicatorClassName={exceeded ? "bg-success" : undefined}
        className={cn(exceeded && "bg-success/15")}
      />
      <p className="text-xs text-muted-foreground">
        {exceeded ? (
          <span className="text-success font-medium">
            Target exceeded by {formatNumber(completed - target)} {unit} 🎉
          </span>
        ) : (
          <>
            {formatNumber(remaining)} {unit} remaining
          </>
        )}
      </p>
    </div>
  );
}

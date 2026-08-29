import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatNumber, cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  sublabel,
  trendPct,
  suffix,
  className,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  sublabel?: string;
  trendPct?: number | null;
  suffix?: string;
  className?: string;
}) {
  return (
    <Card className={cn("gap-2", className)}>
      <div className="flex items-center justify-between px-5">
        <p className="text-sm text-muted-foreground">{label}</p>
        {Icon && (
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
        )}
      </div>
      <div className="px-5">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-semibold tracking-tight tabular-nums">
            {typeof value === "number" ? formatNumber(value) : value}
          </span>
          {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
        </div>
        {(sublabel || trendPct !== undefined) && (
          <div className="mt-1 flex items-center gap-1.5">
            {trendPct !== undefined && trendPct !== null && trendPct !== 0 && (
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 text-xs font-medium",
                  trendPct > 0 ? "text-success" : "text-destructive"
                )}
              >
                {trendPct > 0 ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
                {Math.abs(trendPct)}%
              </span>
            )}
            {sublabel && <span className="text-xs text-muted-foreground">{sublabel}</span>}
          </div>
        )}
      </div>
    </Card>
  );
}

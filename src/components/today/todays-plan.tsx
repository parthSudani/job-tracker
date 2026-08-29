import { CheckCircle2, Circle, ListChecks } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const WEIGHT: Record<string, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };

export function TodaysPlan({
  platforms,
  dailyTarget,
}: {
  platforms: { id: string; name: string; priority: string; todayCount: number }[];
  dailyTarget: number;
}) {
  const planPlatforms = platforms.filter((p) => p.priority === "Critical" || p.priority === "High");
  if (planPlatforms.length === 0) return null;

  const totalWeight = planPlatforms.reduce((sum, p) => sum + (WEIGHT[p.priority] ?? 1), 0);
  const suggestions = planPlatforms.map((p) => ({
    ...p,
    suggested: Math.max(1, Math.round((dailyTarget * (WEIGHT[p.priority] ?? 1)) / totalWeight)),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="size-4 text-primary" />
          Today&apos;s Job Hunt Plan
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {suggestions.map((p) => {
            const done = p.todayCount > 0;
            return (
              <li key={p.id} className="flex items-center gap-2 text-sm">
                {done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className={cn(done ? "text-foreground" : "text-muted-foreground")}>{p.name}</span>
              </li>
            );
          })}
        </ul>
        <div className="space-y-1.5 border-t border-border pt-3">
          <p className="text-xs font-medium text-muted-foreground">Suggested distribution (a starting point — you decide the real numbers)</p>
          {suggestions.map((p) => (
            <div key={p.id} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">{p.name}</span>
              <span className="font-medium tabular-nums">{p.suggested}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

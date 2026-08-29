import { Flame } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StreakCard({ current, longest }: { current: number; longest: number }) {
  const active = current > 0;
  return (
    <Card className="py-4">
      <CardContent className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl",
            active ? "bg-warning/15 text-warning" : "bg-muted text-muted-foreground"
          )}
        >
          <Flame className={cn("size-6", active && "fill-warning/30")} />
        </div>
        <div>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">
            {current} day{current === 1 ? "" : "s"}
          </p>
          <p className="text-sm text-muted-foreground">
            Current streak · Longest {longest} day{longest === 1 ? "" : "s"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

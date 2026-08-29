"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { addMonthsToKey, formatDisplay, isToday, startOfMonthKey, todayKey, type DateKey } from "@/lib/date";
import { cn, formatNumber } from "@/lib/utils";

type DayBreakdown = { total: number; entries: { platformName: string; count: number }[] };

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function intensityClass(total: number): string {
  if (total <= 0) return "bg-muted text-muted-foreground";
  if (total <= 10) return "bg-primary/20 text-foreground";
  if (total <= 25) return "bg-primary/45 text-foreground";
  if (total <= 50) return "bg-primary/70 text-primary-foreground";
  return "bg-primary text-primary-foreground";
}

export function CalendarHeatmap({ breakdown }: { breakdown: Record<DateKey, DayBreakdown> }) {
  const [monthKey, setMonthKey] = React.useState(startOfMonthKey(todayKey()));
  const [selected, setSelected] = React.useState<DateKey | null>(null);

  const cells = React.useMemo(() => {
    const [y, m] = monthKey.split("-").map(Number);
    const first = new Date(Date.UTC(y, m - 1, 1));
    const firstDow = first.getUTCDay();
    const leading = firstDow === 0 ? 6 : firstDow - 1;
    const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();

    const out: { date: DateKey | null }[] = [];
    for (let i = 0; i < leading; i++) out.push({ date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      out.push({ date: `${monthKey.slice(0, 7)}-${String(d).padStart(2, "0")}` });
    }
    while (out.length % 7 !== 0) out.push({ date: null });
    return out;
  }, [monthKey]);

  const monthTotal = React.useMemo(
    () => cells.reduce((s, c) => s + (c.date ? (breakdown[c.date]?.total ?? 0) : 0), 0),
    [cells, breakdown]
  );

  const selectedData = selected ? breakdown[selected] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Button variant="outline" size="icon" onClick={() => setMonthKey((m) => addMonthsToKey(m, -1))} aria-label="Previous month">
          <ChevronLeft />
        </Button>
        <div className="text-center">
          <p className="font-semibold">{formatDisplay(monthKey, "monthYear")}</p>
          <p className="text-xs text-muted-foreground">{formatNumber(monthTotal)} applications this month</p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setMonthKey((m) => addMonthsToKey(m, 1))} aria-label="Next month">
          <ChevronRight />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((cell, i) => {
          if (!cell.date) return <div key={i} />;
          const total = breakdown[cell.date]?.total ?? 0;
          return (
            <button
              key={cell.date}
              onClick={() => setSelected(cell.date)}
              className={cn(
                "aspect-square rounded-lg text-xs font-medium transition-transform hover:scale-105 flex flex-col items-center justify-center gap-0.5",
                intensityClass(total),
                isToday(cell.date) && "ring-2 ring-primary ring-offset-2 ring-offset-background"
              )}
            >
              <span>{Number(cell.date.slice(-2))}</span>
              {total > 0 && <span className="text-[10px] opacity-80">{total}</span>}
            </button>
          );
        })}
      </div>

      <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
        <span>Less</span>
        {["bg-muted", "bg-primary/20", "bg-primary/45", "bg-primary/70", "bg-primary"].map((c) => (
          <span key={c} className={cn("size-3 rounded-sm", c)} />
        ))}
        <span>More</span>
      </div>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{selected ? formatDisplay(selected, "long") : ""}</DialogTitle>
            <DialogDescription>
              {formatNumber(selectedData?.total ?? 0)} application{(selectedData?.total ?? 0) === 1 ? "" : "s"} tracked
            </DialogDescription>
          </DialogHeader>
          {selectedData && selectedData.entries.length > 0 ? (
            <ul className="divide-y divide-border/70">
              {selectedData.entries.map((e) => (
                <li key={e.platformName} className="flex items-center justify-between py-1.5 text-sm">
                  <span>{e.platformName}</span>
                  <span className="font-medium tabular-nums">{e.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No applications tracked on this day.</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

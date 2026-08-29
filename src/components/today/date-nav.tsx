"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addDaysToKey, formatWithPattern, isToday, todayKey, type DateKey } from "@/lib/date";

export function DateNav({ date, dateFormat = "dd MMM yyyy" }: { date: DateKey; dateFormat?: string }) {
  const router = useRouter();

  function go(next: DateKey) {
    router.push(next === todayKey() ? "/today" : `/today?date=${next}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon" onClick={() => go(addDaysToKey(date, -1))} aria-label="Previous day">
        <ChevronLeft />
      </Button>
      <div className="flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-1.5 text-sm shadow-sm">
        <CalendarDays className="size-4 text-muted-foreground" />
        <span className="font-medium">{formatWithPattern(date, dateFormat)}</span>
        {isToday(date) && (
          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
            TODAY
          </span>
        )}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => go(addDaysToKey(date, 1))}
        disabled={date >= todayKey()}
        aria-label="Next day"
      >
        <ChevronRight />
      </Button>
      {!isToday(date) && (
        <Button variant="ghost" size="sm" onClick={() => go(todayKey())}>
          Jump to today
        </Button>
      )}
      <Input
        type="date"
        value={date}
        max={todayKey()}
        onChange={(e) => e.target.value && go(e.target.value)}
        className="w-auto"
        aria-label="Pick a date"
      />
    </div>
  );
}

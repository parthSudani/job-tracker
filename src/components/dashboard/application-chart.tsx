"use client";

import * as React from "react";
import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDisplay, type DateKey } from "@/lib/date";
import { cn } from "@/lib/utils";

type Point = { date: DateKey; total: number };

const RANGES = [
  { value: "7", label: "7d" },
  { value: "30", label: "30d" },
  { value: "90", label: "90d" },
] as const;

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Point }[] }) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded-md border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{formatDisplay(point.date, "long")}</p>
      <p className="text-muted-foreground">{point.total} applications</p>
    </div>
  );
}

export function ApplicationChart({
  data,
  dailyTarget,
  className,
}: {
  data: Point[];
  dailyTarget?: number;
  className?: string;
}) {
  const [range, setRange] = React.useState<"7" | "30" | "90">("30");
  const sliced = React.useMemo(() => data.slice(-Number(range)), [data, range]);
  const hasData = sliced.some((d) => d.total > 0);

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex justify-end">
        <Tabs value={range} onValueChange={(v) => setRange(v as "7" | "30" | "90")}>
          <TabsList>
            {RANGES.map((r) => (
              <TabsTrigger key={r.value} value={r.value}>
                {r.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
      {hasData ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sliced} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="applicationFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => formatDisplay(d, "dayMonth")}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                interval={sliced.length > 20 ? Math.floor(sliced.length / 8) : 0}
                minTickGap={20}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                axisLine={false}
                tickLine={false}
                width={32}
              />
              {dailyTarget && (
                <ReferenceLine
                  y={dailyTarget}
                  stroke="var(--color-warning)"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                />
              )}
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="var(--color-primary)"
                strokeWidth={2}
                fill="url(#applicationFill)"
                activeDot={{ r: 4 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
          No applications tracked in this range yet.
        </div>
      )}
    </div>
  );
}

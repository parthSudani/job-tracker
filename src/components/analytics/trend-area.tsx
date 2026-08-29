"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDisplay, type DateKey } from "@/lib/date";

type Point = { date: DateKey; total: number };

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

export function TrendArea({ data }: { data: Point[] }) {
  const hasData = data.some((d) => d.total > 0);
  if (!hasData) {
    return (
      <div className="flex h-56 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        No applications tracked in this range yet.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendAreaFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tickFormatter={(d: string) => formatDisplay(d, "dayMonth")}
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            axisLine={false}
            tickLine={false}
            interval={data.length > 20 ? Math.floor(data.length / 8) : 0}
            minTickGap={20}
          />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} axisLine={false} tickLine={false} width={32} />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }} />
          <Area type="monotone" dataKey="total" stroke="var(--color-chart-2)" strokeWidth={2} fill="url(#trendAreaFill)" activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

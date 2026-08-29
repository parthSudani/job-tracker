"use client";

import * as React from "react";
import { Award, CalendarDays, Flame, LineChart, TrendingDown, TrendingUp, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatCard } from "@/components/dashboard/stat-card";
import { TrendArea } from "@/components/analytics/trend-area";
import { BucketBarChart } from "@/components/analytics/bucket-bar-chart";
import { DistributionList } from "@/components/analytics/distribution-list";
import {
  buildMetrics,
  computeStreaks,
  rangeSeries,
  rangeTotal,
  topPlatformsInRange,
  distributionInRange,
  highLowDays,
  bucketByWeek,
  bucketByMonth,
  average,
  type LightRecord,
  type PlatformLite,
} from "@/lib/analytics";
import { addDaysToKey, addMonthsToKey, daysInRange, endOfMonthKey, formatDisplay, startOfMonthKey, todayKey, type DateKey } from "@/lib/date";
import { DATE_RANGE_PRESETS } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

function resolveRange(preset: string, today: DateKey, customFrom: string, customTo: string): [DateKey, DateKey] {
  switch (preset) {
    case "today":
      return [today, today];
    case "7d":
      return [addDaysToKey(today, -6), today];
    case "90d":
      return [addDaysToKey(today, -89), today];
    case "month":
      return [startOfMonthKey(today), today];
    case "lastMonth": {
      const lm = addMonthsToKey(today, -1);
      return [startOfMonthKey(lm), endOfMonthKey(lm)];
    }
    case "custom":
      return [customFrom && customFrom <= today ? customFrom : today, customTo && customTo <= today ? customTo : today];
    case "30d":
    default:
      return [addDaysToKey(today, -29), today];
  }
}

export function AnalyticsView({
  records,
  platforms,
  defaultRange = "30d",
}: {
  records: LightRecord[];
  platforms: PlatformLite[];
  defaultRange?: string;
}) {
  const today = React.useMemo(() => todayKey(), []);
  const [preset, setPreset] = React.useState(defaultRange);
  const [customFrom, setCustomFrom] = React.useState(addDaysToKey(today, -29));
  const [customTo, setCustomTo] = React.useState(today);

  const metrics = React.useMemo(() => buildMetrics(records, today), [records, today]);
  const streak = React.useMemo(() => computeStreaks(metrics), [metrics]);
  const [from, to] = React.useMemo(() => resolveRange(preset, today, customFrom, customTo), [preset, today, customFrom, customTo]);

  const total = rangeTotal(metrics, from, to);
  const dayCount = daysInRange(from, to).length;
  const dailyAvg = average(total, dayCount);
  const weeklyAvg = average(total * 7, dayCount);
  const monthlyAvg = average(total * 30, dayCount);
  const { highest, lowest } = highLowDays(metrics, from, to);
  const activePlatformsCount = platforms.filter((p) => p.active).length;
  const usedPlatformsCount = topPlatformsInRange(metrics, platforms, from, to, 999).length;
  const topInRange = topPlatformsInRange(metrics, platforms, from, to, 8);
  const series = rangeSeries(metrics, from, to);
  const weekBuckets = bucketByWeek(series);
  const monthBuckets = bucketByMonth(series);
  const priorityDist = distributionInRange(metrics, platforms, "priority", from, to);
  const categoryDist = distributionInRange(metrics, platforms, "category", from, to);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label>Date range</Label>
          <Select value={preset} onValueChange={setPreset}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATE_RANGE_PRESETS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {preset === "custom" && (
          <>
            <div className="space-y-1.5">
              <Label htmlFor="custom-from">From</Label>
              <Input id="custom-from" type="date" value={customFrom} max={today} onChange={(e) => setCustomFrom(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="custom-to">To</Label>
              <Input id="custom-to" type="date" value={customTo} max={today} onChange={(e) => setCustomTo(e.target.value)} />
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total (range)" value={total} icon={TrendingUp} />
        <StatCard label="Daily Average" value={dailyAvg} icon={CalendarDays} />
        <StatCard label="Weekly Average" value={weeklyAvg} icon={LineChart} />
        <StatCard label="Monthly Average" value={monthlyAvg} icon={LineChart} />
        <StatCard
          label="Highest Day"
          value={highest ? highest.total : 0}
          sublabel={highest ? formatDisplay(highest.date, "dayMonth") : "No data yet"}
          icon={TrendingUp}
        />
        <StatCard
          label="Lowest Active Day"
          value={lowest ? lowest.total : 0}
          sublabel={lowest ? formatDisplay(lowest.date, "dayMonth") : "No data yet"}
          icon={TrendingDown}
        />
        <StatCard label="Active Platforms" value={`${usedPlatformsCount}/${activePlatformsCount}`} icon={Users} />
        <StatCard
          label="Most-Used Platform"
          value={topInRange[0]?.platform.name ?? "—"}
          sublabel={topInRange[0] ? `${formatNumber(topInRange[0].total)} applications` : undefined}
          icon={Award}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-warning/15 text-warning">
              <Flame className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{streak.current} days</p>
              <p className="text-xs text-muted-foreground">Current streak</p>
            </div>
          </CardContent>
        </Card>
        <Card className="py-4">
          <CardContent className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Award className="size-4" />
            </div>
            <div>
              <p className="text-lg font-semibold tabular-nums">{streak.longest} days</p>
              <p className="text-xs text-muted-foreground">Longest streak</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Applications Per Day</CardTitle>
        </CardHeader>
        <CardContent>
          <TrendArea data={series} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weekly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BucketBarChart data={weekBuckets} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <BucketBarChart data={monthBuckets} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Applications Per Platform</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionList items={topInRange.map((t) => ({ key: t.platform.name, total: t.total }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionList items={priorityDist} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DistributionList items={categoryDist} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

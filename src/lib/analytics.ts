// Pure, DB-free aggregation over already-fetched records. Keeping this
// separate from the data-fetching service layer means every page (dashboard,
// platform directory, platform detail, analytics) computes totals the same
// way from one shared source of truth instead of re-deriving ad hoc numbers.
import {
  addDaysToKey,
  daysBetweenKeys,
  daysInRange,
  formatDisplay,
  startOfMonthKey,
  startOfWeekKey,
  type DateKey,
} from "@/lib/date";

export type LightRecord = { platformId: string; date: DateKey; applicationCount: number };

export type Metrics = {
  byDate: Map<DateKey, number>;
  byPlatform: Map<string, number>;
  byPlatformByDate: Map<string, Map<DateKey, number>>;
  overallTotal: number;
  todayTotal: number;
  weekTotal: number;
  monthTotal: number;
  weekStart: DateKey;
  monthStart: DateKey;
  today: DateKey;
};

export function buildMetrics(records: LightRecord[], today: DateKey): Metrics {
  const byDate = new Map<DateKey, number>();
  const byPlatform = new Map<string, number>();
  const byPlatformByDate = new Map<string, Map<DateKey, number>>();
  let overallTotal = 0;

  for (const r of records) {
    if (r.applicationCount <= 0) continue;
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.applicationCount);
    byPlatform.set(r.platformId, (byPlatform.get(r.platformId) ?? 0) + r.applicationCount);
    if (!byPlatformByDate.has(r.platformId)) byPlatformByDate.set(r.platformId, new Map());
    byPlatformByDate.get(r.platformId)!.set(r.date, r.applicationCount);
    overallTotal += r.applicationCount;
  }

  const weekStart = startOfWeekKey(today);
  const monthStart = startOfMonthKey(today);

  const sumRange = (from: DateKey, to: DateKey) => {
    let s = 0;
    for (const [d, v] of byDate) if (d >= from && d <= to) s += v;
    return s;
  };

  return {
    byDate,
    byPlatform,
    byPlatformByDate,
    overallTotal,
    todayTotal: byDate.get(today) ?? 0,
    weekTotal: sumRange(weekStart, today),
    monthTotal: sumRange(monthStart, today),
    weekStart,
    monthStart,
    today,
  };
}

export type PlatformStat = {
  today: number;
  week: number;
  month: number;
  total: number;
  lastActivity: DateKey | null;
};

export function platformStat(metrics: Metrics, platformId: string): PlatformStat {
  const byDate = metrics.byPlatformByDate.get(platformId) ?? new Map<DateKey, number>();
  let week = 0;
  let month = 0;
  let total = 0;
  let lastActivity: DateKey | null = null;
  for (const [d, v] of byDate) {
    total += v;
    if (d >= metrics.weekStart && d <= metrics.today) week += v;
    if (d >= metrics.monthStart && d <= metrics.today) month += v;
    if (v > 0 && (!lastActivity || d > lastActivity)) lastActivity = d;
  }
  return { today: byDate.get(metrics.today) ?? 0, week, month, total, lastActivity };
}

export function trendSeries(metrics: Metrics, days: number): { date: DateKey; total: number }[] {
  const from = addDaysToKey(metrics.today, -(days - 1));
  return daysInRange(from, metrics.today).map((d) => ({ date: d, total: metrics.byDate.get(d) ?? 0 }));
}

export function platformTrendSeries(metrics: Metrics, platformId: string, days: number): { date: DateKey; total: number }[] {
  const byDate = metrics.byPlatformByDate.get(platformId) ?? new Map<DateKey, number>();
  const from = addDaysToKey(metrics.today, -(days - 1));
  return daysInRange(from, metrics.today).map((d) => ({ date: d, total: byDate.get(d) ?? 0 }));
}

export function rangeSeries(metrics: Metrics, fromKey: DateKey, toKey: DateKey): { date: DateKey; total: number }[] {
  return daysInRange(fromKey, toKey).map((d) => ({ date: d, total: metrics.byDate.get(d) ?? 0 }));
}

export function rangeTotal(metrics: Metrics, fromKey: DateKey, toKey: DateKey): number {
  let s = 0;
  for (const [d, v] of metrics.byDate) if (d >= fromKey && d <= toKey) s += v;
  return s;
}

export type Streak = { current: number; longest: number };

export function computeStreaks(metrics: Metrics): Streak {
  const activeDates = new Set<DateKey>();
  for (const [d, v] of metrics.byDate) if (v > 0) activeDates.add(d);

  let current = 0;
  let cursor = activeDates.has(metrics.today) ? metrics.today : addDaysToKey(metrics.today, -1);
  while (activeDates.has(cursor)) {
    current++;
    cursor = addDaysToKey(cursor, -1);
  }

  const sorted = Array.from(activeDates).sort();
  let longest = 0;
  let run = 0;
  let prev: DateKey | null = null;
  for (const d of sorted) {
    run = prev && daysBetweenKeys(prev, d) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }
  return { current, longest };
}

export type PlatformLite = {
  id: string;
  name: string;
  priority: string;
  active: boolean;
  category: string;
};

export function topPlatformsByTotal<T extends PlatformLite>(
  metrics: Metrics,
  platforms: T[],
  key: "today" | "week" | "month" | "total" = "total",
  limit = 5
) {
  return platforms
    .map((p) => ({ platform: p, stat: platformStat(metrics, p.id) }))
    .filter((x) => x.stat[key] > 0)
    .sort((a, b) => b.stat[key] - a.stat[key])
    .slice(0, limit);
}

export function distributionBy(
  metrics: Metrics,
  platforms: PlatformLite[],
  dimension: "category" | "priority"
): { key: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const p of platforms) {
    const stat = platformStat(metrics, p.id);
    if (stat.total <= 0) continue;
    const key = p[dimension];
    totals.set(key, (totals.get(key) ?? 0) + stat.total);
  }
  return Array.from(totals.entries())
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total);
}

export function computeInsights(opts: {
  metrics: Metrics;
  platforms: PlatformLite[];
  streak: Streak;
  monthlyTarget: number;
}): string[] {
  const { metrics, platforms, streak, monthlyTarget } = opts;
  const insights: string[] = [];

  const top = topPlatformsByTotal(metrics, platforms, "month", 1)[0];
  if (top) {
    insights.push(
      `${top.platform.name} is your most-used platform this month with ${top.stat.month} application${
        top.stat.month === 1 ? "" : "s"
      }.`
    );
  }

  if (streak.current >= 2) {
    insights.push(`You've applied on ${streak.current} consecutive days — keep the streak alive.`);
  }

  const prevWeekStart = addDaysToKey(metrics.weekStart, -7);
  const prevWeekEnd = addDaysToKey(metrics.weekStart, -1);
  const prevWeekTotal = rangeTotal(metrics, prevWeekStart, prevWeekEnd);
  if (prevWeekTotal > 0) {
    const pctChange = Math.round(((metrics.weekTotal - prevWeekTotal) / prevWeekTotal) * 100);
    if (Math.abs(pctChange) >= 5) {
      insights.push(
        `Your applications are ${pctChange > 0 ? "up" : "down"} ${Math.abs(pctChange)}% this week vs. last week.`
      );
    }
  }

  for (const p of platforms) {
    if (!p.active || (p.priority !== "Critical" && p.priority !== "High")) continue;
    const stat = platformStat(metrics, p.id);
    if (!stat.lastActivity) continue;
    const gap = daysBetweenKeys(stat.lastActivity, metrics.today);
    if (gap >= 5) {
      insights.push(`You haven't tracked any applications on ${p.name} in ${gap} days.`);
      break;
    }
  }

  if (monthlyTarget > 0) {
    insights.push(`Your monthly target is ${Math.round((metrics.monthTotal / monthlyTarget) * 100)}% complete.`);
  }

  return insights.slice(0, 5);
}

export function platformRangeTotal(metrics: Metrics, platformId: string, fromKey: DateKey, toKey: DateKey): number {
  const byDate = metrics.byPlatformByDate.get(platformId);
  if (!byDate) return 0;
  let s = 0;
  for (const [d, v] of byDate) if (d >= fromKey && d <= toKey) s += v;
  return s;
}

export function topPlatformsInRange<T extends PlatformLite>(
  metrics: Metrics,
  platforms: T[],
  fromKey: DateKey,
  toKey: DateKey,
  limit = 8
) {
  return platforms
    .map((p) => ({ platform: p, total: platformRangeTotal(metrics, p.id, fromKey, toKey) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function distributionInRange(
  metrics: Metrics,
  platforms: PlatformLite[],
  dimension: "category" | "priority",
  fromKey: DateKey,
  toKey: DateKey
): { key: string; total: number }[] {
  const totals = new Map<string, number>();
  for (const p of platforms) {
    const total = platformRangeTotal(metrics, p.id, fromKey, toKey);
    if (total <= 0) continue;
    const key = p[dimension];
    totals.set(key, (totals.get(key) ?? 0) + total);
  }
  return Array.from(totals.entries())
    .map(([key, total]) => ({ key, total }))
    .sort((a, b) => b.total - a.total);
}

export function highLowDays(metrics: Metrics, fromKey: DateKey, toKey: DateKey) {
  let highest: { date: DateKey; total: number } | null = null;
  let lowestActive: { date: DateKey; total: number } | null = null;
  for (const [d, v] of metrics.byDate) {
    if (d < fromKey || d > toKey) continue;
    if (!highest || v > highest.total) highest = { date: d, total: v };
    if (v > 0 && (!lowestActive || v < lowestActive.total)) lowestActive = { date: d, total: v };
  }
  return { highest, lowest: lowestActive };
}

export function bucketByWeek(series: { date: DateKey; total: number }[]): { label: string; total: number }[] {
  const map = new Map<DateKey, number>();
  for (const point of series) {
    const weekStart = startOfWeekKey(point.date);
    map.set(weekStart, (map.get(weekStart) ?? 0) + point.total);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([weekStart, total]) => ({ label: formatDisplay(weekStart, "dayMonth"), total }));
}

export function bucketByMonth(series: { date: DateKey; total: number }[]): { label: string; total: number }[] {
  const map = new Map<string, number>();
  for (const point of series) {
    const monthKey = point.date.slice(0, 7);
    map.set(monthKey, (map.get(monthKey) ?? 0) + point.total);
  }
  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([monthKey, total]) => ({ label: formatDisplay(`${monthKey}-01`, "monthYear"), total }));
}

export function average(total: number, dayCount: number): number {
  if (dayCount <= 0) return 0;
  return Math.round((total / dayCount) * 10) / 10;
}

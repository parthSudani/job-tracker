import { listPlatforms } from "./platforms";
import { getAllRecordsLight } from "./records";
import { getSettings } from "./settings";
import { buildMetrics, computeInsights, computeStreaks } from "@/lib/analytics";
import { todayKey } from "@/lib/date";

/**
 * Single fetch-and-derive pass shared by every data-driven page (dashboard,
 * platform directory/detail, history, calendar, analytics, goals) so totals,
 * streaks, and insights are always computed the same way from the same data.
 */
export async function getAppSnapshot(todayOverride?: string) {
  const [platforms, records, settings] = await Promise.all([listPlatforms(), getAllRecordsLight(), getSettings()]);
  const today = todayOverride ?? todayKey();
  const metrics = buildMetrics(records, today);
  const streak = computeStreaks(metrics);
  const insights = computeInsights({ metrics, platforms, streak, monthlyTarget: settings.monthlyTarget });
  return { platforms, records, settings, metrics, streak, insights, today };
}

export type AppSnapshot = Awaited<ReturnType<typeof getAppSnapshot>>;

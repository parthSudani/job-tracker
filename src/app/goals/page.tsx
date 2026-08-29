import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { getAppSnapshot } from "@/lib/services/dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { WeeklyOverview } from "@/components/goals/weekly-overview";
import { addDaysToKey, daysInRange, formatDisplay } from "@/lib/date";
import { formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const { metrics, settings } = await getAppSnapshot();

  const weekEnd = addDaysToKey(metrics.weekStart, 6);
  const weekDays = daysInRange(metrics.weekStart, weekEnd).map((date) => ({
    date,
    total: metrics.byDate.get(date) ?? 0,
  }));
  const weeklyTarget = settings.dailyTarget * 7;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Goals</h1>
          <p className="mt-1 text-sm text-muted-foreground">Daily, weekly, and monthly targets for your job search.</p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/settings">
            <SettingsIcon />
            Edit Targets
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalProgress completed={metrics.todayTotal} target={settings.dailyTarget} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Week of {formatDisplay(metrics.weekStart, "dayMonth")} – {formatDisplay(weekEnd, "dayMonth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GoalProgress completed={metrics.weekTotal} target={weeklyTarget} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{formatDisplay(metrics.monthStart, "monthYear")}</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalProgress completed={metrics.monthTotal} target={settings.monthlyTarget} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">This Week&apos;s Daily Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <WeeklyOverview days={weekDays} />
          <p className="mt-4 text-xs text-muted-foreground">
            {formatNumber(metrics.weekTotal)} of {formatNumber(weeklyTarget)} weekly target applications so far.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

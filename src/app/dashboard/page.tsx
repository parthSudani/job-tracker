import { Target, TrendingUp, CalendarRange, CalendarDays, Layers } from "lucide-react";
import { getAppSnapshot } from "@/lib/services/dashboard";
import { platformStat, topPlatformsByTotal, trendSeries } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { ApplicationChart } from "@/components/dashboard/application-chart";
import { PlatformPerformance } from "@/components/dashboard/platform-performance";
import { TodayActivity } from "@/components/dashboard/today-activity";
import { StreakCard } from "@/components/dashboard/streak-card";
import { InsightsCard } from "@/components/dashboard/insights-card";
import { GreetingHeader } from "@/components/dashboard/greeting-header";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { platforms, metrics, settings, streak, insights } = await getAppSnapshot();

  const trend = trendSeries(metrics, 90);
  const topByTotal = topPlatformsByTotal(metrics, platforms, "total", 5);
  const todayItems = platforms
    .map((p) => ({ platformName: p.name, platformSlug: p.slug, count: platformStat(metrics, p.id).today }))
    .filter((i) => i.count > 0);

  return (
    <div className="space-y-6">
      <GreetingHeader dateFormat={settings.dateFormat} />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Today" value={metrics.todayTotal} icon={CalendarDays} sublabel={`Target ${settings.dailyTarget}`} />
        <StatCard label="This Week" value={metrics.weekTotal} icon={CalendarRange} />
        <StatCard label="This Month" value={metrics.monthTotal} icon={Layers} sublabel={`Goal ${settings.monthlyTarget}`} />
        <StatCard label="Overall" value={metrics.overallTotal} icon={TrendingUp} />
        <StatCard label="Daily Target" value={settings.dailyTarget} icon={Target} suffix="/ day" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <GoalProgress completed={metrics.todayTotal} target={settings.dailyTarget} />
            <StreakCard current={streak.current} longest={streak.longest} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Application Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ApplicationChart data={trend} dailyTarget={settings.dailyTarget} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Platform Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <PlatformPerformance items={topByTotal} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today&apos;s Platform Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <TodayActivity items={todayItems} />
          </CardContent>
        </Card>

        <InsightsCard insights={insights} />
      </div>
    </div>
  );
}

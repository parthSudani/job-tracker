import { getAllRecordsWithPlatform } from "@/lib/services/records";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarHeatmap } from "@/components/calendar/calendar-heatmap";
import type { DateKey } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const records = await getAllRecordsWithPlatform();

  const breakdown: Record<DateKey, { total: number; entries: { platformName: string; count: number }[] }> = {};
  for (const r of records) {
    if (!breakdown[r.date]) breakdown[r.date] = { total: 0, entries: [] };
    breakdown[r.date].total += r.applicationCount;
    breakdown[r.date].entries.push({ platformName: r.platform.name, count: r.applicationCount });
  }
  for (const day of Object.values(breakdown)) {
    day.entries.sort((a, b) => b.count - a.count);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Spot consistency at a glance — darker days mean more applications tracked.
        </p>
      </div>
      <Card>
        <CardContent>
          <CalendarHeatmap breakdown={breakdown} />
        </CardContent>
      </Card>
    </div>
  );
}

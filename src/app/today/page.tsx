import { listPlatforms } from "@/lib/services/platforms";
import { getRecordsForDate } from "@/lib/services/records";
import { getSettings } from "@/lib/services/settings";
import { getDayNote } from "@/lib/services/day-notes";
import { todayKey, type DateKey } from "@/lib/date";
import { DateNav } from "@/components/today/date-nav";
import { DailyTracker } from "@/components/today/daily-tracker";
import { TodaysPlan } from "@/components/today/todays-plan";
import { DayNote } from "@/components/today/day-note";

export const dynamic = "force-dynamic";

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ date?: string }> }) {
  const params = await searchParams;
  const date: DateKey = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : todayKey();

  const [platforms, records, settings, dayNote] = await Promise.all([
    listPlatforms({ activeOnly: true }),
    getRecordsForDate(date),
    getSettings(),
    getDayNote(date),
  ]);

  const initialCounts: Record<string, number> = {};
  for (const r of records) initialCounts[r.platformId] = r.applicationCount;

  const trackerPlatforms = platforms.map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    officialUrl: p.officialUrl,
    priority: p.priority,
    category: p.category,
  }));

  const planPlatforms = platforms.map((p) => ({
    id: p.id,
    name: p.name,
    priority: p.priority,
    todayCount: initialCounts[p.id] ?? 0,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Today&apos;s Tracker</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Select a platform, enter your count, save — takes seconds.
        </p>
      </div>

      <DateNav date={date} dateFormat={settings.dateFormat} />

      <TodaysPlan platforms={planPlatforms} dailyTarget={settings.dailyTarget} />

      <DailyTracker date={date} platforms={trackerPlatforms} initialCounts={initialCounts} dailyTarget={settings.dailyTarget} />

      <DayNote date={date} initialNote={dayNote?.note ?? ""} />
    </div>
  );
}

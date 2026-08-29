import { getAllRecordsLight } from "@/lib/services/records";
import { listPlatforms } from "@/lib/services/platforms";
import { getSettings } from "@/lib/services/settings";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const [records, platforms, settings] = await Promise.all([getAllRecordsLight(), listPlatforms(), getSettings()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">Deep dive into your job search performance over time.</p>
      </div>
      <AnalyticsView
        records={records}
        platforms={platforms.map((p) => ({
          id: p.id,
          name: p.name,
          priority: p.priority,
          active: p.active,
          category: p.category,
        }))}
        defaultRange={settings.defaultDashboardRange}
      />
    </div>
  );
}

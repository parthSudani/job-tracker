import { getAllRecordsWithPlatform } from "@/lib/services/records";
import { getAllDayNotes } from "@/lib/services/day-notes";
import { listPlatforms } from "@/lib/services/platforms";
import { HistoryView, type HistoryRecord } from "@/components/history/history-view";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const [records, dayNotesMap, platforms] = await Promise.all([
    getAllRecordsWithPlatform(),
    getAllDayNotes(),
    listPlatforms(),
  ]);

  const historyRecords: HistoryRecord[] = records.map((r) => ({
    id: r.id,
    date: r.date,
    platformId: r.platformId,
    platformName: r.platform.name,
    applicationCount: r.applicationCount,
    notes: r.notes,
  }));

  const dayNotes = Object.fromEntries(dayNotesMap);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Every day you&apos;ve tracked, grouped and searchable.</p>
      </div>
      <HistoryView
        records={historyRecords}
        dayNotes={dayNotes}
        platformOptions={platforms.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  );
}

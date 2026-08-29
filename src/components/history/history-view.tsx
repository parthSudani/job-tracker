"use client";

import * as React from "react";
import { History as HistoryIcon, Pencil } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SearchInput } from "@/components/shared/search-input";
import { EmptyState } from "@/components/shared/empty-state";
import { RecordEditDialog, type EditableRecord } from "@/components/history/record-edit-dialog";
import { formatDisplay, isToday, type DateKey } from "@/lib/date";
import { formatNumber } from "@/lib/utils";

export type HistoryRecord = {
  id: string;
  date: DateKey;
  platformId: string;
  platformName: string;
  applicationCount: number;
  notes: string | null;
};

type DayGroup = { date: DateKey; total: number; entries: HistoryRecord[]; note: string | null };

const PAGE_SIZE = 12;

export function HistoryView({
  records,
  dayNotes,
  platformOptions,
}: {
  records: HistoryRecord[];
  dayNotes: Record<string, string>;
  platformOptions: { id: string; name: string }[];
}) {
  const [search, setSearch] = React.useState("");
  const [platformId, setPlatformId] = React.useState("all");
  const [visibleCount, setVisibleCount] = React.useState(PAGE_SIZE);
  const [editing, setEditing] = React.useState<EditableRecord | null>(null);

  const groups = React.useMemo<DayGroup[]>(() => {
    const map = new Map<DateKey, HistoryRecord[]>();
    for (const r of records) {
      if (!map.has(r.date)) map.set(r.date, []);
      map.get(r.date)!.push(r);
    }
    return Array.from(map.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, entries]) => ({
        date,
        entries: entries.sort((a, b) => b.applicationCount - a.applicationCount),
        total: entries.reduce((s, e) => s + e.applicationCount, 0),
        note: dayNotes[date] ?? null,
      }));
  }, [records, dayNotes]);

  const filtered = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups
      .map((g) => {
        let entries = g.entries;
        if (platformId !== "all") entries = entries.filter((e) => e.platformId === platformId);
        if (entries.length === 0 && platformId !== "all") return null;

        if (q) {
          const dateMatches = formatDisplay(g.date, "long").toLowerCase().includes(q);
          if (!dateMatches) {
            entries = entries.filter((e) => e.platformName.toLowerCase().includes(q));
            if (entries.length === 0) return null;
          }
        }
        return { ...g, entries, total: entries.reduce((s, e) => s + e.applicationCount, 0) };
      })
      .filter((g): g is DayGroup => g !== null);
  }, [groups, search, platformId]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search by platform or date..." className="sm:max-w-xs sm:flex-1" />
        <Select value={platformId} onValueChange={setPlatformId}>
          <SelectTrigger size="sm" className="w-full sm:w-48">
            <SelectValue placeholder="Platform" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {platformOptions.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No history found" description="Try a different search or platform filter." />
      ) : (
        <div className="space-y-4">
          {visible.map((group) => (
            <Card key={group.date}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{formatDisplay(group.date, "long")}</p>
                    {isToday(group.date) && (
                      <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                        TODAY
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold tabular-nums text-primary">{formatNumber(group.total)} total</span>
                </div>
                {group.note && <p className="rounded-md bg-muted/60 px-3 py-2 text-xs text-muted-foreground">{group.note}</p>}
                <ul className="divide-y divide-border/70">
                  {group.entries.map((e) => (
                    <li key={e.id} className="flex items-center justify-between gap-2 py-1.5 text-sm">
                      <span className="truncate">{e.platformName}</span>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="tabular-nums font-medium">{formatNumber(e.applicationCount)}</span>
                        <Button variant="ghost" size="icon-sm" aria-label="Edit" onClick={() => setEditing(e)}>
                          <Pencil />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
          {visibleCount < filtered.length && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}>
                Load more
              </Button>
            </div>
          )}
        </div>
      )}

      <RecordEditDialog key={editing?.id ?? "closed"} record={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  );
}

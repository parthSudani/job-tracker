"use client";

import * as React from "react";
import { Pencil, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { RecordEditDialog, type EditableRecord } from "@/components/history/record-edit-dialog";
import { formatDisplay, type DateKey } from "@/lib/date";
import { formatNumber } from "@/lib/utils";

type Row = { id: string; date: DateKey; applicationCount: number; notes: string | null };

export function PlatformHistoryList({
  platformId,
  platformName,
  records,
}: {
  platformId: string;
  platformName: string;
  records: Row[];
}) {
  const [editing, setEditing] = React.useState<EditableRecord | null>(null);

  if (records.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="No application history yet"
        description={`Log applications for ${platformName} to see activity here.`}
      />
    );
  }

  return (
    <>
      <ul className="divide-y divide-border/70">
        {records.map((r) => (
          <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm font-medium">{formatDisplay(r.date, "long")}</p>
              {r.notes && <p className="truncate text-xs text-muted-foreground">{r.notes}</p>}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm font-semibold tabular-nums">{formatNumber(r.applicationCount)}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Edit"
                onClick={() =>
                  setEditing({
                    id: r.id,
                    platformId,
                    platformName,
                    date: r.date,
                    applicationCount: r.applicationCount,
                    notes: r.notes,
                  })
                }
              >
                <Pencil />
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <RecordEditDialog record={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ExternalLink, Loader2, RotateCcw, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ApplicationInput } from "@/components/today/application-input";
import { GoalProgress } from "@/components/dashboard/goal-progress";
import { PriorityDot } from "@/components/platforms/priority-badge";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { bulkSaveDayAction } from "@/actions/records";
import { PRIORITIES } from "@/lib/constants";
import { cn, formatNumber } from "@/lib/utils";
import type { DateKey } from "@/lib/date";

export type TrackerPlatform = {
  id: string;
  name: string;
  slug: string;
  officialUrl: string | null;
  priority: string;
  category: string;
};

export function DailyTracker({
  date,
  platforms,
  initialCounts,
  dailyTarget,
}: {
  date: DateKey;
  platforms: TrackerPlatform[];
  initialCounts: Record<string, number>;
  dailyTarget: number;
}) {
  const router = useRouter();
  const [baseline, setBaseline] = React.useState(initialCounts);
  const [counts, setCounts] = React.useState(initialCounts);
  const [pending, startTransition] = React.useTransition();
  const [resetOpen, setResetOpen] = React.useState(false);

  React.useEffect(() => {
    setBaseline(initialCounts);
    setCounts(initialCounts);
  }, [initialCounts]);

  const total = React.useMemo(() => Object.values(counts).reduce((a, b) => a + b, 0), [counts]);
  const dirty = React.useMemo(
    () => platforms.some((p) => (counts[p.id] ?? 0) !== (baseline[p.id] ?? 0)),
    [counts, baseline, platforms]
  );

  function setCount(platformId: string, value: number) {
    setCounts((prev) => ({ ...prev, [platformId]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const entries = platforms.map((p) => ({ platformId: p.id, applicationCount: counts[p.id] ?? 0 }));
      const res = await bulkSaveDayAction({ date, entries });
      if (res.ok) {
        setBaseline(counts);
        toast.success(`Saved ${formatNumber(total)} application${total === 1 ? "" : "s"} for ${date}.`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not save — please try again.");
      }
    });
  }

  const grouped = React.useMemo(() => {
    const map = new Map<string, TrackerPlatform[]>();
    for (const priority of PRIORITIES) map.set(priority, []);
    for (const p of platforms) {
      if (!map.has(p.priority)) map.set(p.priority, []);
      map.get(p.priority)!.push(p);
    }
    return Array.from(map.entries()).filter(([, list]) => list.length > 0);
  }, [platforms]);

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <GoalProgress completed={total} target={dailyTarget} className="max-w-sm flex-1" />
          <div className="flex gap-2 sm:flex-col sm:items-end">
            <Button onClick={handleSave} disabled={!dirty || pending} className="min-w-36">
              {pending ? <Loader2 className="animate-spin" /> : <Save />}
              Save Today&apos;s Progress
            </Button>
            <ConfirmDialog
              open={resetOpen}
              onOpenChange={setResetOpen}
              trigger={
                <Button variant="ghost" size="sm" disabled={!dirty} className="text-muted-foreground">
                  <RotateCcw />
                  Reset
                </Button>
              }
              title="Discard unsaved changes?"
              description="This resets every count on this page back to what was last saved."
              confirmLabel="Discard changes"
              destructive
              onConfirm={() => setCounts(baseline)}
            />
          </div>
        </CardContent>
      </Card>

      {grouped.map(([priority, list]) => (
        <Card key={priority}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <PriorityDot priority={priority} />
              {priority} priority
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border/70">
            {list.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 first:pt-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Link href={`/platforms/${p.slug}`} className="truncate text-sm font-medium hover:text-primary">
                    {p.name}
                  </Link>
                  {p.officialUrl && (
                    <a
                      href={p.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-primary"
                      aria-label={`Open ${p.name} (opens in a new tab)`}
                    >
                      <ExternalLink className="size-3.5" />
                    </a>
                  )}
                </div>
                <ApplicationInput value={counts[p.id] ?? 0} onChange={(v) => setCount(p.id, v)} />
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      <div
        className={cn(
          "sticky bottom-20 z-20 flex items-center justify-between rounded-xl border border-border bg-popover/95 px-4 py-3 shadow-lg backdrop-blur md:bottom-4",
          !dirty && "hidden"
        )}
      >
        <p className="text-sm">
          <span className="font-semibold tabular-nums">{formatNumber(total)}</span> total — unsaved changes
        </p>
        <Button size="sm" onClick={handleSave} disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save
        </Button>
      </div>
    </div>
  );
}

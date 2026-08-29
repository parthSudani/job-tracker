"use client";

import Link from "next/link";
import { ExternalLink, Plus, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/platforms/priority-badge";
import { todayKey, daysBetweenKeys, type DateKey } from "@/lib/date";
import { formatNumber, cn } from "@/lib/utils";
import { PRIORITY_META, type Priority } from "@/lib/constants";

export type PlatformCardData = {
  id: string;
  name: string;
  slug: string;
  officialUrl: string | null;
  category: string;
  priority: string;
  recommendedFrequency: string;
  active: boolean;
  today: number;
  week: number;
  month: number;
  total: number;
  lastActivity: DateKey | null;
};

export function PlatformCard({ platform, onQuickAdd }: { platform: PlatformCardData; onQuickAdd: () => void }) {
  const meta = PRIORITY_META[platform.priority as Priority] ?? PRIORITY_META.Medium;
  const isCritical = platform.priority === "Critical";
  const gap = platform.lastActivity ? daysBetweenKeys(platform.lastActivity, todayKey()) : null;

  return (
    <Card className={cn("relative py-4 transition-shadow hover:shadow-md", isCritical && meta.ring, !platform.active && "opacity-60")}>
      <div className="flex items-start justify-between px-5">
        <div className="min-w-0">
          <Link href={`/platforms/${platform.slug}`} className="block truncate font-semibold hover:text-primary">
            {platform.name}
          </Link>
          <p className="truncate text-xs text-muted-foreground">{platform.category}</p>
        </div>
        <PriorityBadge priority={platform.priority} />
      </div>

      <div className="grid grid-cols-3 gap-2 px-5 text-center">
        <div>
          <p className="text-lg font-semibold tabular-nums">{formatNumber(platform.today)}</p>
          <p className="text-[11px] text-muted-foreground">Today</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">{formatNumber(platform.week)}</p>
          <p className="text-[11px] text-muted-foreground">Week</p>
        </div>
        <div>
          <p className="text-lg font-semibold tabular-nums">{formatNumber(platform.month)}</p>
          <p className="text-[11px] text-muted-foreground">Month</p>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 text-xs text-muted-foreground">
        <span>{formatNumber(platform.total)} total</span>
        <span className="flex items-center gap-1">
          <Clock className="size-3" />
          {gap === null ? "No activity yet" : gap === 0 ? "Active today" : `${gap}d ago`}
        </span>
      </div>

      <div className="flex gap-2 px-5">
        <Button size="sm" variant="outline" className="flex-1" onClick={onQuickAdd}>
          <Plus />
          Add
        </Button>
        {platform.officialUrl ? (
          <Button size="sm" variant="secondary" className="flex-1" asChild>
            <a href={platform.officialUrl} target="_blank" rel="noopener noreferrer">
              Open
              <ExternalLink />
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="secondary" className="flex-1" asChild>
            <Link href={`/platforms/${platform.slug}`}>Manage</Link>
          </Button>
        )}
      </div>
    </Card>
  );
}

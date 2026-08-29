import Link from "next/link";
import { PriorityDot } from "@/components/platforms/priority-badge";
import { formatNumber } from "@/lib/utils";
import { EmptyState } from "@/components/shared/empty-state";
import { TrendingUp } from "lucide-react";

export function PlatformPerformance({
  items,
}: {
  items: { platform: { id: string; name: string; slug: string; priority: string }; stat: { total: number } }[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={TrendingUp}
        title="No platform activity yet"
        description="Once you log applications, your top-performing platforms will show up here."
      />
    );
  }

  const max = Math.max(...items.map((i) => i.stat.total), 1);

  return (
    <div className="space-y-3">
      {items.map(({ platform, stat }) => (
        <Link
          key={platform.id}
          href={`/platforms/${platform.slug}`}
          className="block space-y-1.5 rounded-lg px-1 py-1 hover:bg-accent/50 transition-colors"
        >
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium">
              <PriorityDot priority={platform.priority} />
              {platform.name}
            </span>
            <span className="tabular-nums text-muted-foreground">{formatNumber(stat.total)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary transition-all"
              style={{ width: `${Math.max(4, (stat.total / max) * 100)}%` }}
            />
          </div>
        </Link>
      ))}
    </div>
  );
}

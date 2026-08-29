import Link from "next/link";
import { Inbox } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { formatNumber } from "@/lib/utils";

export function TodayActivity({
  items,
}: {
  items: { platformName: string; platformSlug: string; count: number }[];
}) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No applications tracked today."
        description="Start tracking your job hunt for today."
        action={
          <Button asChild size="sm">
            <Link href="/today">Add Applications</Link>
          </Button>
        }
      />
    );
  }

  const sorted = [...items].sort((a, b) => b.count - a.count);

  return (
    <ul className="divide-y divide-border/70">
      {sorted.map((item) => (
        <li key={item.platformSlug}>
          <Link
            href={`/platforms/${item.platformSlug}`}
            className="flex items-center justify-between py-2.5 text-sm hover:text-primary transition-colors"
          >
            <span className="font-medium">{item.platformName}</span>
            <span className="tabular-nums text-muted-foreground">{formatNumber(item.count)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

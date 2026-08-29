import Link from "next/link";
import { Plus, CalendarCheck2, BarChart3, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatWithPattern, todayKey } from "@/lib/date";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function GreetingHeader({ dateFormat = "dd MMM yyyy" }: { dateFormat?: string }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{formatWithPattern(todayKey(), dateFormat)}</p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{getGreeting()} 👋</h1>
        <p className="mt-1 text-sm text-muted-foreground">Here&apos;s how your job hunt is going.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/today">
            <Plus />
            Add Applications
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/today">
            <CalendarCheck2 />
            Today&apos;s Tracker
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/analytics">
            <BarChart3 />
            Analytics
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/platforms">
            <LayoutGrid />
            Platforms
          </Link>
        </Button>
      </div>
    </div>
  );
}

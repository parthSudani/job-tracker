import { notFound } from "next/navigation";
import { ExternalLink, CalendarDays, CalendarRange, Layers, TrendingUp } from "lucide-react";
import { getPlatformBySlug } from "@/lib/services/platforms";
import { getRecordsForPlatform } from "@/lib/services/records";
import { getAppSnapshot } from "@/lib/services/dashboard";
import { platformStat, platformTrendSeries } from "@/lib/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PriorityBadge } from "@/components/platforms/priority-badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { ApplicationChart } from "@/components/dashboard/application-chart";
import { PlatformDetailMenu } from "@/components/platforms/platform-detail-menu";
import { PlatformAddButton } from "@/components/platforms/platform-add-button";
import { PlatformHistoryList } from "@/components/platforms/platform-history-list";
import { utcDateToKey } from "@/lib/date";

export const dynamic = "force-dynamic";

export default async function PlatformDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const platform = await getPlatformBySlug(slug);
  if (!platform) notFound();

  const [{ metrics }, records] = await Promise.all([getAppSnapshot(), getRecordsForPlatform(platform.id)]);

  const stat = platformStat(metrics, platform.id);
  const trend = platformTrendSeries(metrics, platform.id, 90);
  const tags = platform.recommendedFor ? platform.recommendedFor.split(",").map((t) => t.trim()).filter(Boolean) : [];
  const rows = records.map((r) => ({ id: r.id, date: utcDateToKey(r.date), applicationCount: r.applicationCount, notes: r.notes }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{platform.name}</h1>
            <PriorityBadge priority={platform.priority} />
            {!platform.active && (
              <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Inactive</span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {platform.category} · {platform.description}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PlatformAddButton platform={platform} todayCount={stat.today} />
          {platform.officialUrl && (
            <Button variant="outline" asChild>
              <a href={platform.officialUrl} target="_blank" rel="noopener noreferrer">
                Open Platform
                <ExternalLink />
              </a>
            </Button>
          )}
          <PlatformDetailMenu platform={platform} />
        </div>
      </div>

      {(platform.whyUseIt || tags.length > 0) && (
        <Card className="bg-accent/40 border-accent">
          <CardContent className="space-y-2">
            {platform.whyUseIt && <p className="text-sm">{platform.whyUseIt}</p>}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Today" value={stat.today} icon={CalendarDays} />
        <StatCard label="This Week" value={stat.week} icon={CalendarRange} />
        <StatCard label="This Month" value={stat.month} icon={Layers} />
        <StatCard label="Overall" value={stat.total} icon={TrendingUp} sublabel={`Frequency: ${platform.recommendedFrequency}`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Application History</CardTitle>
        </CardHeader>
        <CardContent>
          <ApplicationChart data={trend} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <PlatformHistoryList platformId={platform.id} platformName={platform.name} records={rows.slice(0, 20)} />
        </CardContent>
      </Card>
    </div>
  );
}

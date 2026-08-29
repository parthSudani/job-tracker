import { getAppSnapshot } from "@/lib/services/dashboard";
import { platformStat } from "@/lib/analytics";
import { PlatformDirectory } from "@/components/platforms/platform-directory";
import type { PlatformCardData } from "@/components/platforms/platform-card";

export const dynamic = "force-dynamic";

export default async function PlatformsPage() {
  const { platforms, metrics } = await getAppSnapshot();

  const cards: PlatformCardData[] = platforms.map((p) => {
    const stat = platformStat(metrics, p.id);
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      officialUrl: p.officialUrl,
      category: p.category,
      priority: p.priority,
      recommendedFrequency: p.recommendedFrequency,
      active: p.active,
      ...stat,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platforms</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {cards.length} platforms tracked across every category — from LinkedIn to niche remote boards.
        </p>
      </div>
      <PlatformDirectory platforms={cards} />
    </div>
  );
}

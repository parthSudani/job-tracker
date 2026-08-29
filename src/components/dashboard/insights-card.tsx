import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function InsightsCard({ insights }: { insights: string[] }) {
  if (insights.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="size-4 text-primary" />
          Job Hunt Insights
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2.5">
          {insights.map((insight, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="mt-1.5 size-1 shrink-0 rounded-full bg-primary" />
              <span className="text-foreground/90">{insight}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

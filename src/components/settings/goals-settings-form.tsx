"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateSettingsAction } from "@/actions/settings";
import { clampInt } from "@/lib/utils";

export function GoalsSettingsForm({ dailyTarget, monthlyTarget }: { dailyTarget: number; monthlyTarget: number }) {
  const router = useRouter();
  const [daily, setDaily] = React.useState(dailyTarget);
  const [monthly, setMonthly] = React.useState(monthlyTarget);
  const [pending, startTransition] = React.useTransition();

  const dirty = daily !== dailyTarget || monthly !== monthlyTarget;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateSettingsAction({ dailyTarget: daily, monthlyTarget: monthly });
      if (res.ok) {
        toast.success("Targets updated.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not update targets.");
      }
    });
  }

  return (
    <form onSubmit={handleSave} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="daily-target">Daily application target</Label>
          <Input
            id="daily-target"
            type="number"
            min={1}
            max={1000}
            value={daily}
            onChange={(e) => setDaily(clampInt(e.target.valueAsNumber, 1, 1000))}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="monthly-target">Monthly application target</Label>
          <Input
            id="monthly-target"
            type="number"
            min={1}
            max={20000}
            value={monthly}
            onChange={(e) => setMonthly(clampInt(e.target.valueAsNumber, 1, 20000))}
          />
        </div>
      </div>
      <Button type="submit" size="sm" disabled={!dirty || pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Save />}
        Save targets
      </Button>
    </form>
  );
}

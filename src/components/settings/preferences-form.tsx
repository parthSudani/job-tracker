"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { updateSettingsAction } from "@/actions/settings";
import { DATE_FORMAT_OPTIONS } from "@/lib/date";
import { DATE_RANGE_PRESETS } from "@/lib/constants";

const TIMEZONES = [
  "Asia/Kolkata",
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "America/Chicago",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Singapore",
  "Asia/Dubai",
  "Australia/Sydney",
];

export function PreferencesForm({
  timezone,
  dateFormat,
  defaultDashboardRange,
}: {
  timezone: string;
  dateFormat: string;
  defaultDashboardRange: string;
}) {
  const router = useRouter();
  const [tz, setTz] = React.useState(timezone);
  const [fmt, setFmt] = React.useState(dateFormat);
  const [range, setRange] = React.useState(defaultDashboardRange);
  const [pending, startTransition] = React.useTransition();

  const dirty = tz !== timezone || fmt !== dateFormat || range !== defaultDashboardRange;

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateSettingsAction({ timezone: tz, dateFormat: fmt, defaultDashboardRange: range });
      if (res.ok) {
        toast.success("Preferences updated.");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not update preferences.");
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
        <div>
          <Label>Theme</Label>
          <p className="text-xs text-muted-foreground">Applies instantly on this device.</p>
        </div>
        <ThemeToggle />
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label>Timezone</Label>
            <Select value={tz} onValueChange={setTz}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((z) => (
                  <SelectItem key={z} value={z}>
                    {z}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date format</Label>
            <Select value={fmt} onValueChange={setFmt}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_FORMAT_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Default dashboard range</Label>
            <Select value={range} onValueChange={setRange}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_PRESETS.filter((p) => p.value !== "custom").map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Applications are tracked against your device&apos;s local date. Timezone is stored for reference and export only.
        </p>
        <Button type="submit" size="sm" disabled={!dirty || pending}>
          {pending ? <Loader2 className="animate-spin" /> : <Save />}
          Save preferences
        </Button>
      </form>
    </div>
  );
}

import Link from "next/link";
import { LayoutGrid } from "lucide-react";
import { getSettings } from "@/lib/services/settings";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalsSettingsForm } from "@/components/settings/goals-settings-form";
import { PreferencesForm } from "@/components/settings/preferences-form";
import { DataManagement } from "@/components/settings/data-management";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Configure targets, preferences, and your data.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Goals &amp; Targets</CardTitle>
          <CardDescription>Drives progress bars across the Dashboard, Today, and Goals pages.</CardDescription>
        </CardHeader>
        <CardContent>
          <GoalsSettingsForm dailyTarget={settings.dailyTarget} monthlyTarget={settings.monthlyTarget} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preferences</CardTitle>
          <CardDescription>Theme, timezone, and display defaults.</CardDescription>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            timezone={settings.timezone}
            dateFormat={settings.dateFormat}
            defaultDashboardRange={settings.defaultDashboardRange}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Manage Platforms, Categories &amp; Priorities</CardTitle>
          <CardDescription>
            Add company career sites, activate or deactivate boards, and change any platform&apos;s priority or
            category from its detail page.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline" size="sm">
            <Link href="/platforms">
              <LayoutGrid />
              Open Platform Directory
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Data</CardTitle>
          <CardDescription>Export, import, or reset everything you&apos;ve tracked.</CardDescription>
        </CardHeader>
        <CardContent>
          <DataManagement />
        </CardContent>
      </Card>
    </div>
  );
}

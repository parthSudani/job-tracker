import { readStore, writeStore, nowIso } from "@/lib/store";
import type { SettingsFormInput } from "@/lib/validations";

export async function getSettings() {
  const { settings } = await readStore();
  return settings;
}

export async function updateSettings(input: Partial<SettingsFormInput>) {
  return writeStore((data) => {
    data.settings = { ...data.settings, ...input, updatedAt: nowIso() };
    return data.settings;
  });
}

export async function resetAllData() {
  await writeStore((data) => {
    data.records = [];
    data.dayNotes = [];
    data.platforms = data.platforms.filter((p) => !p.isCustom);
    for (const p of data.platforms) p.active = true;
    data.settings = { ...data.settings, dailyTarget: 50, monthlyTarget: 1000, updatedAt: nowIso() };
  });
}

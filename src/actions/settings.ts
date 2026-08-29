"use server";

import { revalidatePath } from "next/cache";
import { settingsFormSchema } from "@/lib/validations";
import * as settingsService from "@/lib/services/settings";

export async function updateSettingsAction(input: unknown) {
  const parsed = settingsFormSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await settingsService.updateSettings(parsed.data);
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function resetAllDataAction() {
  await settingsService.resetAllData();
  revalidatePath("/", "layout");
  return { ok: true as const };
}

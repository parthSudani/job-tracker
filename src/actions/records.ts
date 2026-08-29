"use server";

import { revalidatePath } from "next/cache";
import { upsertRecordSchema, bulkUpsertSchema } from "@/lib/validations";
import * as recordsService from "@/lib/services/records";

const AFFECTED_PATHS = ["/dashboard", "/today", "/platforms", "/history", "/calendar", "/analytics", "/goals"];

function revalidateAll() {
  for (const p of AFFECTED_PATHS) revalidatePath(p);
  revalidatePath("/platforms/[slug]", "page");
}

export async function upsertRecordAction(input: unknown) {
  const parsed = upsertRecordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await recordsService.upsertRecord(parsed.data);
  revalidateAll();
  return { ok: true as const };
}

export async function bulkSaveDayAction(input: unknown) {
  const parsed = bulkUpsertSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const savedCount = await recordsService.bulkUpsertForDate(parsed.data);
  revalidateAll();
  return { ok: true as const, savedCount };
}

export async function deleteRecordAction(id: string) {
  await recordsService.deleteRecord(id);
  revalidateAll();
  return { ok: true as const };
}

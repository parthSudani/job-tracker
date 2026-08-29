"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { upsertDayNote } from "@/lib/services/day-notes";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().max(2000),
});

export async function saveDayNoteAction(input: unknown) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await upsertDayNote(parsed.data.date, parsed.data.note);
  revalidatePath("/today");
  revalidatePath("/history");
  revalidatePath("/calendar");
  return { ok: true as const };
}

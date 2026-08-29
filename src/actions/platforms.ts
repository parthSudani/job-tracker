"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as platformsService from "@/lib/services/platforms";
import { platformFormSchema } from "@/lib/validations";

function revalidateAll() {
  revalidatePath("/platforms");
  revalidatePath("/platforms/[slug]", "page");
  revalidatePath("/today");
  revalidatePath("/dashboard");
  revalidatePath("/goals");
}

const addCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(120),
  officialUrl: z.union([z.string().url("Enter a valid URL"), z.literal("")]).optional(),
  notes: z.string().max(1000).optional(),
});

export async function addCompanyAction(input: unknown) {
  const parsed = addCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const platform = await platformsService.createCompanyPlatform(parsed.data);
  revalidateAll();
  return { ok: true as const, platform };
}

export async function togglePlatformActiveAction(id: string, active: boolean) {
  await platformsService.setPlatformActive(id, active);
  revalidateAll();
  return { ok: true as const };
}

export async function updatePlatformAction(id: string, input: unknown) {
  const parsed = platformFormSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  await platformsService.updatePlatform(id, parsed.data);
  revalidateAll();
  return { ok: true as const };
}

export async function deleteCustomPlatformAction(id: string) {
  try {
    await platformsService.deleteCustomPlatform(id);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not delete platform" };
  }
  revalidateAll();
  return { ok: true as const };
}

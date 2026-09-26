"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import * as platformsService from "@/lib/services/platforms";
import { platformFormSchema } from "@/lib/validations";
import { PRIORITIES } from "@/lib/constants";

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
  priority: z.enum(PRIORITIES).default("Medium"),
});

export async function addCompanyAction(input: unknown) {
  const parsed = addCompanySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  let platform;
  try {
    platform = await platformsService.createCompanyPlatform(parsed.data);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not add company — please try again." };
  }
  revalidateAll();
  return { ok: true as const, platform };
}

export async function togglePlatformActiveAction(id: string, active: boolean) {
  try {
    await platformsService.setPlatformActive(id, active);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not update — please try again." };
  }
  revalidateAll();
  return { ok: true as const };
}

export async function updatePlatformAction(id: string, input: unknown) {
  const parsed = platformFormSchema.partial().safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  try {
    await platformsService.updatePlatform(id, parsed.data);
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Could not save — please try again." };
  }
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

import { readStore, writeStore, newId, nowIso, slugify, type PlatformRow, type StoreData } from "@/lib/store";
import { PRIORITY_ORDER } from "@/lib/constants";
import type { PlatformFormInput } from "@/lib/validations";

export async function listPlatforms(opts: { activeOnly?: boolean } = {}) {
  const { platforms } = await readStore();
  const list = opts.activeOnly ? platforms.filter((p) => p.active) : platforms;
  return [...list].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 9;
    const pb = PRIORITY_ORDER[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return a.sortOrder - b.sortOrder;
  });
}

export async function getPlatformBySlug(slug: string): Promise<PlatformRow | null> {
  const { platforms } = await readStore();
  return platforms.find((p) => p.slug === slug) ?? null;
}

export async function getPlatformById(id: string): Promise<PlatformRow | null> {
  const { platforms } = await readStore();
  return platforms.find((p) => p.id === id) ?? null;
}

/** Pure in-place mutation, reused by both createCompanyPlatform and the bulk import route. */
export function createCompanyPlatformInPlace(
  data: StoreData,
  input: { name: string; officialUrl?: string | null; notes?: string | null }
): PlatformRow {
  const base = slugify(input.name) || "company";
  let slug = base;
  let n = 1;
  while (data.platforms.some((p) => p.slug === slug)) {
    slug = `${base}-${++n}`;
  }
  const ts = nowIso();
  const platform: PlatformRow = {
    id: newId(),
    name: input.name,
    slug,
    officialUrl: input.officialUrl || null,
    category: "Company Site",
    description: "Company career site added manually.",
    whyUseIt: null,
    recommendedFor: null,
    recommendedFrequency: "As needed",
    priority: "Medium",
    priorityReason: null,
    notes: input.notes || null,
    active: true,
    isCustom: true,
    sortOrder: data.platforms.length + 1,
    createdAt: ts,
    updatedAt: ts,
  };
  data.platforms.push(platform);
  return platform;
}

export async function createCompanyPlatform(input: {
  name: string;
  officialUrl?: string | null;
  notes?: string | null;
}) {
  return writeStore((data) => createCompanyPlatformInPlace(data, input));
}

export async function updatePlatform(id: string, input: Partial<PlatformFormInput>) {
  return writeStore((data) => {
    const platform = data.platforms.find((p) => p.id === id);
    if (!platform) throw new Error("Platform not found.");
    if (input.name !== undefined) platform.name = input.name;
    if (input.officialUrl !== undefined) platform.officialUrl = input.officialUrl || null;
    if (input.category !== undefined) platform.category = input.category;
    if (input.description !== undefined) platform.description = input.description;
    if (input.priority !== undefined) platform.priority = input.priority;
    if (input.recommendedFrequency !== undefined) platform.recommendedFrequency = input.recommendedFrequency;
    if (input.notes !== undefined) platform.notes = input.notes ?? null;
    if (input.active !== undefined) platform.active = input.active;
    platform.updatedAt = nowIso();
    return platform;
  });
}

export async function setPlatformActive(id: string, active: boolean) {
  return writeStore((data) => {
    const platform = data.platforms.find((p) => p.id === id);
    if (!platform) throw new Error("Platform not found.");
    platform.active = active;
    platform.updatedAt = nowIso();
    return platform;
  });
}

export async function deleteCustomPlatform(id: string) {
  return writeStore((data) => {
    const platform = data.platforms.find((p) => p.id === id);
    if (!platform) return;
    if (!platform.isCustom) {
      throw new Error("Only custom company entries can be deleted. Seed platforms can be deactivated instead.");
    }
    data.platforms = data.platforms.filter((p) => p.id !== id);
    data.records = data.records.filter((r) => r.platformId !== id);
  });
}

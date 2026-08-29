import { prisma } from "@/lib/db";
import { PRIORITY_ORDER } from "@/lib/constants";
import type { PlatformFormInput } from "@/lib/validations";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function listPlatforms(opts: { activeOnly?: boolean } = {}) {
  const platforms = await prisma.platform.findMany({
    where: opts.activeOnly ? { active: true } : undefined,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return platforms.sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 9;
    const pb = PRIORITY_ORDER[b.priority] ?? 9;
    if (pa !== pb) return pa - pb;
    return a.sortOrder - b.sortOrder;
  });
}

export function getPlatformBySlug(slug: string) {
  return prisma.platform.findUnique({ where: { slug } });
}

export function getPlatformById(id: string) {
  return prisma.platform.findUnique({ where: { id } });
}

export async function createCompanyPlatform(input: {
  name: string;
  officialUrl?: string | null;
  notes?: string | null;
}) {
  const base = slugify(input.name) || "company";
  let slug = base;
  let n = 1;
  while (await prisma.platform.findUnique({ where: { slug } })) {
    slug = `${base}-${++n}`;
  }
  const count = await prisma.platform.count();
  return prisma.platform.create({
    data: {
      name: input.name,
      slug,
      officialUrl: input.officialUrl || null,
      category: "Company Site",
      description: "Company career site added manually.",
      recommendedFrequency: "As needed",
      priority: "Medium",
      notes: input.notes || null,
      active: true,
      isCustom: true,
      sortOrder: count + 1,
    },
  });
}

export async function updatePlatform(id: string, input: Partial<PlatformFormInput>) {
  return prisma.platform.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.officialUrl !== undefined ? { officialUrl: input.officialUrl || null } : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
      ...(input.priority !== undefined ? { priority: input.priority } : {}),
      ...(input.recommendedFrequency !== undefined
        ? { recommendedFrequency: input.recommendedFrequency }
        : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
    },
  });
}

export async function setPlatformActive(id: string, active: boolean) {
  return prisma.platform.update({ where: { id }, data: { active } });
}

export async function deleteCustomPlatform(id: string) {
  const platform = await prisma.platform.findUnique({ where: { id } });
  if (!platform) return;
  if (!platform.isCustom) {
    throw new Error("Only custom company entries can be deleted. Seed platforms can be deactivated instead.");
  }
  await prisma.platform.delete({ where: { id } });
}

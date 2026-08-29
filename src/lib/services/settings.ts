import { prisma } from "@/lib/db";
import type { SettingsFormInput } from "@/lib/validations";

export async function getSettings() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (settings) return settings;
  return prisma.settings.create({ data: { id: 1 } });
}

export async function updateSettings(input: Partial<SettingsFormInput>) {
  await getSettings();
  return prisma.settings.update({ where: { id: 1 }, data: input });
}

export async function resetAllData() {
  await prisma.$transaction([
    prisma.applicationRecord.deleteMany({}),
    prisma.platform.deleteMany({ where: { isCustom: true } }),
    prisma.platform.updateMany({ data: { active: true } }),
    prisma.settings.upsert({
      where: { id: 1 },
      update: { dailyTarget: 50, monthlyTarget: 1000 },
      create: { id: 1 },
    }),
  ]);
}

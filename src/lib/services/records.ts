import { prisma } from "@/lib/db";
import { keyToUtcDate, utcDateToKey, type DateKey } from "@/lib/date";
import type { UpsertRecordInput, BulkUpsertInput } from "@/lib/validations";

export async function upsertRecord(input: UpsertRecordInput) {
  const date = keyToUtcDate(input.date);
  return prisma.applicationRecord.upsert({
    where: { platformId_date: { platformId: input.platformId, date } },
    update: { applicationCount: input.applicationCount, notes: input.notes ?? undefined },
    create: {
      platformId: input.platformId,
      date,
      applicationCount: input.applicationCount,
      notes: input.notes ?? null,
    },
  });
}

/**
 * Saves a full day's tallies in one transaction. A platform is only written
 * when it already has a record for that day (so an explicit reset to 0 is
 * respected) or the new count is > 0 — untouched platforms never create
 * empty rows.
 */
export async function bulkUpsertForDate(input: BulkUpsertInput) {
  const date = keyToUtcDate(input.date);
  const platformIds = input.entries.map((e) => e.platformId);
  const existing = await prisma.applicationRecord.findMany({
    where: { date, platformId: { in: platformIds } },
    select: { platformId: true },
  });
  const existingIds = new Set(existing.map((r) => r.platformId));

  const toWrite = input.entries.filter((e) => e.applicationCount > 0 || existingIds.has(e.platformId));

  await prisma.$transaction(
    toWrite.map((e) =>
      prisma.applicationRecord.upsert({
        where: { platformId_date: { platformId: e.platformId, date } },
        update: { applicationCount: e.applicationCount },
        create: { platformId: e.platformId, date, applicationCount: e.applicationCount },
      })
    )
  );

  return toWrite.length;
}

export async function getRecordsForDate(dateKeyStr: DateKey) {
  return prisma.applicationRecord.findMany({
    where: { date: keyToUtcDate(dateKeyStr) },
    include: { platform: true },
  });
}

export async function getRecordsForPlatform(platformId: string, opts: { fromKey?: DateKey; toKey?: DateKey } = {}) {
  return prisma.applicationRecord.findMany({
    where: {
      platformId,
      date: {
        ...(opts.fromKey ? { gte: keyToUtcDate(opts.fromKey) } : {}),
        ...(opts.toKey ? { lte: keyToUtcDate(opts.toKey) } : {}),
      },
    },
    orderBy: { date: "desc" },
  });
}

export async function getRecordsInRange(fromKey: DateKey, toKey: DateKey) {
  return prisma.applicationRecord.findMany({
    where: { date: { gte: keyToUtcDate(fromKey), lte: keyToUtcDate(toKey) } },
    include: { platform: true },
    orderBy: { date: "desc" },
  });
}

export async function deleteRecord(id: string) {
  return prisma.applicationRecord.delete({ where: { id } });
}

/** Lightweight fetch of every record for in-memory aggregation (see lib/analytics.ts). */
export async function getAllRecordsLight() {
  const rows = await prisma.applicationRecord.findMany({
    select: { platformId: true, date: true, applicationCount: true },
  });
  return rows.map((r) => ({ platformId: r.platformId, date: utcDateToKey(r.date), applicationCount: r.applicationCount }));
}

/** Full record set with platform details, for History/Calendar pages (personal-scale — safe to fetch in full). */
export async function getAllRecordsWithPlatform() {
  const rows = await prisma.applicationRecord.findMany({
    include: { platform: true },
    orderBy: { date: "desc" },
  });
  return rows.map((r) => ({ ...r, date: utcDateToKey(r.date) }));
}

export function toRecordDTO<T extends { date: Date }>(record: T) {
  return { ...record, date: utcDateToKey(record.date) };
}

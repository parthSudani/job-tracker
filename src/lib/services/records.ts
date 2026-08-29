import { readStore, writeStore, newId, nowIso, type RecordRow, type StoreData } from "@/lib/store";
import { keyToUtcDate, type DateKey } from "@/lib/date";
import type { UpsertRecordInput, BulkUpsertInput } from "@/lib/validations";

function withDate<T extends RecordRow>(row: T) {
  return { ...row, date: keyToUtcDate(row.date) };
}

/** Pure in-place upsert, reused by upsertRecord, bulkUpsertForDate, and the import route. */
export function upsertRecordInPlace(
  data: StoreData,
  input: { platformId: string; date: DateKey; applicationCount: number; notes?: string | null }
): RecordRow {
  const ts = nowIso();
  let record = data.records.find((r) => r.platformId === input.platformId && r.date === input.date);
  if (record) {
    record.applicationCount = input.applicationCount;
    if (input.notes !== undefined) record.notes = input.notes ?? null;
    record.updatedAt = ts;
  } else {
    record = {
      id: newId(),
      platformId: input.platformId,
      date: input.date,
      applicationCount: input.applicationCount,
      notes: input.notes ?? null,
      createdAt: ts,
      updatedAt: ts,
    };
    data.records.push(record);
  }
  return record;
}

export async function upsertRecord(input: UpsertRecordInput) {
  const result = await writeStore((data) => upsertRecordInPlace(data, input));
  return withDate(result);
}

/**
 * Saves a full day's tallies in one write. A platform is only written when
 * it already has a record for that day (so an explicit reset to 0 is
 * respected) or the new count is > 0 — untouched platforms never create
 * empty rows.
 */
export async function bulkUpsertForDate(input: BulkUpsertInput) {
  return writeStore((data) => {
    let count = 0;
    for (const e of input.entries) {
      const existing = data.records.find((r) => r.platformId === e.platformId && r.date === input.date);
      if (!existing && e.applicationCount <= 0) continue;
      upsertRecordInPlace(data, { platformId: e.platformId, date: input.date, applicationCount: e.applicationCount });
      count++;
    }
    return count;
  });
}

export async function getRecordsForDate(dateKeyStr: DateKey) {
  const { records, platforms } = await readStore();
  const byId = new Map(platforms.map((p) => [p.id, p]));
  return records
    .filter((r) => r.date === dateKeyStr)
    .map((r) => ({ ...withDate(r), platform: byId.get(r.platformId)! }));
}

export async function getRecordsForPlatform(platformId: string, opts: { fromKey?: DateKey; toKey?: DateKey } = {}) {
  const { records } = await readStore();
  return records
    .filter(
      (r) =>
        r.platformId === platformId &&
        (!opts.fromKey || r.date >= opts.fromKey) &&
        (!opts.toKey || r.date <= opts.toKey)
    )
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map(withDate);
}

export async function deleteRecord(id: string) {
  await writeStore((data) => {
    data.records = data.records.filter((r) => r.id !== id);
  });
}

/** Lightweight fetch of every record for in-memory aggregation (see lib/analytics.ts). */
export async function getAllRecordsLight() {
  const { records } = await readStore();
  return records.map((r) => ({ platformId: r.platformId, date: r.date, applicationCount: r.applicationCount }));
}

/** Full record set with platform details, for History/Calendar pages (personal-scale — safe to fetch in full). */
export async function getAllRecordsWithPlatform() {
  const { records, platforms } = await readStore();
  const byId = new Map(platforms.map((p) => [p.id, p]));
  return [...records]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .map((r) => ({ ...r, platform: byId.get(r.platformId)! }));
}

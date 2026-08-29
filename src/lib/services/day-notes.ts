import { prisma } from "@/lib/db";
import { keyToUtcDate, utcDateToKey, type DateKey } from "@/lib/date";

export async function getDayNote(date: DateKey) {
  return prisma.dayNote.findUnique({ where: { date: keyToUtcDate(date) } });
}

export async function getDayNotesInRange(fromKey: DateKey, toKey: DateKey) {
  return prisma.dayNote.findMany({
    where: { date: { gte: keyToUtcDate(fromKey), lte: keyToUtcDate(toKey) } },
  });
}

export async function getAllDayNotes() {
  const rows = await prisma.dayNote.findMany();
  return new Map(rows.map((r) => [utcDateToKey(r.date), r.note] as const));
}

export async function upsertDayNote(date: DateKey, note: string) {
  const trimmed = note.trim();
  const utcDate = keyToUtcDate(date);
  if (!trimmed) {
    await prisma.dayNote.deleteMany({ where: { date: utcDate } });
    return null;
  }
  return prisma.dayNote.upsert({
    where: { date: utcDate },
    update: { note: trimmed },
    create: { date: utcDate, note: trimmed },
  });
}

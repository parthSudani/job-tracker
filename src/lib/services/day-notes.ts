import { readStore, writeStore, newId, nowIso } from "@/lib/store";
import type { DateKey } from "@/lib/date";

export async function getDayNote(date: DateKey) {
  const { dayNotes } = await readStore();
  return dayNotes.find((n) => n.date === date) ?? null;
}

export async function getAllDayNotes(): Promise<Map<DateKey, string>> {
  const { dayNotes } = await readStore();
  return new Map(dayNotes.map((n) => [n.date, n.note] as const));
}

export async function upsertDayNote(date: DateKey, note: string) {
  const trimmed = note.trim();
  return writeStore((data) => {
    const existingIndex = data.dayNotes.findIndex((n) => n.date === date);
    if (!trimmed) {
      if (existingIndex !== -1) data.dayNotes.splice(existingIndex, 1);
      return null;
    }
    if (existingIndex !== -1) {
      data.dayNotes[existingIndex] = { ...data.dayNotes[existingIndex], note: trimmed, updatedAt: nowIso() };
      return data.dayNotes[existingIndex];
    }
    const ts = nowIso();
    const created = { id: newId(), date, note: trimmed, createdAt: ts, updatedAt: ts };
    data.dayNotes.push(created);
    return created;
  });
}

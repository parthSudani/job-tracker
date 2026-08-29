// All calendar-day math happens in "key space" (yyyy-MM-dd strings) using
// UTC getters/setters exclusively, so there is never ambiguity between the
// browser's local date and the UTC-midnight Date stored in SQLite. `today()`
// is the one place local time enters, since this is a self-hosted,
// single-user app where the server clock is the user's own clock.

const MS_PER_DAY = 86_400_000;

export type DateKey = string; // yyyy-MM-dd

export function dateKey(d: Date): DateKey {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayKey(): DateKey {
  return dateKey(new Date());
}

/** yyyy-MM-dd -> the UTC-midnight Date persisted in the database. */
export function keyToUtcDate(key: DateKey): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Stored UTC-midnight Date -> yyyy-MM-dd. */
export function utcDateToKey(d: Date): DateKey {
  return d.toISOString().slice(0, 10);
}

export function addDaysToKey(key: DateKey, days: number): DateKey {
  const d = keyToUtcDate(key);
  d.setUTCDate(d.getUTCDate() + days);
  return utcDateToKey(d);
}

export function daysBetweenKeys(a: DateKey, b: DateKey): number {
  return Math.round((keyToUtcDate(b).getTime() - keyToUtcDate(a).getTime()) / MS_PER_DAY);
}

/** Monday-start week. */
export function startOfWeekKey(key: DateKey): DateKey {
  const d = keyToUtcDate(key);
  const dow = d.getUTCDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  d.setUTCDate(d.getUTCDate() + diff);
  return utcDateToKey(d);
}

export function endOfWeekKey(key: DateKey): DateKey {
  return addDaysToKey(startOfWeekKey(key), 6);
}

export function startOfMonthKey(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`;
}

export function endOfMonthKey(key: DateKey): DateKey {
  const [y, m] = key.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${key.slice(0, 7)}-${String(last).padStart(2, "0")}`;
}

export function addMonthsToKey(key: DateKey, months: number): DateKey {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, d));
  return utcDateToKey(date);
}

export function daysInRange(startKeyStr: DateKey, endKeyStr: DateKey): DateKey[] {
  const out: DateKey[] = [];
  let cur = startKeyStr;
  while (cur <= endKeyStr) {
    out.push(cur);
    cur = addDaysToKey(cur, 1);
  }
  return out;
}

export type DisplayPattern = "short" | "long" | "weekday" | "weekdayLong" | "dayMonth" | "monthYear";

export function formatDisplay(key: DateKey, pattern: DisplayPattern = "short"): string {
  const date = keyToUtcDate(key);
  const opts: Intl.DateTimeFormatOptions =
    pattern === "long"
      ? { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" }
      : pattern === "weekday"
        ? { weekday: "short", timeZone: "UTC" }
        : pattern === "weekdayLong"
          ? { weekday: "long", timeZone: "UTC" }
          : pattern === "dayMonth"
            ? { day: "2-digit", month: "short", timeZone: "UTC" }
            : pattern === "monthYear"
              ? { month: "long", year: "numeric", timeZone: "UTC" }
              : { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" };
  return new Intl.DateTimeFormat("en-GB", opts).format(date);
}

export function isToday(key: DateKey): boolean {
  return key === todayKey();
}

/**
 * Renders a date using a user-configurable pattern (from Settings), for the
 * handful of high-visibility spots where format preference matters most —
 * see components/dashboard/greeting-header.tsx and components/today/date-nav.tsx.
 * Supports tokens: yyyy, MMM, MM, dd.
 */
export function formatWithPattern(key: DateKey, pattern: string): string {
  const date = keyToUtcDate(key);
  const yyyy = String(date.getUTCFullYear());
  const MM = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  const MMM = new Intl.DateTimeFormat("en-GB", { month: "short", timeZone: "UTC" }).format(date);
  return pattern.replace("yyyy", yyyy).replace("MMM", MMM).replace("MM", MM).replace("dd", dd);
}

export const DATE_FORMAT_OPTIONS = [
  { value: "dd MMM yyyy", label: "29 Aug 2026" },
  { value: "MMM dd, yyyy", label: "Aug 29, 2026" },
  { value: "MM/dd/yyyy", label: "08/29/2026" },
  { value: "yyyy-MM-dd", label: "2026-08-29" },
] as const;

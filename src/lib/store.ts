import { randomUUID } from "crypto";
import { cache } from "react";
import { get, put } from "@vercel/blob";
import { SEED_PLATFORMS } from "@/lib/seed-platforms";

// Whole-app persistence: a single JSON document stored as one private Vercel
// Blob file. Every service function reads/writes through this module — no
// other file talks to @vercel/blob directly. This is intentionally simple
// (no schema, no transactions, no migrations) for a personal, low-traffic,
// single-user tool. Two real limitations worth knowing:
//  1. Concurrent writes race — the last write wins, there's no locking.
//     Fine for one person acting sequentially; not safe for multiple
//     simultaneous editors.
//  2. Every write rewrites the entire document. Fine at personal scale
//     (thousands of records), not something you'd want at real scale.
const BLOB_PATHNAME = "job-tracker-data.json";

export type PlatformRow = {
  id: string;
  name: string;
  slug: string;
  officialUrl: string | null;
  category: string;
  description: string;
  whyUseIt: string | null;
  recommendedFor: string | null;
  recommendedFrequency: string;
  priority: string;
  priorityReason: string | null;
  active: boolean;
  isCustom: boolean;
  sortOrder: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type RecordRow = {
  id: string;
  platformId: string;
  date: string; // yyyy-MM-dd
  applicationCount: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DayNoteRow = {
  id: string;
  date: string; // yyyy-MM-dd
  note: string;
  createdAt: string;
  updatedAt: string;
};

export type SettingsRow = {
  dailyTarget: number;
  monthlyTarget: number;
  timezone: string;
  dateFormat: string;
  theme: string;
  defaultDashboardRange: string;
  updatedAt: string;
};

export type StoreData = {
  platforms: PlatformRow[];
  records: RecordRow[];
  dayNotes: DayNoteRow[];
  settings: SettingsRow;
};

export function newId(): string {
  return randomUUID();
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function defaultSettings(): SettingsRow {
  return {
    dailyTarget: 50,
    monthlyTarget: 1000,
    timezone: "Asia/Kolkata",
    dateFormat: "dd MMM yyyy",
    theme: "system",
    defaultDashboardRange: "7d",
    updatedAt: nowIso(),
  };
}

function createSeedData(): StoreData {
  const ts = nowIso();
  const platforms: PlatformRow[] = SEED_PLATFORMS.map((p, i) => ({
    id: newId(),
    name: p.name,
    slug: p.slug,
    officialUrl: p.officialUrl,
    category: p.category,
    description: p.description,
    whyUseIt: p.whyUseIt,
    recommendedFor: p.recommendedFor,
    recommendedFrequency: p.recommendedFrequency,
    priority: p.priority,
    priorityReason: p.priorityReason,
    active: true,
    isCustom: false,
    sortOrder: i,
    notes: null,
    createdAt: ts,
    updatedAt: ts,
  }));
  return { platforms, records: [], dayNotes: [], settings: defaultSettings() };
}

function requireToken(): string {
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error(
      "BLOB_READ_WRITE_TOKEN is not set. Add a Blob store to your Vercel project (Storage → Create Database → Blob), " +
        "copy its read-write token into .env locally (and into your Vercel project's environment variables), and retry."
    );
  }
  return token;
}

async function readBlobRaw(): Promise<StoreData | null> {
  const token = requireToken();
  const result = await get(BLOB_PATHNAME, { access: "private", useCache: false, token });
  if (!result) return null;
  const text = await new Response(result.stream).text();
  return JSON.parse(text) as StoreData;
}

async function writeBlobRaw(data: StoreData): Promise<void> {
  const token = requireToken();
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
  });
}

async function loadOrSeed(): Promise<StoreData> {
  const existing = await readBlobRaw();
  if (existing) return existing;
  const seeded = createSeedData();
  await writeBlobRaw(seeded);
  return seeded;
}

/**
 * Read-only access to the store, memoized per request (React.cache) so a
 * page that calls several services doesn't re-fetch the same blob multiple
 * times. Never used for the read-before-write inside writeStore — that
 * always fetches fresh to keep the write's base state as current as possible.
 */
export const readStore = cache(loadOrSeed);

/** Fetches the freshest data, lets `mutator` edit it in place, persists it. */
export async function writeStore<T>(mutator: (data: StoreData) => T): Promise<T> {
  const data = await loadOrSeed();
  const result = mutator(data);
  await writeBlobRaw(data);
  return result;
}

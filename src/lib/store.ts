import { randomUUID } from "crypto";
import { cache } from "react";
import { get, put, BlobPreconditionFailedError } from "@vercel/blob";
import { SEED_PLATFORMS } from "@/lib/seed-platforms";

// Whole-app persistence: a single JSON document stored as one private Vercel
// Blob file. Every service function reads/writes through this module — no
// other file talks to @vercel/blob directly. This is intentionally simple
// (no schema, no transactions, no migrations) for a personal, low-traffic,
// single-user tool. One real limitation worth knowing: every write rewrites
// the entire document. Fine at personal scale (thousands of records), not
// something you'd want at real scale.
//
// Concurrent writes (two tabs/devices editing close together) are handled
// with optimistic concurrency: writeStore reads the blob's ETag, only
// commits with `ifMatch` on that ETag, and retries the whole read-mutate-
// write cycle if another writer raced in first — so the loser retries
// against fresh data instead of silently clobbering the winner's change.
const BLOB_PATHNAME = "job-tracker-data.json";
const MAX_WRITE_ATTEMPTS = 8;

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

async function readBlobRaw(): Promise<{ data: StoreData; etag: string } | null> {
  const token = requireToken();
  const result = await get(BLOB_PATHNAME, { access: "private", useCache: false, token });
  if (!result) return null;
  const text = await new Response(result.stream).text();
  return { data: JSON.parse(text) as StoreData, etag: result.blob.etag };
}

async function writeBlobRaw(data: StoreData, ifMatch?: string): Promise<void> {
  const token = requireToken();
  await put(BLOB_PATHNAME, JSON.stringify(data), {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    token,
    ifMatch,
  });
}

async function loadOrSeed(): Promise<StoreData> {
  const existing = await readBlobRaw();
  if (existing) return existing.data;
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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetches the freshest data, lets `mutator` edit it in place, persists it.
 * Commits with `ifMatch` on the ETag it read, so a write from another tab
 * or device that landed in between makes this one fail fast instead of
 * silently overwriting it — the whole read-mutate-write cycle then retries
 * (with jittered backoff) against the newer data. `mutator` must be safe to
 * call more than once.
 */
export async function writeStore<T>(mutator: (data: StoreData) => T): Promise<T> {
  for (let attempt = 1; attempt <= MAX_WRITE_ATTEMPTS; attempt++) {
    const existing = await readBlobRaw();
    const data = existing ? existing.data : createSeedData();
    const result = mutator(data);
    try {
      await writeBlobRaw(data, existing?.etag);
      return result;
    } catch (err) {
      const isConflict = err instanceof BlobPreconditionFailedError;
      if (!isConflict) throw err;
      if (attempt === MAX_WRITE_ATTEMPTS) {
        throw new Error(
          "Couldn't save — this data was being edited from another tab or device at the same time. Please refresh and try again."
        );
      }
      // Jittered backoff so two writers retrying in lockstep don't keep
      // colliding on every attempt.
      await sleep(30 * attempt + Math.random() * 100);
    }
  }
  throw new Error("Couldn't save — please refresh and try again.");
}

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
// writeStore retries with proper conflict detection for up to this long
// (wall clock, exponential backoff) before falling back to an unconditional
// write — long enough to resolve ordinary overlapping edits cleanly, short
// enough that a save never feels stuck waiting on it.
const MAX_WRITE_WAIT_MS = 3_000;

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

function addMissingSeedPlatforms(data: StoreData): boolean {
  const bySlug = new Map(data.platforms.map((platform) => [platform.slug, platform]));
  let changed = false;
  const ts = nowIso();
  for (const platform of SEED_PLATFORMS) {
    const existing = bySlug.get(platform.slug);
    if (existing) {
      if (existing.priority !== platform.priority || existing.priorityReason !== platform.priorityReason) {
        existing.priority = platform.priority;
        existing.priorityReason = platform.priorityReason;
        existing.updatedAt = ts;
        changed = true;
      }
      continue;
    }

    const added: PlatformRow = {
      id: newId(),
      name: platform.name,
      slug: platform.slug,
      officialUrl: platform.officialUrl,
      category: platform.category,
      description: platform.description,
      whyUseIt: platform.whyUseIt,
      recommendedFor: platform.recommendedFor,
      recommendedFrequency: platform.recommendedFrequency,
      priority: platform.priority,
      priorityReason: platform.priorityReason,
      active: true,
      isCustom: false,
      sortOrder: data.platforms.length,
      notes: null,
      createdAt: ts,
      updatedAt: ts,
    };
    data.platforms.push(added);
    bySlug.set(platform.slug, added);
    changed = true;
  }
  return changed;
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
  // The CDN in front of Blob storage serves this file with a weak (W/-prefixed)
  // ETag once it's past a small size, but `put`'s `ifMatch` only does strong
  // comparison — a weak tag can never match, so every conditional write would
  // fail unconditionally regardless of real conflicts. Strip the prefix so
  // `ifMatch` is comparing the same validator `put` itself returns.
  const etag = result.blob.etag.replace(/^W\//, "");
  return { data: JSON.parse(text) as StoreData, etag };
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
  if (existing) {
    if (!addMissingSeedPlatforms(existing.data)) return existing.data;
    try {
      await writeBlobRaw(existing.data, existing.etag);
      return existing.data;
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) return loadOrSeed();
      throw err;
    }
  }
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
 * call more than once (each retry re-reads the latest data first, so it's
 * effectively replaying "apply this one change" on top of whatever the
 * other writer just saved, not reverting it).
 *
 * This is a personal, single-user tool used from multiple devices — a save
 * must never be rejected outright just because two devices happened to edit
 * around the same moment. So after the timed retry window, this doesn't
 * throw: it falls through to one last unconditional write of the mutator's
 * result against the latest data, with no ifMatch guard. That trades the
 * (vanishingly rare, sub-second, same-record) theoretical lost-update case
 * for a save that always succeeds — the right call here, since the failure
 * mode of "your save was silently rejected" is worse than "in an extreme
 * edge case, the very last of several simultaneous edits to the exact same
 * record wins."
 */
export async function writeStore<T>(mutator: (data: StoreData) => T): Promise<T> {
  const deadline = Date.now() + MAX_WRITE_WAIT_MS;
  let attempt = 0;
  while (true) {
    attempt++;
    const existing = await readBlobRaw();
    const data = existing ? existing.data : createSeedData();
    addMissingSeedPlatforms(data);
    const result = mutator(data);
    const pastDeadline = Date.now() >= deadline;
    try {
      // Once we're past the deadline, commit unconditionally (no ifMatch)
      // instead of giving up — see the doc comment above.
      await writeBlobRaw(data, pastDeadline ? undefined : existing?.etag);
      return result;
    } catch (err) {
      if (!(err instanceof BlobPreconditionFailedError) || pastDeadline) throw err;
      // Exponential backoff with jitter, capped, so competing writers spread
      // out instead of repeatedly landing on the same instant.
      const backoff = Math.min(1000, 50 * 2 ** attempt);
      await sleep(backoff * (0.5 + Math.random()));
    }
  }
}

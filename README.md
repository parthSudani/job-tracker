# Job Hunt Command Center

A personal job application tracker. You manually log how many applications you
submitted per platform each day; the app turns that into dashboards, trends,
streaks, and goal tracking. It never applies to jobs, scrapes listings, or
fabricates data — every number on screen comes from something you entered.

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **Vercel Blob** for storage — the whole app's data (platforms, application
  records, day notes, settings) lives in one private JSON file
  (`job-tracker-data.json`) in your Vercel Blob store. No database, no
  schema, no migrations. All reads/writes go through `src/lib/store.ts` and
  `src/lib/services/*` — nothing else touches storage directly.
- **Tailwind CSS v4** with a hand-built design system (`src/components/ui`)
  on Radix primitives — no external UI kit
- **Recharts** for trend/distribution charts, **next-themes** for dark/light/system

### Why not SQLite, and why not a plain local file?

Vercel's serverless functions run on a read-only, ephemeral filesystem —
nothing written to local disk persists between requests, or is even visible
across the multiple instances Vercel may run. That rules out SQLite and a
plain `data/*.json` file alike. Vercel Blob is the closest thing to "just a
JSON file" that actually works there: it's file storage, not a database, but
reachable over the network from any serverless invocation.

### Real limitations of this approach (worth knowing)

- **No locking or transactions.** Every write reads the whole file, edits it,
  and writes it back. Two saves at nearly the same instant can race, and the
  last write wins. Fine for one person using the app sequentially; not safe
  for multiple simultaneous editors.
- **Whole-file rewrites.** Every save rewrites the entire JSON document.
  Totally fine at personal scale (thousands of records); not something you'd
  want at real multi-user scale — if this ever needs that, swap `store.ts`
  for a real database without touching any page or component, since they
  only ever call `src/lib/services/*`.

## Getting started (local dev)

You need a Blob store token even for local development — see
[Storage setup](#storage-setup) below, then:

```bash
npm install
# put your token in .env as BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."
npm run dev
```

Open http://localhost:3000 — it redirects to `/dashboard`. The store
auto-seeds the 31 job platforms (zero application records) the first time
anything reads it, so there's no separate seed step.

## Storage setup

1. In your Vercel project: **Storage → Create Database → Blob** (free tier,
   ~1 minute, no credit card).
2. It auto-adds a read-write token to your project's environment variables —
   go to **Settings → Environment Variables** and confirm one is literally
   named `BLOB_READ_WRITE_TOKEN` (rename/duplicate it if Vercel named it
   something else), applied to **Production** and **Preview**.
3. Copy that same token into your local `.env` as
   `BLOB_READ_WRITE_TOKEN="vercel_blob_rw_..."` — using the **same** token
   for local dev and Vercel means both read/write the same data.

## Deploying to Vercel

1. Push this repo to GitHub/GitLab/Bitbucket and import it in Vercel (or run
   `vercel` from this directory if you prefer the CLI).
2. Set up the Blob store and `BLOB_READ_WRITE_TOKEN` as described above —
   do this **before** the first deploy.
3. Deploy. There's no build-time database step — `next build` is all it takes.

## Data model (see `src/lib/store.ts`)

- **Platform** — a job board/company site (LinkedIn, Naukri, a company you added...).
  Centralized config: priority, category, official URL, recommended frequency.
- **ApplicationRecord** — one (platform, date) pair and a count. Unique per
  `(platformId, date)` — re-saving a day updates it in place, never creates
  a duplicate.
- **DayNote** — one optional freeform note per calendar day.
- **Settings** — one object: daily/monthly targets, timezone, date format, theme.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | ESLint |

## Exporting / resetting data

Settings → Data lets you export CSV/JSON, re-import a previously exported
JSON file, or permanently reset everything (type-to-confirm required). The
export/import format is a good backup mechanism given the single-file
storage model above.

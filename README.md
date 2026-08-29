# Job Hunt Command Center

A personal job application tracker. You manually log how many applications you
submitted per platform each day; the app turns that into dashboards, trends,
streaks, and goal tracking. It never applies to jobs, scrapes listings, or
fabricates data — every number on screen comes from something you entered.

## Stack

- **Next.js 16** (App Router, Server Actions, TypeScript)
- **Prisma + SQLite** for local-first storage — swap the datasource to
  Postgres/Supabase later without touching UI code; all reads/writes go
  through `src/lib/services/*`
- **Tailwind CSS v4** with a hand-built design system (`src/components/ui`)
  on Radix primitives — no external UI kit
- **Recharts** for trend/distribution charts, **next-themes** for dark/light/system

## Getting started

```bash
npm install
npm run db:push    # create prisma/dev.db from the schema
npm run db:seed     # seed the 31 job platforms (zero application records)
npm run dev
```

Open http://localhost:3000 — it redirects to `/dashboard`.

## Data model

- **Platform** — a job board/company site (LinkedIn, Naukri, a company you added...).
  Centralized config: priority, category, official URL, recommended frequency.
- **ApplicationRecord** — one (platform, date) pair and a count. Unique
  constraint on `(platformId, date)` means re-saving a day updates in place —
  never creates duplicates.
- **DayNote** — one optional freeform note per calendar day.
- **Settings** — singleton row: daily/monthly targets, timezone, date format, theme.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Type-check + production build |
| `npm run db:push` | Sync `prisma/schema.prisma` to the SQLite file |
| `npm run db:seed` | Re-seed the 31 platforms (idempotent upsert) |
| `npm run db:studio` | Open Prisma Studio to browse the database |

## Exporting / resetting data

Settings → Data lets you export CSV/JSON, re-import a previously exported
JSON file, or permanently reset everything (type-to-confirm required).

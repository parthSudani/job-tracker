import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { keyToUtcDate } from "@/lib/date";
import { createCompanyPlatform } from "@/lib/services/platforms";

export const dynamic = "force-dynamic";

const importRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  platform: z.string().min(1),
  applications: z.coerce.number().int().min(0).max(100000),
  notes: z.string().optional().nullable(),
});

const importPayloadSchema = z.array(importRowSchema).max(50000);

/**
 * Restores data previously produced by /api/export (format=json). Rows are
 * matched to an existing platform by case-insensitive name; unmatched names
 * are created as new "Company Site" entries so nothing is silently dropped.
 * Each (platform, date) pair upserts in place — re-importing the same file
 * is safe and never creates duplicate rows.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "File is not valid JSON." }, { status: 400 });
  }

  const parsed = importPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: `Import file doesn't match the expected format: ${parsed.error.issues[0]?.message}` },
      { status: 400 }
    );
  }

  const rows = parsed.data;
  const platforms = await prisma.platform.findMany();
  const byName = new Map(platforms.map((p) => [p.name.toLowerCase().trim(), p]));

  let created = 0;
  let updated = 0;
  let platformsCreated = 0;

  for (const row of rows) {
    const key = row.platform.toLowerCase().trim();
    let platform = byName.get(key);
    if (!platform) {
      platform = await createCompanyPlatform({ name: row.platform });
      byName.set(key, platform);
      platformsCreated++;
    }

    const date = keyToUtcDate(row.date);
    const existing = await prisma.applicationRecord.findUnique({
      where: { platformId_date: { platformId: platform.id, date } },
    });

    await prisma.applicationRecord.upsert({
      where: { platformId_date: { platformId: platform.id, date } },
      update: { applicationCount: row.applications, notes: row.notes || undefined },
      create: {
        platformId: platform.id,
        date,
        applicationCount: row.applications,
        notes: row.notes || null,
      },
    });

    if (existing) updated++;
    else created++;
  }

  return NextResponse.json({ ok: true, created, updated, platformsCreated, totalRows: rows.length });
}

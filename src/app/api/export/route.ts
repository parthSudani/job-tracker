import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { utcDateToKey, todayKey } from "@/lib/date";

export const dynamic = "force-dynamic";

function csvEscape(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") === "json" ? "json" : "csv";

  const records = await prisma.applicationRecord.findMany({
    include: { platform: true },
    orderBy: [{ date: "desc" }],
  });

  const rows = records.map((r) => ({
    date: utcDateToKey(r.date),
    platform: r.platform.name,
    applications: r.applicationCount,
    priority: r.platform.priority,
    category: r.platform.category,
    notes: r.notes ?? "",
  }));

  const filename = `job-tracker-export-${todayKey()}.${format}`;

  if (format === "json") {
    return new NextResponse(JSON.stringify(rows, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const header = ["Date", "Platform", "Applications", "Priority", "Category", "Notes"].join(",");
  const body = rows
    .map((r) =>
      [r.date, r.platform, String(r.applications), r.priority, r.category, r.notes]
        .map((v) => csvEscape(String(v)))
        .join(",")
    )
    .join("\n");

  return new NextResponse([header, body].filter(Boolean).join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

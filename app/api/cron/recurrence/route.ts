import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function nextDate(recurrence: string): Date {
  const now = new Date();
  if (recurrence === "DAILY") now.setDate(now.getDate() + 1);
  else if (recurrence === "WEEKLY") now.setDate(now.getDate() + 7);
  else if (recurrence === "MONTHLY") now.setMonth(now.getMonth() + 1);
  return now;
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const due = await (prisma.request as any).findMany({
    where: {
      recurrence: { not: "NONE" },
      nextOccurrence: { lte: now },
    },
  });

  let created = 0;
  for (const r of due) {
    await (prisma.request as any).create({
      data: {
        title: r.title,
        description: r.description,
        sectorId: r.sectorId,
        priority: r.priority,
        createdById: r.createdById,
        requestedTo: r.requestedTo,
        recurrence: r.recurrence,
        nextOccurrence: nextDate(r.recurrence),
      },
    });
    await (prisma.request as any).update({
      where: { id: r.id },
      data: { nextOccurrence: nextDate(r.recurrence) },
    });
    created++;
  }

  return NextResponse.json({ processed: due.length, created });
}

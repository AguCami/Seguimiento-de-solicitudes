import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const sectorId = searchParams.get("sectorId");
  const user = session.user as any;

  const where: any = {};
  if (status) where.status = status;
  if (sectorId) where.sectorId = sectorId;
  if (user.role === "SOLICITANTE") where.createdById = user.id;
  if (user.role === "RESPONSABLE" && user.sector) {
    where.sector = { name: user.sector };
  }

  const requests = await prisma.request.findMany({
    where,
    include: { createdBy: { select: { name: true, email: true } }, sector: true, _count: { select: { comments: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

function computeNextOccurrence(recurrence: string): Date | null {
  const now = new Date();
  if (recurrence === "DAILY") { now.setDate(now.getDate() + 1); return now; }
  if (recurrence === "WEEKLY") { now.setDate(now.getDate() + 7); return now; }
  if (recurrence === "MONTHLY") { now.setMonth(now.getMonth() + 1); return now; }
  return null;
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { title, description, sectorId, priority, requestedTo, startDate, endDate, recurrence } = body;
  const user = session.user as any;

  const rec = recurrence ?? "NONE";
  const nextOccurrence = computeNextOccurrence(rec);

  const request = await (prisma.request as any).create({
    data: {
      title,
      description,
      sectorId,
      priority: priority || "MEDIA",
      createdById: user.id,
      requestedTo: requestedTo ?? null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      recurrence: rec,
      nextOccurrence,
    },
    include: { sector: true, createdBy: { select: { name: true } } },
  } as any);

  return NextResponse.json(request, { status: 201 });
}

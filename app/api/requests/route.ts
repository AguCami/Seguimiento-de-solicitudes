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

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { title, description, sectorId, priority } = await req.json();
  const user = session.user as any;

  const request = await prisma.request.create({
    data: { title, description, sectorId, priority: priority || "MEDIA", createdById: user.id },
    include: { sector: true, createdBy: { select: { name: true } } },
  });

  return NextResponse.json(request, { status: 201 });
}

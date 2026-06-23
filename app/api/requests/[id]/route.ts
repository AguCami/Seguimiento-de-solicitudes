import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      sector: true,
      comments: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(request);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const user = session.user as any;
  const data = await req.json();

  if (data.status && user.role === "SOLICITANTE") {
    return NextResponse.json({ error: "Sin permisos para cambiar estado" }, { status: 403 });
  }

  const updated = await prisma.request.update({
    where: { id },
    data,
    include: { sector: true, createdBy: { select: { name: true } } },
  });

  return NextResponse.json(updated);
}

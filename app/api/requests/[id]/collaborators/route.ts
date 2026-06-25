import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const me = (session.user as any).id;
  const { id } = await params;

  const request = await prisma.request.findUnique({ where: { id }, select: { createdById: true } });
  if (!request) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (request.createdById !== me && (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (userId === me) return NextResponse.json({ error: "No podés compartir contigo mismo" }, { status: 400 });

  try {
    await prisma.requestCollaborator.create({ data: { requestId: id, userId } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Ya es colaborador" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const me = (session.user as any).id;
  const { id } = await params;

  const request = await prisma.request.findUnique({ where: { id }, select: { createdById: true } });
  if (!request) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (request.createdById !== me && (session.user as any).role !== "ADMIN") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 });
  }

  const { userId } = await req.json();
  await prisma.requestCollaborator.deleteMany({ where: { requestId: id, userId } });
  return NextResponse.json({ ok: true });
}

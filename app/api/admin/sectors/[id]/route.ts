import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function isAdmin() {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.role === "ADMIN";
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  const { name, description } = await req.json();
  try {
    const sector = await prisma.sector.update({ where: { id }, data: { name, description } });
    return NextResponse.json(sector);
  } catch {
    return NextResponse.json({ error: "El nombre ya existe o sector no encontrado" }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.sector.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "No se puede eliminar: tiene solicitudes asociadas" }, { status: 400 });
  }
}

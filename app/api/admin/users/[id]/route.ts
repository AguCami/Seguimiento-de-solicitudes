import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN" && user?.role !== "GESTOR") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const { name, email, role, sector, password } = await req.json();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
  }

  const data: any = { name, email, role, sector: sector || null };
  if (password) data.password = await bcrypt.hash(password, 10);

  const updated = await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ id: updated.id, name: updated.name });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN" && user?.role !== "GESTOR") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  if (user.id === id) return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

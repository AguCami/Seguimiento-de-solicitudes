import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN" && user?.role !== "GESTOR") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { name, email, password, role, sector } = await req.json();

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ error: "El email ya está registrado" }, { status: 400 });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = await prisma.user.create({ data: { name, email, password: hashed, role, sector } });

  return NextResponse.json({ id: newUser.id, name: newUser.name }, { status: 201 });
}

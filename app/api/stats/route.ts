import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const user = session.user as any;

  const where: any = {};
  if (user.role === "SOLICITANTE") where.createdById = user.id;
  if (user.role === "RESPONSABLE" && user.sector) where.sector = { name: user.sector };

  const [total, pendiente, en_progreso, resuelto] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.count({ where: { ...where, status: "PENDIENTE" } }),
    prisma.request.count({ where: { ...where, status: "EN_PROGRESO" } }),
    prisma.request.count({ where: { ...where, status: "RESUELTO" } }),
  ]);

  return NextResponse.json({ total, pendiente, en_progreso, resuelto });
}

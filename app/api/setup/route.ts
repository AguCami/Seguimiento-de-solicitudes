import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  const existing = await prisma.user.findUnique({ where: { email: "admin@empresa.com" } });
  if (existing) return NextResponse.json({ message: "Ya inicializado" });

  const hash = async (p: string) => bcrypt.hash(p, 10);

  const sectors = [
    { name: "IT / Sistemas", description: "Soporte técnico e infraestructura" },
    { name: "Recursos Humanos", description: "Personal y gestión laboral" },
    { name: "Administración", description: "Finanzas y contabilidad" },
    { name: "Mantenimiento", description: "Mantenimiento general de instalaciones" },
    { name: "Compras", description: "Adquisición de materiales e insumos" },
  ];

  for (const s of sectors) {
    await prisma.sector.upsert({ where: { name: s.name }, update: {}, create: s });
  }

  await prisma.user.create({ data: { name: "Administrador", email: "admin@empresa.com", password: await hash("admin123"), role: "ADMIN" } });
  await prisma.user.create({ data: { name: "Responsable IT", email: "it@empresa.com", password: await hash("it123"), role: "RESPONSABLE", sector: "IT / Sistemas" } });
  await prisma.user.create({ data: { name: "Juan Pérez", email: "usuario@empresa.com", password: await hash("usuario123"), role: "SOLICITANTE" } });

  return NextResponse.json({ message: "Base de datos inicializada correctamente ✓" });
}

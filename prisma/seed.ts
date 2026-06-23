import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
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

  const hash = async (p: string) => bcrypt.hash(p, 10);

  await prisma.user.upsert({
    where: { email: "admin@empresa.com" },
    update: {},
    create: { name: "Administrador", email: "admin@empresa.com", password: await hash("admin123"), role: "ADMIN" },
  });

  await prisma.user.upsert({
    where: { email: "it@empresa.com" },
    update: {},
    create: { name: "Responsable IT", email: "it@empresa.com", password: await hash("it123"), role: "RESPONSABLE", sector: "IT / Sistemas" },
  });

  await prisma.user.upsert({
    where: { email: "usuario@empresa.com" },
    update: {},
    create: { name: "Juan Pérez", email: "usuario@empresa.com", password: await hash("usuario123"), role: "SOLICITANTE" },
  });

  console.log("Seed completado ✓");
}

main().catch(console.error).finally(() => prisma.$disconnect());

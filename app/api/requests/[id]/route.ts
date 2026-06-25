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
      history: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(request);
}

const fieldLabels: Record<string, string> = {
  status: "Estado",
  priority: "Prioridad",
  title: "Título",
  description: "Descripción",
  sectorId: "Sector",
  startDate: "Fecha de inicio",
  endDate: "Fecha de fin",
  assignedToId: "Responsable asignado",
};

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const user = session.user as any;
  const data = await req.json();

  const current = await prisma.request.findUnique({ where: { id } });
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const isOwner = user.id === current.createdById;

  if (data.status && user.role === "SOLICITANTE") {
    return NextResponse.json({ error: "Sin permisos para cambiar estado" }, { status: 403 });
  }
  if (data.status && user.role === "EDITOR" && !isOwner) {
    return NextResponse.json({ error: "Sin permisos para cambiar estado de solicitudes ajenas" }, { status: 403 });
  }

  // Block RESUELTO if there are pending subtasks
  if (data.status === "RESUELTO") {
    const pendingSubtasks = await prisma.subTask.count({ where: { requestId: id, done: false } });
    if (pendingSubtasks > 0) {
      return NextResponse.json({
        error: `No se puede resolver la solicitud: hay ${pendingSubtasks} subtarea${pendingSubtasks > 1 ? "s" : ""} pendiente${pendingSubtasks > 1 ? "s" : ""}`,
      }, { status: 400 });
    }
  }

  // Registrar historial de cambios
  const historyEntries = [];
  for (const key of Object.keys(data)) {
    const oldVal = (current as any)[key];
    const newVal = data[key];
    if (oldVal !== newVal && fieldLabels[key]) {
      historyEntries.push({ field: fieldLabels[key], oldValue: oldVal ? String(oldVal) : null, newValue: newVal ? String(newVal) : null, requestId: id, userId: user.id });
    }
  }

  const [updated] = await prisma.$transaction([
    prisma.request.update({ where: { id }, data, include: { sector: true, createdBy: { select: { name: true } } } }),
    ...historyEntries.map((h) => prisma.requestHistory.create({ data: h })),
  ]);

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const user = session.user as any;

  const request = await prisma.request.findUnique({ where: { id }, select: { createdById: true } });
  if (!request) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const canDelete = user.role === "ADMIN" || user.id === request.createdById;
  if (!canDelete) return NextResponse.json({ error: "Sin permisos" }, { status: 403 });

  await prisma.request.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

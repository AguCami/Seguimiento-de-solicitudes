import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const { title } = await req.json();
  if (!title?.trim()) return NextResponse.json({ error: "Título requerido" }, { status: 400 });
  const subtask = await prisma.subTask.create({ data: { title: title.trim(), requestId: id } });
  return NextResponse.json(subtask, { status: 201 });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const { subtaskId, done, title } = await req.json();
  const updated = await prisma.subTask.update({
    where: { id: subtaskId, requestId: id },
    data: { ...(done !== undefined ? { done } : {}), ...(title ? { title } : {}) },
  });
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const { id } = await params;
  const { subtaskId } = await req.json();
  await prisma.subTask.delete({ where: { id: subtaskId, requestId: id } });
  return NextResponse.json({ ok: true });
}

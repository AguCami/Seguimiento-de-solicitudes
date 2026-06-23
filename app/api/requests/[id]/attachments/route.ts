import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File;

  if (!file) return NextResponse.json({ error: "No se recibió archivo" }, { status: 400 });
  if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "El archivo no puede superar 10MB" }, { status: 400 });

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return NextResponse.json({ error: "Blob storage no configurado" }, { status: 500 });

  const blob = await put(`requests/${id}/${Date.now()}-${file.name}`, file, { access: "public", token });

  const attachment = await prisma.attachment.create({
    data: { name: file.name, url: blob.url, type: file.type, size: file.size, requestId: id },
  });

  return NextResponse.json(attachment, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const attachmentId = searchParams.get("attachmentId");
  if (!attachmentId) return NextResponse.json({ error: "Falta attachmentId" }, { status: 400 });

  await prisma.attachment.delete({ where: { id: attachmentId } });
  return NextResponse.json({ ok: true });
}

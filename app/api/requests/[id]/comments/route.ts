import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const user = session.user as any;

  const contentType = req.headers.get("content-type") ?? "";
  let content = "";
  let fileData: { name: string; url: string; type: string; size: number } | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    content = (formData.get("content") as string) ?? "";
    const file = formData.get("file") as File | null;
    if (file && file.size > 0) {
      if (file.size > 10 * 1024 * 1024) return NextResponse.json({ error: "Archivo demasiado grande (máx 10MB)" }, { status: 400 });
      const blob = await put(`comments/${id}/${Date.now()}-${file.name}`, file, { access: "public" });
      fileData = { name: file.name, url: blob.url, type: file.type, size: file.size };
    }
  } else {
    const body = await req.json();
    content = body.content ?? "";
  }

  if (!content.trim() && !fileData) return NextResponse.json({ error: "Comentario vacío" }, { status: 400 });

  const comment = await prisma.comment.create({
    data: {
      content,
      requestId: id,
      authorId: user.id,
      ...(fileData ? { attachments: { create: [fileData] } } : {}),
    },
    include: {
      author: { select: { name: true, role: true } },
      attachments: true,
    },
  });

  // Register in history
  const preview = content.length > 60 ? content.slice(0, 57) + "…" : content;
  await prisma.requestHistory.create({
    data: {
      requestId: id,
      userId: user.id,
      field: "comentario",
      newValue: fileData ? `${preview || ""}${preview ? " " : ""}[adjunto: ${fileData.name}]` : preview,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}

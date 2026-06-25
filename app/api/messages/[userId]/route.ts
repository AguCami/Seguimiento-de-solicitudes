import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const me = (session.user as any).id;
  const { userId } = await params;

  const messages = await prisma.directMessage.findMany({
    where: { OR: [{ senderId: me, receiverId: userId }, { senderId: userId, receiverId: me }] },
    orderBy: { createdAt: "asc" },
    select: { id: true, content: true, senderId: true, createdAt: true, read: true },
  });

  // Mark received messages as read
  await prisma.directMessage.updateMany({
    where: { senderId: userId, receiverId: me, read: false },
    data: { read: true },
  });

  return NextResponse.json(messages);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const me = (session.user as any).id;
  const { userId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });

  const msg = await prisma.directMessage.create({
    data: { content: content.trim(), senderId: me, receiverId: userId },
    select: { id: true, content: true, senderId: true, createdAt: true, read: true },
  });

  return NextResponse.json(msg, { status: 201 });
}

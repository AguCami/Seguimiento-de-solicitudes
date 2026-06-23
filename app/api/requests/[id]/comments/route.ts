import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();
  const user = session.user as any;

  const comment = await prisma.comment.create({
    data: { content, requestId: id, authorId: user.id },
    include: { author: { select: { name: true, role: true } } },
  });

  return NextResponse.json(comment, { status: 201 });
}

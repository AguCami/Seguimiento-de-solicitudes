import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/messages — list of all users + last message + unread count
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const me = (session.user as any).id;

  const users = await prisma.user.findMany({
    where: { id: { not: me } },
    select: { id: true, name: true, role: true, avatarUrl: true },
    orderBy: { name: "asc" },
  });

  const conversations = await Promise.all(
    users.map(async (u) => {
      const [last, unread] = await Promise.all([
        prisma.directMessage.findFirst({
          where: { OR: [{ senderId: me, receiverId: u.id }, { senderId: u.id, receiverId: me }] },
          orderBy: { createdAt: "desc" },
          select: { content: true, createdAt: true, senderId: true },
        }),
        prisma.directMessage.count({
          where: { senderId: u.id, receiverId: me, read: false },
        }),
      ]);
      return { user: u, last, unread };
    })
  );

  // Sort: conversations with messages first, then by latest
  conversations.sort((a, b) => {
    if (!a.last && !b.last) return 0;
    if (!a.last) return 1;
    if (!b.last) return -1;
    return new Date(b.last.createdAt).getTime() - new Date(a.last.createdAt).getTime();
  });

  const totalUnread = conversations.reduce((acc, c) => acc + c.unread, 0);
  return NextResponse.json({ conversations, totalUnread });
}

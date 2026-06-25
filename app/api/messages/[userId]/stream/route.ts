import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return new Response("No autorizado", { status: 401 });

  const me = (session.user as any).id;
  const { userId } = await params;

  const encoder = new TextEncoder();
  let lastId: string | null = null;
  let closed = false;

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial messages
      const initial = await prisma.directMessage.findMany({
        where: { OR: [{ senderId: me, receiverId: userId }, { senderId: userId, receiverId: me }] },
        orderBy: { createdAt: "asc" },
        select: { id: true, content: true, senderId: true, createdAt: true, read: true },
      });
      await prisma.directMessage.updateMany({
        where: { senderId: userId, receiverId: me, read: false },
        data: { read: true },
      });
      if (initial.length > 0) lastId = initial[initial.length - 1].id;

      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "init", messages: initial })}\n\n`));

      // Poll for new messages every 1.5s
      const interval = setInterval(async () => {
        if (closed) { clearInterval(interval); return; }
        try {
          const newMsgs = await prisma.directMessage.findMany({
            where: {
              OR: [{ senderId: me, receiverId: userId }, { senderId: userId, receiverId: me }],
              ...(lastId ? { createdAt: { gt: (await prisma.directMessage.findUnique({ where: { id: lastId }, select: { createdAt: true } }))?.createdAt } } : {}),
            },
            orderBy: { createdAt: "asc" },
            select: { id: true, content: true, senderId: true, createdAt: true, read: true },
          });

          if (newMsgs.length > 0) {
            lastId = newMsgs[newMsgs.length - 1].id;
            await prisma.directMessage.updateMany({
              where: { id: { in: newMsgs.filter(m => m.senderId === userId).map(m => m.id) } },
              data: { read: true },
            });
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "new", messages: newMsgs })}\n\n`));
          }
        } catch { clearInterval(interval); }
      }, 1500);

      // Heartbeat every 20s to keep connection alive
      const heartbeat = setInterval(() => {
        if (closed) { clearInterval(heartbeat); return; }
        try { controller.enqueue(encoder.encode(`: heartbeat\n\n`)); } catch { clearInterval(heartbeat); }
      }, 20000);

      req.signal.addEventListener("abort", () => {
        closed = true;
        clearInterval(interval);
        clearInterval(heartbeat);
        try { controller.close(); } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

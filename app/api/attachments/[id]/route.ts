import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { head } from "@vercel/blob";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const token = process.env.BLOB_READ_WRITE_TOKEN!;

  try {
    // Para store privado, redirigir con token en header no funciona en browser.
    // En cambio hacemos fetch del blob y lo retransmitimos.
    const res = await fetch(attachment.url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return NextResponse.json({ error: "No se pudo obtener el archivo" }, { status: 502 });

    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": attachment.type,
        "Content-Disposition": `inline; filename="${attachment.name}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "Error al obtener el archivo" }, { status: 500 });
  }
}

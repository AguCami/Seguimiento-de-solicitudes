import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { name, description } = await req.json();
  try {
    const sector = await prisma.sector.create({ data: { name, description } });
    return NextResponse.json(sector, { status: 201 });
  } catch {
    return NextResponse.json({ error: "El sector ya existe" }, { status: 400 });
  }
}

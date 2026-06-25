import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { put } from "@vercel/blob";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN" && user?.role !== "GESTOR") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;

  const contentType = req.headers.get("content-type") ?? "";
  let name: string, email: string, role: string, sector: string | undefined, password: string | undefined;
  let avatarUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    name = form.get("name") as string;
    email = form.get("email") as string;
    role = form.get("role") as string;
    sector = (form.get("sector") as string) || undefined;
    password = (form.get("password") as string) || undefined;
    const avatarFile = form.get("avatar") as File | null;
    if (avatarFile && avatarFile.size > 0) {
      if (avatarFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: "La foto no puede superar 2MB" }, { status: 400 });
      const ext = avatarFile.name.slice(avatarFile.name.lastIndexOf("."));
      const blob = await put(`avatars/${id}-${Date.now()}${ext}`, avatarFile, { access: "public" });
      avatarUrl = blob.url;
    }
  } else {
    const body = await req.json();
    ({ name, email, role, sector, password } = body);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: "El email ya está en uso" }, { status: 400 });
  }

  const data: any = { name, email, role, sector: sector || null };
  if (password) data.password = await bcrypt.hash(password, 10);
  if (avatarUrl) data.avatarUrl = avatarUrl;

  const updated = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, avatarUrl: true } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || user?.role !== "ADMIN" && user?.role !== "GESTOR") return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { id } = await params;
  if (user.id === id) return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 });

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

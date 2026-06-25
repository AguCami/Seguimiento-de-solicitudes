import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const me = (session.user as any).id;
  const user = await prisma.user.findUnique({
    where: { id: me },
    select: { id: true, name: true, email: true, role: true, sector: true, avatarUrl: true },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const me = (session.user as any).id;

  const contentType = req.headers.get("content-type") ?? "";
  let name: string | undefined;
  let email: string | undefined;
  let currentPassword: string | undefined;
  let newPassword: string | undefined;
  let avatarUrl: string | undefined;

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    name = (formData.get("name") as string) || undefined;
    email = (formData.get("email") as string) || undefined;
    currentPassword = (formData.get("currentPassword") as string) || undefined;
    newPassword = (formData.get("newPassword") as string) || undefined;
    const avatarFile = formData.get("avatar") as File | null;
    if (avatarFile && avatarFile.size > 0) {
      if (avatarFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: "La foto no puede superar 2MB" }, { status: 400 });
      const blob = await put(`avatars/${me}-${Date.now()}${avatarFile.name.slice(avatarFile.name.lastIndexOf("."))}`, avatarFile, { access: "public" });
      avatarUrl = blob.url;
    }
  } else {
    const body = await req.json();
    ({ name, email, currentPassword, newPassword } = body);
  }

  const user = await prisma.user.findUnique({ where: { id: me } });
  if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  // Validate password change
  let hashedPassword: string | undefined;
  if (newPassword) {
    if (!currentPassword) return NextResponse.json({ error: "Ingresá tu contraseña actual" }, { status: 400 });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 });
    if (newPassword.length < 6) return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 });
    hashedPassword = await bcrypt.hash(newPassword, 10);
  }

  // Check email uniqueness
  if (email && email !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Ese email ya está en uso" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: me },
    data: {
      ...(name ? { name } : {}),
      ...(email ? { email } : {}),
      ...(hashedPassword ? { password: hashedPassword } : {}),
      ...(avatarUrl ? { avatarUrl } : {}),
    },
    select: { id: true, name: true, email: true, role: true, sector: true, avatarUrl: true },
  });

  return NextResponse.json(updated);
}

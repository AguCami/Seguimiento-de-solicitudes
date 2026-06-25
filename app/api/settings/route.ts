import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put } from "@vercel/blob";

const PUBLIC_KEYS = ["logoUrl", "orgName"];

export async function GET() {
  const rows = await (prisma as any).appSetting.findMany();
  const settings: Record<string, string> = {};
  for (const r of rows) settings[r.key] = r.value;
  return NextResponse.json(settings);
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== "ADMIN" && user?.role !== "GESTOR")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  const updates: Record<string, string> = {};

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    const logoFile = form.get("logo") as File | null;
    const orgName = form.get("orgName") as string | null;
    if (orgName !== null) updates.orgName = orgName;
    if (logoFile && logoFile.size > 0) {
      if (logoFile.size > 2 * 1024 * 1024) return NextResponse.json({ error: "Logo no puede superar 2MB" }, { status: 400 });
      const ext = logoFile.name.slice(logoFile.name.lastIndexOf("."));
      const blob = await put(`settings/logo-${Date.now()}${ext}`, logoFile, { access: "public" });
      updates.logoUrl = blob.url;
    }
  } else {
    const body = await req.json();
    for (const key of PUBLIC_KEYS) {
      if (key in body) updates[key] = body[key];
    }
  }

  for (const [key, value] of Object.entries(updates)) {
    await (prisma as any).appSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
  }

  return NextResponse.json(updates);
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!session || (user?.role !== "ADMIN" && user?.role !== "GESTOR")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }
  const { key } = await req.json();
  await (prisma as any).appSetting.deleteMany({ where: { key } });
  return NextResponse.json({ ok: true });
}

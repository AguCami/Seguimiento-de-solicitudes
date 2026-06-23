import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = session.user as any;

  const where: any = {};
  if (user.role === "SOLICITANTE") where.createdById = user.id;
  if (user.role === "RESPONSABLE" && user.sector) where.sector = { name: user.sector };

  const requests = await prisma.request.findMany({
    where,
    include: {
      sector: true,
      createdBy: { select: { name: true, email: true } },
      comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      history: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const statusLabel: Record<string, string> = {
    PENDIENTE: "Pendiente",
    EN_PROGRESO: "En progreso",
    RESUELTO: "Resuelto",
    CANCELADO: "Cancelado",
  };

  const priorityLabel: Record<string, string> = {
    BAJA: "Baja",
    MEDIA: "Media",
    ALTA: "Alta",
    URGENTE: "Urgente",
  };

  const fmt = (d: Date | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-AR") : "-";

  // --- Hoja 1: Solicitudes ---
  const mainRows = requests.map((r) => ({
    "ID": r.id.slice(0, 8).toUpperCase(),
    "Título": r.title,
    "Descripción": r.description,
    "Sector": r.sector.name,
    "Solicitante": r.createdBy.name,
    "Email solicitante": r.createdBy.email,
    "Prioridad": priorityLabel[r.priority] ?? r.priority,
    "Estado": statusLabel[r.status] ?? r.status,
    "Fecha de creación": fmt(r.createdAt),
    "Fecha de inicio": fmt(r.startDate),
    "Fecha de fin": fmt(r.endDate),
    "Comentarios": r.comments.length,
  }));

  // --- Hoja 2: Comentarios ---
  const commentRows: Record<string, string>[] = [];
  for (const r of requests) {
    for (const c of r.comments) {
      commentRows.push({
        "ID Solicitud": r.id.slice(0, 8).toUpperCase(),
        "Título Solicitud": r.title,
        "Autor": c.author.name,
        "Comentario": c.content,
        "Fecha": new Date(c.createdAt).toLocaleString("es-AR"),
      });
    }
  }

  // --- Hoja 3: Resumen por sector ---
  const bySector: Record<string, { total: number; pendiente: number; en_progreso: number; resuelto: number; cancelado: number }> = {};
  for (const r of requests) {
    const s = r.sector.name;
    if (!bySector[s]) bySector[s] = { total: 0, pendiente: 0, en_progreso: 0, resuelto: 0, cancelado: 0 };
    bySector[s].total++;
    if (r.status === "PENDIENTE") bySector[s].pendiente++;
    if (r.status === "EN_PROGRESO") bySector[s].en_progreso++;
    if (r.status === "RESUELTO") bySector[s].resuelto++;
    if (r.status === "CANCELADO") bySector[s].cancelado++;
  }
  const summaryRows = Object.entries(bySector).map(([sector, v]) => ({
    "Sector": sector,
    "Total": v.total,
    "Pendiente": v.pendiente,
    "En progreso": v.en_progreso,
    "Resuelto": v.resuelto,
    "Cancelado": v.cancelado,
    "% Resuelto": v.total > 0 ? `${Math.round((v.resuelto / v.total) * 100)}%` : "0%",
  }));

  // --- Build workbook ---
  const wb = XLSX.utils.book_new();

  function styleSheet(data: Record<string, string | number>[]) {
    const ws = XLSX.utils.json_to_sheet(data);
    // Auto column widths
    const cols = Object.keys(data[0] ?? {});
    ws["!cols"] = cols.map((key) => ({
      wch: Math.max(
        key.length + 2,
        ...data.map((r) => String(r[key] ?? "").length + 1)
      ),
    }));
    return ws;
  }

  const wsSolicitudes = styleSheet(mainRows.length > 0 ? mainRows : [{ "Sin datos": "-" }]);
  const wsComentarios = styleSheet(commentRows.length > 0 ? commentRows : [{ "Sin comentarios": "-" }]);
  const wsResumen = styleSheet(summaryRows.length > 0 ? summaryRows : [{ "Sin datos": "-" }]);

  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen");
  XLSX.utils.book_append_sheet(wb, wsSolicitudes, "Solicitudes");
  XLSX.utils.book_append_sheet(wb, wsComentarios, "Comentarios");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  const date = new Date().toLocaleDateString("es-AR").replace(/\//g, "-");
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="solicitudes-${date}.xlsx"`,
    },
  });
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusLabel: Record<string, string> = {
  PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", RESUELTO: "Resuelto", CANCELADO: "Cancelado",
};
const priorityLabel: Record<string, string> = {
  BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", URGENTE: "Urgente",
};
const priorityColor: Record<string, string> = {
  BAJA: "#22c55e", MEDIA: "#f59e0b", ALTA: "#f97316", URGENTE: "#ef4444",
};
const statusColor: Record<string, string> = {
  PENDIENTE: "#f59e0b", EN_PROGRESO: "#6366f1", RESUELTO: "#22c55e", CANCELADO: "#94a3b8",
};

async function getAppSettings() {
  try {
    const rows = await (prisma as any).appSetting.findMany();
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;
    return s;
  } catch { return {}; }
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("No autorizado", { status: 401 });
  const user = session.user as any;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const sectorId = searchParams.get("sectorId") ?? undefined;
  const q = searchParams.get("q") ?? undefined;
  const dateFrom = searchParams.get("dateFrom") ?? undefined;
  const dateTo = searchParams.get("dateTo") ?? undefined;

  const where: any = {};
  if (status) where.status = status;
  if (sectorId) where.sectorId = sectorId;
  if (user.role === "SOLICITANTE" || user.role === "EDITOR" || user.role === "GESTOR") {
    where.OR = [{ createdById: user.id }, { collaborators: { some: { userId: user.id } } }];
  }
  if (user.role === "RESPONSABLE" && user.sector) where.sector = { name: user.sector };
  if (q) {
    const qFilter = [
      { title: { contains: q, mode: "insensitive" } },
      { description: { contains: q, mode: "insensitive" } },
    ];
    where.AND = [{ OR: qFilter }];
    delete where.OR;
    if (user.role === "SOLICITANTE" || user.role === "EDITOR" || user.role === "GESTOR") {
      where.AND.push({ OR: [{ createdById: user.id }, { collaborators: { some: { userId: user.id } } }] });
    }
  }
  if (dateFrom || dateTo) {
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); dateFilter.lte = d; }
    where.createdAt = dateFilter;
  }

  const [requests, settings] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        sector: true,
        createdBy: { select: { name: true } },
        _count: { select: { comments: true, subtasks: true } },
        subtasks: { select: { done: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    getAppSettings(),
  ]);

  const logoUrl = settings.logoUrl ?? null;
  const orgName = settings.orgName ?? "Seguimiento de Solicitudes";
  const now = new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric" });

  const activeFilters = [
    status ? `Estado: ${statusLabel[status] ?? status}` : null,
    q ? `Búsqueda: "${q}"` : null,
    dateFrom ? `Desde: ${new Date(dateFrom).toLocaleDateString("es-AR")}` : null,
    dateTo ? `Hasta: ${new Date(dateTo).toLocaleDateString("es-AR")}` : null,
  ].filter(Boolean) as string[];

  const total = requests.length;
  const pendiente = requests.filter(r => r.status === "PENDIENTE").length;
  const en_progreso = requests.filter(r => r.status === "EN_PROGRESO").length;
  const resuelto = requests.filter(r => r.status === "RESUELTO").length;

  const rows = requests.map(r => {
    const done = (r as any).subtasks.filter((s: any) => s.done).length;
    const tot = r._count.subtasks;
    const pct = tot > 0 ? Math.round((done / tot) * 100) : 0;
    const progressBar = tot > 0
      ? `<div style="display:flex;align-items:center;gap:6px"><div style="flex:1;background:#e5e7eb;border-radius:999px;height:4px;min-width:48px"><div style="height:100%;border-radius:999px;width:${pct}%;background:${done === tot ? "#22c55e" : "#6366f1"}"></div></div><span style="font-size:10px;color:#9ca3af;white-space:nowrap">${done}/${tot}</span></div>`
      : `<span style="color:#d1d5db">—</span>`;
    return `<tr>
      <td class="title-cell">${escHtml(r.title)}${r.description ? `<div class="desc">${escHtml(r.description.slice(0, 120))}${r.description.length > 120 ? "…" : ""}</div>` : ""}</td>
      <td style="color:#6b7280;white-space:nowrap">${escHtml(r.sector.name)}</td>
      <td><span class="badge" style="background:${priorityColor[r.priority]}22;color:${priorityColor[r.priority]}">${priorityLabel[r.priority] ?? r.priority}</span></td>
      <td><span class="badge" style="background:${statusColor[r.status]}22;color:${statusColor[r.status]}">${statusLabel[r.status] ?? r.status}</span></td>
      <td style="color:#6b7280;white-space:nowrap">${escHtml(r.createdBy.name)}</td>
      <td>${progressBar}</td>
      <td style="color:#9ca3af;white-space:nowrap;font-size:11px">${new Date(r.createdAt).toLocaleDateString("es-AR")}</td>
    </tr>`;
  }).join("");

  const filterChips = activeFilters.map(f => `<span class="filter-chip">${escHtml(f)}</span>`).join("");

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" class="logo" />`
    : `<div class="logo-placeholder"><svg fill="none" stroke="white" viewBox="0 0 24 24" style="width:22px;height:22px"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg></div>`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Solicitudes — ${escHtml(orgName)}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1e1b4b;background:white;font-size:13px}
.page{padding:32px 36px;max-width:960px;margin:0 auto}
.header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:28px;padding-bottom:18px;border-bottom:2px solid #e0e7ff}
.header-left{display:flex;align-items:center;gap:14px}
.logo{height:44px;width:auto;border-radius:6px}
.logo-placeholder{width:44px;height:44px;border-radius:8px;background:linear-gradient(135deg,#6366f1,#7c3aed);display:flex;align-items:center;justify-content:center;flex-shrink:0}
h1{font-size:20px;font-weight:700;color:#312e81}
.subtitle{font-size:12px;color:#6b7280;margin-top:2px}
.meta{text-align:right;font-size:11px;color:#9ca3af;line-height:1.6}
.filters{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:16px}
.filter-chip{font-size:10px;background:#eef2ff;color:#4f46e5;border:1px solid #c7d2fe;border-radius:999px;padding:2px 10px}
.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:24px}
.stat-card{background:#f8faff;border:1px solid #e0e7ff;border-radius:10px;padding:14px 16px;text-align:center}
.stat-value{font-size:24px;font-weight:800;color:#312e81}
.stat-label{font-size:10px;color:#9ca3af;margin-top:2px;text-transform:uppercase;letter-spacing:.05em}
table{width:100%;border-collapse:collapse}
th{background:#eef2ff;color:#4f46e5;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:8px 10px;text-align:left}
th:first-child{border-radius:8px 0 0 8px}th:last-child{border-radius:0 8px 8px 0}
td{padding:10px;border-bottom:1px solid #f3f4f6;vertical-align:top}
tr:last-child td{border-bottom:none}
.title-cell{font-weight:600;color:#1e1b4b;max-width:220px}
.desc{font-size:11px;color:#9ca3af;margin-top:2px}
.badge{display:inline-block;font-size:10px;font-weight:600;border-radius:999px;padding:2px 8px}
.footer{margin-top:32px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10px;color:#d1d5db}
.print-btn{position:fixed;bottom:20px;right:20px;background:#6366f1;color:white;border:none;border-radius:10px;padding:10px 20px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,.4)}
@media print{@page{margin:18mm 16mm;size:A4 landscape}.no-print{display:none!important}body{font-size:11px}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      ${logoHtml}
      <div>
        <h1>${escHtml(orgName)}</h1>
        <div class="subtitle">Reporte de solicitudes · ${escHtml(user.name)}</div>
      </div>
    </div>
    <div class="meta">
      <div>Generado: ${now}</div>
      <div>${total} solicitud${total !== 1 ? "es" : ""}</div>
      ${user.role !== "ADMIN" ? `<div>Perfil: ${user.role}</div>` : ""}
    </div>
  </div>
  ${activeFilters.length > 0 ? `<div class="filters">${filterChips}</div>` : ""}
  <div class="stats">
    <div class="stat-card"><div class="stat-value">${total}</div><div class="stat-label">Total</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${statusColor.PENDIENTE}">${pendiente}</div><div class="stat-label">Pendientes</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${statusColor.EN_PROGRESO}">${en_progreso}</div><div class="stat-label">En progreso</div></div>
    <div class="stat-card"><div class="stat-value" style="color:${statusColor.RESUELTO}">${resuelto}</div><div class="stat-label">Resueltos</div></div>
  </div>
  <table>
    <thead><tr>
      <th>Título</th><th>Sector</th><th>Prioridad</th><th>Estado</th><th>Solicitante</th><th>Subtareas</th><th>Fecha</th>
    </tr></thead>
    <tbody>${rows || `<tr><td colspan="7" style="text-align:center;padding:32px;color:#9ca3af">No hay solicitudes</td></tr>`}</tbody>
  </table>
  <div class="footer">
    <span>${escHtml(orgName)} · Reporte generado el ${now}</span>
    <span>Total: ${total} solicitudes</span>
  </div>
</div>
<button class="print-btn no-print" onclick="window.print()">Imprimir / Guardar PDF</button>
<script>setTimeout(()=>window.print(),400)</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function escHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

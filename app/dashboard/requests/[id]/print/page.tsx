import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { PrintTrigger } from "./PrintTrigger";

async function getAppSettings() {
  try {
    const rows = await (prisma as any).appSetting.findMany();
    const s: Record<string, string> = {};
    for (const r of rows) s[r.key] = r.value;
    return s;
  } catch { return {}; }
}

export default async function PrintRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const user = session.user as any;
  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      sector: true,
      comments: { include: { author: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      history: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "asc" } },
      subtasks: { orderBy: { createdAt: "asc" } },
      collaborators: { include: { user: { select: { name: true } } } },
    },
  });

  if (!request) notFound();

  const isOwner = user.id === (request as any).createdById;
  const isCollaborator = (request as any).collaborators.some((c: any) => c.user.id === user.id);
  if (!isOwner && !isCollaborator && user.role !== "ADMIN" && user.role !== "RESPONSABLE" && user.role !== "EDITOR") notFound();

  const STATUS_LABELS: Record<string, string> = {
    PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", RESUELTO: "Resuelto", CANCELADO: "Cancelado",
  };
  const PRIORITY_LABELS: Record<string, string> = {
    BAJA: "Baja", MEDIA: "Media", ALTA: "Alta", URGENTE: "Urgente",
  };

  const appSettings = await getAppSettings();
  const logoUrl = appSettings.logoUrl ?? null;
  const orgName = appSettings.orgName ?? "Sistema de Seguimiento de Solicitudes";

  const doneTasks = (request as any).subtasks.filter((s: any) => s.done).length;
  const totalTasks = (request as any).subtasks.length;

  return (
    <html lang="es">
      <head>
        <meta charSet="utf-8" />
        <title>{request.title} — Solicitud</title>
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #1a1a2e; background: white; padding: 0; }
          .page { max-width: 720px; margin: 0 auto; padding: 40px; }
          .header { border-bottom: 2px solid #3b3ab5; padding-bottom: 20px; margin-bottom: 28px; }
          .logo { font-size: 11px; font-weight: 700; color: #3b3ab5; letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
          h1 { font-size: 22px; font-weight: 700; color: #0f0e2a; line-height: 1.3; margin-bottom: 12px; }
          .badges { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
          .badge { padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; border: 1px solid; }
          .badge-status-PENDIENTE { background: #fef3c7; color: #92400e; border-color: #fcd34d; }
          .badge-status-EN_PROGRESO { background: #dbeafe; color: #1e40af; border-color: #93c5fd; }
          .badge-status-RESUELTO { background: #d1fae5; color: #065f46; border-color: #6ee7b7; }
          .badge-status-CANCELADO { background: #fee2e2; color: #991b1b; border-color: #fca5a5; }
          .badge-priority-BAJA { background: #f0fdf4; color: #166534; border-color: #86efac; }
          .badge-priority-MEDIA { background: #eff6ff; color: #1e40af; border-color: #93c5fd; }
          .badge-priority-ALTA { background: #fff7ed; color: #c2410c; border-color: #fdba74; }
          .badge-priority-URGENTE { background: #fef2f2; color: #b91c1c; border-color: #fca5a5; }
          .meta { font-size: 12px; color: #6b7280; line-height: 1.8; }
          .section { margin-bottom: 24px; }
          .section-title { font-size: 11px; font-weight: 700; color: #3b3ab5; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
          .description { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; color: #374151; }
          .subtask { display: flex; align-items: center; gap: 10px; padding: 6px 0; border-bottom: 1px solid #f3f4f6; }
          .subtask:last-child { border-bottom: none; }
          .check { width: 16px; height: 16px; border: 2px solid; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 10px; }
          .check-done { border-color: #10b981; background: #d1fae5; color: #065f46; }
          .check-pending { border-color: #d1d5db; }
          .subtask-title-done { color: #9ca3af; text-decoration: line-through; }
          .comment { padding: 10px 0; border-bottom: 1px solid #f3f4f6; }
          .comment:last-child { border-bottom: none; }
          .comment-author { font-weight: 600; color: #1f2937; font-size: 12px; }
          .comment-time { font-size: 11px; color: #9ca3af; margin-left: 6px; }
          .comment-text { color: #374151; margin-top: 4px; line-height: 1.6; }
          .history-item { display: flex; gap: 10px; padding: 5px 0; font-size: 12px; color: #6b7280; }
          .dot { width: 6px; height: 6px; border-radius: 50%; background: #3b3ab5; margin-top: 5px; flex-shrink: 0; }
          .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #9ca3af; display: flex; justify-content: space-between; }
          .no-print { margin: 16px; display: flex; gap: 10px; }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0; }
            .page { padding: 20px; max-width: 100%; }
          }
        `}</style>
      </head>
      <body>
        <PrintTrigger />
        <div className="no-print" style={{ display: "flex", gap: "10px", margin: "16px" }}>
          <button onClick={() => {}} style={{ padding: "8px 20px", background: "#3b3ab5", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
            id="print-btn">
            Imprimir / Guardar PDF
          </button>
          <a href={`/dashboard/requests/${id}`} style={{ padding: "8px 20px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", textDecoration: "none", fontSize: "13px" }}>
            Volver
          </a>
        </div>

        <div className="page">
          <div className="header">
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
              {logoUrl && (
                <img src={logoUrl} alt="Logo" style={{ height: 48, maxWidth: 140, objectFit: "contain" }} />
              )}
              <div className="logo" style={{ marginBottom: 0 }}>{orgName}</div>
            </div>
            <h1>{request.title}</h1>
            <div className="badges">
              <span className={`badge badge-status-${request.status}`}>{STATUS_LABELS[request.status] ?? request.status}</span>
              <span className={`badge badge-priority-${request.priority}`}>Prioridad {PRIORITY_LABELS[request.priority] ?? request.priority}</span>
            </div>
            <div className="meta">
              <div><strong>Sector:</strong> {request.sector.name}</div>
              <div><strong>Creado por:</strong> {request.createdBy.name} · {new Date(request.createdAt).toLocaleDateString("es-AR")}</div>
              {(request as any).requestedTo && <div><strong>Solicitado a:</strong> {(request as any).requestedTo}</div>}
              {request.startDate && <div><strong>Fecha de inicio:</strong> {new Date(request.startDate).toLocaleDateString("es-AR")}</div>}
              {request.endDate && <div><strong>Fecha de fin:</strong> {new Date(request.endDate).toLocaleDateString("es-AR")}</div>}
              {(request as any).collaborators.length > 0 && (
                <div><strong>Colaboradores:</strong> {(request as any).collaborators.map((c: any) => c.user.name).join(", ")}</div>
              )}
            </div>
          </div>

          <div className="section">
            <div className="section-title">Descripción</div>
            <div className="description">{request.description}</div>
          </div>

          {totalTasks > 0 && (
            <div className="section">
              <div className="section-title">Subtareas ({doneTasks}/{totalTasks})</div>
              <div>
                {(request as any).subtasks.map((t: any) => (
                  <div key={t.id} className="subtask">
                    <div className={`check ${t.done ? "check-done" : "check-pending"}`}>{t.done ? "✓" : ""}</div>
                    <span className={t.done ? "subtask-title-done" : ""}>{t.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(request as any).comments.length > 0 && (
            <div className="section">
              <div className="section-title">Comentarios ({(request as any).comments.length})</div>
              <div>
                {(request as any).comments.map((c: any) => (
                  <div key={c.id} className="comment">
                    <div>
                      <span className="comment-author">{c.author.name}</span>
                      <span className="comment-time">{new Date(c.createdAt).toLocaleString("es-AR")}</span>
                    </div>
                    {c.content && <div className="comment-text">{c.content}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(request as any).history.length > 0 && (
            <div className="section">
              <div className="section-title">Historial de cambios</div>
              <div>
                {(request as any).history.map((h: any) => (
                  <div key={h.id} className="history-item">
                    <div className="dot" />
                    <div>
                      <strong>{h.user.name}</strong>
                      {h.field === "comentario" ? (
                        <> comentó: <em>{h.newValue}</em></>
                      ) : (
                        <> cambió <strong>{h.field}</strong>
                          {h.oldValue && <> de <s>{h.oldValue}</s></>}
                          {h.newValue && <> a {h.newValue}</>}
                        </>
                      )}
                      <span style={{ marginLeft: 8, color: "#9ca3af" }}>{new Date(h.createdAt).toLocaleString("es-AR")}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="footer">
            <span>Solicitud #{id.slice(-8).toUpperCase()}</span>
            <span>Exportado el {new Date().toLocaleDateString("es-AR")}</span>
          </div>
        </div>
      </body>
    </html>
  );
}

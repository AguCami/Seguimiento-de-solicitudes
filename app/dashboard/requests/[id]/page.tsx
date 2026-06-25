import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RequestActions } from "./RequestActions";
import { CommentBox } from "./CommentBox";
import { AttachmentsBox } from "./AttachmentsBox";
import { EditRequestButton } from "./EditRequestButton";
import { SubTasksBox } from "./SubTasksBox";
import { DeleteRequestButton } from "./DeleteRequestButton";
import { ShareRequestButton } from "./ShareRequestButton";

const glassCard = {
  background: "rgba(255,255,255,0.15)",
  backdropFilter: "blur(20px) saturate(180%)",
  WebkitBackdropFilter: "blur(20px) saturate(180%)",
  border: "1px solid rgba(255,255,255,0.3)",
  boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
} as React.CSSProperties;

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;
  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      sector: true,
      comments: { include: { author: { select: { name: true, role: true } }, attachments: true }, orderBy: { createdAt: "asc" } },
      history: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "asc" } },
      collaborators: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      subtasks: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) notFound();

  const isOwner = user.id === (request as any).createdById;
  const isCollaborator = (request as any).collaborators.some((c: any) => c.user.id === user.id);
  if (!isOwner && !isCollaborator && user.role !== "ADMIN" && user.role !== "RESPONSABLE" && user.role !== "EDITOR") notFound();
  const canEdit = user.role === "ADMIN" || isOwner;
  const canManage = user.role === "RESPONSABLE" || user.role === "ADMIN" || (user.role === "EDITOR" && isOwner);

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div style={glassCard} className="rounded-2xl p-6 card-enter">
        <div className="mb-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h1 className="text-xl font-bold text-white flex-1 min-w-0">{request.title}</h1>
            <div className="flex items-center gap-2 flex-shrink-0">
              {canEdit && <ShareRequestButton requestId={id} collaborators={(request as any).collaborators} />}
              {canEdit && <DeleteRequestButton requestId={id} />}
              {canEdit && (
              <EditRequestButton request={{
                id: request.id,
                title: request.title,
                description: request.description,
                requestedTo: (request as any).requestedTo ?? null,
                sectorId: request.sectorId,
                priority: request.priority,
                startDate: request.startDate ? request.startDate.toISOString() : null,
                endDate: request.endDate ? request.endDate.toISOString() : null,
              }} />
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
          <p className="text-sm text-white/60">
            {request.sector.name} · {request.createdBy.name} · {new Date(request.createdAt).toLocaleDateString("es-AR")}
          </p>
          {(request as any).requestedTo && (
            <p className="text-sm text-white/70 mt-1">
              <span className="text-white/45">Solicitado a:</span> {(request as any).requestedTo}
            </p>
          )}
          {(request as any).collaborators.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="text-xs text-white/45">Compartido con:</span>
              {(request as any).collaborators.map((c: any) => (
                <span key={c.user.id} style={{ background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.4)" }}
                  className="flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs text-white/80">
                  <span style={{ background: "rgba(99,102,241,0.6)" }} className="w-4 h-4 rounded-full flex items-center justify-center text-white font-bold text-[9px]">
                    {c.user.name[0].toUpperCase()}
                  </span>
                  {c.user.name}
                </span>
              ))}
            </div>
          )}
          {(request.startDate || request.endDate) && (
            <p className="text-xs text-white/45 mt-1">
              {request.startDate && `Inicio: ${new Date(request.startDate).toLocaleDateString("es-AR")}`}
              {request.startDate && request.endDate && " · "}
              {request.endDate && `Fin: ${new Date(request.endDate).toLocaleDateString("es-AR")}`}
            </p>
          )}
        </div>

        <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
          className="rounded-xl p-4 text-sm text-white/85 whitespace-pre-wrap mb-4">
          {request.description}
        </div>

        {canManage && (
          <RequestActions requestId={id} currentStatus={request.status} userRole={user.role} />
        )}
      </div>

      <AttachmentsBox requestId={id} attachments={request.attachments} />

      <SubTasksBox
        requestId={id}
        subtasks={(request as any).subtasks}
        canManage={canManage || isOwner}
      />

      <div style={{ ...glassCard, animationDelay: "80ms" }} className="rounded-2xl p-6 card-enter">
        <h2 className="font-semibold text-white mb-4">Comentarios ({request.comments.length})</h2>
        <div className="space-y-4 mb-6">
          {request.comments.length === 0 && <p className="text-white/50 text-sm">No hay comentarios todavía</p>}
          {request.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div style={{ background: "rgba(99,102,241,0.4)", border: "1px solid rgba(255,255,255,0.3)" }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white font-medium text-sm flex-shrink-0">
                {c.author.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-white">{c.author.name}</span>
                  <span className="text-xs text-white/45">{new Date(c.createdAt).toLocaleString("es-AR")}</span>
                </div>
                {c.content && (
                  <p style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)" }}
                    className="text-sm text-white/85 rounded-xl p-3">{c.content}</p>
                )}
                {(c as any).attachments?.map((a: any) => (
                  <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer"
                    style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)" }}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 mt-1 hover:opacity-80 transition">
                    <svg width="13" height="13" fill="none" stroke="rgba(165,180,252,0.9)" strokeWidth="2" viewBox="0 0 24 24">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span className="text-xs text-indigo-200 underline underline-offset-2 truncate">{a.name}</span>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <CommentBox requestId={id} />
      </div>

      {request.history.length > 0 && (
        <div style={{ ...glassCard, animationDelay: "120ms" }} className="rounded-2xl p-6 card-enter">
          <h2 className="font-semibold text-white mb-4">Historial de cambios</h2>
          <div className="space-y-2">
            {request.history.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <div style={{ background: "rgba(99,102,241,0.6)" }} className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-white">{h.user.name}</span>
                  {h.field === "comentario" ? (
                    <>
                      <span className="text-white/60"> comentó: </span>
                      <span className="text-white/85 italic">{h.newValue}</span>
                    </>
                  ) : (
                    <>
                      <span className="text-white/60"> cambió </span>
                      <span className="font-medium text-white">{h.field}</span>
                      {h.oldValue && <span className="text-white/60"> de <span className="line-through text-white/40">{h.oldValue}</span></span>}
                      {h.newValue && <span className="text-white/60"> a <span className="text-white/85">{h.newValue}</span></span>}
                    </>
                  )}
                  <span className="text-xs text-white/40 ml-2">{new Date(h.createdAt).toLocaleString("es-AR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

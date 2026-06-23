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

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;
  const { id } = await params;

  const request = await prisma.request.findUnique({
    where: { id },
    include: {
      createdBy: { select: { name: true, email: true } },
      sector: true,
      comments: { include: { author: { select: { name: true, role: true } } }, orderBy: { createdAt: "asc" } },
      history: { include: { user: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      attachments: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!request) notFound();

  const canEdit = user.role === "ADMIN" || user.id === (request as any).createdById;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Cabecera */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-xl font-bold text-gray-800">{request.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {request.sector.name} · Solicitado por {request.createdBy.name} · {new Date(request.createdAt).toLocaleDateString("es-AR")}
            </p>
            {(request.startDate || request.endDate) && (
              <p className="text-xs text-gray-400 mt-1">
                {request.startDate && `Inicio: ${new Date(request.startDate).toLocaleDateString("es-AR")}`}
                {request.startDate && request.endDate && " · "}
                {request.endDate && `Fin: ${new Date(request.endDate).toLocaleDateString("es-AR")}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
            {canEdit && (
              <EditRequestButton request={{
                id: request.id,
                title: request.title,
                description: request.description,
                sectorId: request.sectorId,
                priority: request.priority,
                startDate: request.startDate ? request.startDate.toISOString() : null,
                endDate: request.endDate ? request.endDate.toISOString() : null,
              }} />
            )}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
          {request.description}
        </div>

        {(user.role === "RESPONSABLE" || user.role === "ADMIN") && (
          <RequestActions requestId={id} currentStatus={request.status} userRole={user.role} />
        )}
      </div>

      {/* Adjuntos */}
      <AttachmentsBox requestId={id} attachments={request.attachments} />

      {/* Comentarios */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="font-semibold text-gray-700 mb-4">Comentarios ({request.comments.length})</h2>
        <div className="space-y-4 mb-6">
          {request.comments.length === 0 && <p className="text-gray-400 text-sm">No hay comentarios todavía</p>}
          {request.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-medium text-sm flex-shrink-0">
                {c.author.name[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-gray-700">{c.author.name}</span>
                  <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString("es-AR")}</span>
                </div>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <CommentBox requestId={id} />
      </div>

      {/* Historial */}
      {request.history.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-semibold text-gray-700 mb-4">Historial de cambios</h2>
          <div className="space-y-2">
            {request.history.map((h) => (
              <div key={h.id} className="flex items-start gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
                <div className="flex-1">
                  <span className="font-medium text-gray-700">{h.user.name}</span>
                  <span className="text-gray-500"> cambió </span>
                  <span className="font-medium text-gray-700">{h.field}</span>
                  {h.oldValue && <span className="text-gray-500"> de <span className="line-through text-gray-400">{h.oldValue}</span></span>}
                  {h.newValue && <span className="text-gray-500"> a <span className="text-gray-700">{h.newValue}</span></span>}
                  <span className="text-xs text-gray-400 ml-2">{new Date(h.createdAt).toLocaleString("es-AR")}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

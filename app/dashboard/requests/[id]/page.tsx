import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RequestActions } from "./RequestActions";
import { CommentBox } from "./CommentBox";

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
    },
  });

  if (!request) notFound();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{request.title}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {request.sector.name} · Solicitado por {request.createdBy.name} · {new Date(request.createdAt).toLocaleDateString("es-AR")}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 ml-4">
            <PriorityBadge priority={request.priority} />
            <StatusBadge status={request.status} />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">
          {request.description}
        </div>

        {(user.role === "RESPONSABLE" || user.role === "ADMIN") && (
          <RequestActions requestId={id} currentStatus={request.status} userRole={user.role} />
        )}
      </div>

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

        {user.role === "SOLICITANTE" && <CommentBox requestId={id} />}
      </div>
    </div>
  );
}

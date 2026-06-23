import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RequestFilters } from "./RequestFilters";
import { Suspense } from "react";

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ status?: string; sectorId?: string }> }) {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;
  const { status, sectorId } = await searchParams;

  const where: any = {};
  if (status) where.status = status;
  if (sectorId) where.sectorId = sectorId;
  if (user.role === "SOLICITANTE") where.createdById = user.id;
  if (user.role === "RESPONSABLE" && user.sector) where.sector = { name: user.sector };

  const [requests, sectors] = await Promise.all([
    prisma.request.findMany({
      where,
      include: { sector: true, createdBy: { select: { name: true } }, _count: { select: { comments: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.sector.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white drop-shadow">Solicitudes</h1>
        <Link href="/dashboard/requests/new" className="btn-glass-primary px-4 py-2 text-sm">
          + Nueva solicitud
        </Link>
      </div>

      <Suspense>
        <RequestFilters sectors={sectors} isAdmin={user.role === "ADMIN"} />
      </Suspense>

      <div style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
      }} className="rounded-2xl overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)" }}>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Solicitud</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Sector</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Prioridad</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Coments.</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-white/50">No hay solicitudes</td></tr>
            )}
            {requests.map((r, i) => (
              <tr key={r.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
                className="hover:bg-white/10 transition glass-row">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/requests/${r.id}`} className="font-medium text-white hover:text-white/80 text-sm">{r.title}</Link>
                  <p className="text-xs text-white/50 mt-0.5">{r.createdBy.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-white/70">{r.sector.name}</td>
                <td className="px-6 py-4"><PriorityBadge priority={r.priority} /></td>
                <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                <td className="px-6 py-4 text-xs text-white/50">{new Date(r.createdAt).toLocaleDateString("es-AR")}</td>
                <td className="px-6 py-4 text-sm text-white/60">{r._count.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

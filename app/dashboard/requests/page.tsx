import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RequestFilters } from "./RequestFilters";
import { Suspense } from "react";
import { ExportButton } from "./ExportButton";

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
      <div className="mb-6 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold text-white drop-shadow">Solicitudes</h1>
        <div className="flex items-center gap-2">
          <ExportButton />
          <Link href="/dashboard/requests/new" className="btn-glass-primary px-3 sm:px-4 py-2 text-sm whitespace-nowrap">
            + Nueva
          </Link>
        </div>
      </div>

      <Suspense>
        <RequestFilters sectors={sectors} isAdmin={user.role === "ADMIN"} />
      </Suspense>

      {/* Desktop table */}
      <div style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
      }} className="hidden md:block rounded-2xl overflow-hidden">
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

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {requests.length === 0 && (
          <div style={{
            background: "rgba(255,255,255,0.12)",
            border: "1px solid rgba(255,255,255,0.25)",
          }} className="rounded-2xl px-5 py-10 text-center text-white/50">
            No hay solicitudes
          </div>
        )}
        {requests.map((r) => (
          <Link key={r.id} href={`/dashboard/requests/${r.id}`} style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 2px 12px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.35)",
          }} className="block rounded-2xl p-4 active:opacity-80 transition">
            <div className="flex items-start justify-between gap-2 mb-2">
              <p className="font-semibold text-white text-sm leading-snug flex-1">{r.title}</p>
              <StatusBadge status={r.status} />
            </div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <PriorityBadge priority={r.priority} />
              <span style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
                className="text-xs text-white/75 font-medium px-2 py-0.5 rounded-full">
                {r.sector.name}
              </span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-white/45">{r.createdBy.name}</p>
              <div className="flex items-center gap-3">
                {r._count.comments > 0 && (
                  <span className="text-xs text-white/45">{r._count.comments} coments.</span>
                )}
                <span className="text-xs text-white/45">{new Date(r.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

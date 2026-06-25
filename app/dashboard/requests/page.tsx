import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";
import { RequestFilters } from "./RequestFilters";
import { Suspense } from "react";
import { ExportButton } from "./ExportButton";
import { RequestsSkeleton } from "@/components/RequestsSkeleton";

const PAGE_SIZE = 10;

const PRIORITY_ORDER: Record<string, number> = { ALTA: 0, MEDIA: 1, BAJA: 2 };
const FINALIZED = new Set(["RESUELTO", "CANCELADO"]);

function sortRequests(requests: any[]) {
  return [...requests].sort((a, b) => {
    const aFin = FINALIZED.has(a.status);
    const bFin = FINALIZED.has(b.status);
    if (aFin !== bFin) return aFin ? 1 : -1;
    const pDiff = (PRIORITY_ORDER[a.priority] ?? 1) - (PRIORITY_ORDER[b.priority] ?? 1);
    if (pDiff !== 0) return pDiff;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sectorId?: string; q?: string; page?: string; dateFrom?: string; dateTo?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;
  const { status, sectorId, q, page: pageParam, dateFrom, dateTo } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10));

  const where: any = {};
  if (status) where.status = status;
  if (sectorId) where.sectorId = sectorId;
  if (user.role === "SOLICITANTE" || user.role === "EDITOR" || user.role === "GESTOR") {
    where.OR = [
      { createdById: user.id },
      { collaborators: { some: { userId: user.id } } },
    ];
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

  // Date range filter
  if (dateFrom || dateTo) {
    const dateFilter: any = {};
    if (dateFrom) dateFilter.gte = new Date(dateFrom);
    if (dateTo) { const d = new Date(dateTo); d.setHours(23, 59, 59, 999); dateFilter.lte = d; }
    where.createdAt = dateFilter;
  }

  const [allRequests, sectors] = await Promise.all([
    prisma.request.findMany({
      where,
      include: {
        sector: true,
        createdBy: { select: { name: true } },
        _count: { select: { comments: true, subtasks: true } },
        subtasks: { select: { done: true } },
      },
    }),
    prisma.sector.findMany({ orderBy: { name: "asc" } }),
  ]);

  const sorted = sortRequests(allRequests);
  const total = sorted.length;
  const requests = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  function buildPageUrl(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    if (sectorId) params.set("sectorId", sectorId);
    if (q) params.set("q", q);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return `/dashboard/requests${qs ? `?${qs}` : ""}`;
  }

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

      <Suspense fallback={<RequestsSkeleton />}>
        <RequestFilters sectors={sectors} isAdmin={user.role === "ADMIN"} />
      </Suspense>
      <p className="text-xs text-white/40 mb-3 -mt-3 px-1">
        {total} solicitud{total !== 1 ? "es" : ""} · activas primero por prioridad
      </p>

      {/* Desktop table */}
      <div style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 4px 24px rgba(var(--a2),0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
      }} className="hidden md:block rounded-2xl overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)" }}>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Solicitud</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Sector</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Prioridad</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Solicitado a</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Subtareas</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {requests.length === 0 && (
              <tr><td colSpan={7} className="px-6 py-10 text-center text-white/50">No hay solicitudes</td></tr>
            )}
            {requests.map((r, i) => (
              <tr key={r.id}
                className="hover:bg-white/10 transition glass-row card-enter"
                style={{ animationDelay: `${i * 40}ms`, borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" } as React.CSSProperties}>
                <td className="px-6 py-4">
                  <Link href={`/dashboard/requests/${r.id}`} className="font-medium text-white hover:text-white/80 text-sm">{r.title}</Link>
                  <p className="text-xs text-white/50 mt-0.5">{r.createdBy.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-white/70">{r.sector.name}</td>
                <td className="px-6 py-4"><PriorityBadge priority={r.priority} /></td>
                <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                <td className="px-6 py-4 text-sm text-white/60">{(r as any).requestedTo ?? <span className="text-white/30">—</span>}</td>
                <td className="px-6 py-4">
                  {(r as any)._count.subtasks > 0 ? (() => {
                    const done = (r as any).subtasks.filter((s: any) => s.done).length;
                    const total = (r as any)._count.subtasks;
                    const pct = Math.round((done / total) * 100);
                    return (
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 999, height: 5, minWidth: 48 }}>
                          <div style={{ height: "100%", borderRadius: 999, width: `${pct}%`, background: done === total ? "rgba(34,197,94,0.7)" : "rgba(var(--a1),0.7)", transition: "width 0.3s" }} />
                        </div>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap" }}>{done}/{total}</span>
                      </div>
                    );
                  })() : <span className="text-white/25 text-xs">—</span>}
                </td>
                <td className="px-6 py-4 text-xs text-white/50">{new Date(r.createdAt).toLocaleDateString("es-AR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {requests.length === 0 && (
          <div style={{ background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)" }}
            className="rounded-2xl px-5 py-10 text-center text-white/50">
            No hay solicitudes
          </div>
        )}
        {requests.map((r, i) => (
          <Link key={r.id} href={`/dashboard/requests/${r.id}`}
            className="block rounded-2xl p-4 active:opacity-80 transition card-enter"
            style={{
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(20px) saturate(180%)",
              WebkitBackdropFilter: "blur(20px) saturate(180%)",
              border: "1px solid rgba(255,255,255,0.3)",
              boxShadow: "0 2px 12px rgba(var(--a2),0.1), inset 0 1px 0 rgba(255,255,255,0.35)",
              animationDelay: `${i * 50}ms`,
            }}>
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
              {(r as any).requestedTo && (
                <span style={{ background: "rgba(var(--a1),0.25)", border: "1px solid rgba(var(--a1),0.4)" }}
                  className="text-xs text-indigo-200 font-medium px-2 py-0.5 rounded-full">
                  → {(r as any).requestedTo}
                </span>
              )}
            </div>
            {(r as any)._count.subtasks > 0 && (() => {
              const done = (r as any).subtasks.filter((s: any) => s.done).length;
              const total = (r as any)._count.subtasks;
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <div style={{ flex: 1, background: "rgba(255,255,255,0.1)", borderRadius: 999, height: 4 }}>
                    <div style={{ height: "100%", borderRadius: 999, width: `${Math.round((done/total)*100)}%`, background: done === total ? "rgba(34,197,94,0.7)" : "rgba(var(--a1),0.7)" }} />
                  </div>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{done}/{total} subtareas</span>
                </div>
              );
            })()}
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/45">{r.createdBy.name}</p>
              <div className="flex items-center gap-3">
                {r._count.comments > 0 && <span className="text-xs text-white/45">{r._count.comments} coments.</span>}
                <span className="text-xs text-white/45">{new Date(r.createdAt).toLocaleDateString("es-AR")}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-sm text-white/50">
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} de {total} solicitudes
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <Link href={buildPageUrl(page - 1)} style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "10px", padding: "6px 14px", color: "white", fontSize: "13px", fontWeight: 600,
              }}>
                ← Anterior
              </Link>
            )}
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "..." ? (
                    <span key={`ellipsis-${i}`} className="text-white/40 px-1 text-sm">…</span>
                  ) : (
                    <Link key={p} href={buildPageUrl(p as number)} style={{
                      background: p === page ? "rgba(var(--a1),0.7)" : "rgba(255,255,255,0.12)",
                      border: `1px solid ${p === page ? "rgba(var(--a1),0.9)" : "rgba(255,255,255,0.2)"}`,
                      borderRadius: "8px", padding: "5px 10px", color: "white",
                      fontSize: "13px", fontWeight: p === page ? 700 : 500, minWidth: "32px", textAlign: "center",
                    }}>
                      {p}
                    </Link>
                  )
                )}
            </div>
            {page < totalPages && (
              <Link href={buildPageUrl(page + 1)} style={{
                background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
                borderRadius: "10px", padding: "6px 14px", color: "white", fontSize: "13px", fontWeight: 600,
              }}>
                Siguiente →
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

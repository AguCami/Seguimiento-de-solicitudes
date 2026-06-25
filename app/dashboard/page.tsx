import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";

function buildWhere(userId: string, role: string, sector?: string) {
  const where: any = {};
  if (role === "SOLICITANTE" || role === "EDITOR" || role === "GESTOR") {
    where.OR = [{ createdById: userId }, { collaborators: { some: { userId } } }];
  }
  if (role === "RESPONSABLE" && sector) where.sector = { name: sector };
  return where;
}

async function getStats(userId: string, role: string, sector?: string) {
  const where = buildWhere(userId, role, sector);

  const [total, pendiente, en_progreso, resuelto] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.count({ where: { ...where, status: "PENDIENTE" } }),
    prisma.request.count({ where: { ...where, status: "EN_PROGRESO" } }),
    prisma.request.count({ where: { ...where, status: "RESUELTO" } }),
  ]);
  return { total, pendiente, en_progreso, resuelto };
}

async function getRecentRequests(userId: string, role: string, sector?: string) {
  const where = buildWhere(userId, role, sector);

  return prisma.request.findMany({
    where,
    include: { sector: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

const cardStyles = [
  { icon: "◈", gradient: "linear-gradient(135deg, rgba(99,102,241,0.6), rgba(139,92,246,0.6))" },
  { icon: "◉", gradient: "linear-gradient(135deg, rgba(251,191,36,0.6), rgba(245,158,11,0.6))" },
  { icon: "◎", gradient: "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(168,85,247,0.5))" },
  { icon: "◍", gradient: "linear-gradient(135deg, rgba(52,211,153,0.6), rgba(16,185,129,0.6))" },
];

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;
  const stats = await getStats(user.id, user.role, user.sector);
  const recent = await getRecentRequests(user.id, user.role, user.sector);

  const cards = [
    { label: "Total", value: stats.total, ...cardStyles[0] },
    { label: "Pendientes", value: stats.pendiente, ...cardStyles[1] },
    { label: "En progreso", value: stats.en_progreso, ...cardStyles[2] },
    { label: "Resueltos", value: stats.resuelto, ...cardStyles[3] },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white drop-shadow">Bienvenido, {user.name}</h1>
          <p className="text-white/65 text-sm mt-1">Resumen de solicitudes</p>
        </div>
        <Link href="/dashboard/requests/new" className="btn-glass-primary px-4 py-2 text-sm">
          + Nueva solicitud
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} style={{
            background: "rgba(255,255,255,0.15)",
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: "1px solid rgba(255,255,255,0.3)",
            boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
          }} className="rounded-2xl p-5">
            <div style={{ background: c.gradient, backdropFilter: "blur(10px)" }}
              className="inline-flex w-10 h-10 rounded-xl items-center justify-center mb-3 shadow-md">
              <span className="text-white text-lg font-bold">{c.value}</span>
            </div>
            <p className="text-white/70 text-sm">{c.label}</p>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
      }} className="rounded-2xl overflow-hidden">
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }} className="px-6 py-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">Solicitudes recientes</h2>
          <Link href="/dashboard/requests" className="text-sm text-white/70 hover:text-white transition">Ver todas →</Link>
        </div>
        <div>
          {recent.length === 0 && (
            <p className="px-6 py-8 text-center text-white/50">No hay solicitudes todavía</p>
          )}
          {recent.map((r, i) => (
            <Link key={r.id} href={`/dashboard/requests/${r.id}`}
              style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.1)" : "none" }}
              className="flex items-center justify-between px-6 py-4 hover:bg-white/10 transition glass-row">
              <div>
                <p className="font-medium text-white text-sm">{r.title}</p>
                <p className="text-xs text-white/50 mt-0.5">{r.sector.name} · {r.createdBy.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <PriorityBadge priority={r.priority} />
                <StatusBadge status={r.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

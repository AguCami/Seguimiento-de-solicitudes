import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";

async function getStats(userId: string, role: string, sector?: string) {
  const where: any = {};
  if (role === "SOLICITANTE") where.createdById = userId;
  if (role === "RESPONSABLE" && sector) where.sector = { name: sector };

  const [total, pendiente, en_progreso, resuelto] = await Promise.all([
    prisma.request.count({ where }),
    prisma.request.count({ where: { ...where, status: "PENDIENTE" } }),
    prisma.request.count({ where: { ...where, status: "EN_PROGRESO" } }),
    prisma.request.count({ where: { ...where, status: "RESUELTO" } }),
  ]);
  return { total, pendiente, en_progreso, resuelto };
}

async function getRecentRequests(userId: string, role: string, sector?: string) {
  const where: any = {};
  if (role === "SOLICITANTE") where.createdById = userId;
  if (role === "RESPONSABLE" && sector) where.sector = { name: sector };

  return prisma.request.findMany({
    where,
    include: { sector: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5,
  });
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const user = session!.user as any;
  const stats = await getStats(user.id, user.role, user.sector);
  const recent = await getRecentRequests(user.id, user.role, user.sector);

  const cards = [
    { label: "Total", value: stats.total, color: "bg-blue-500" },
    { label: "Pendientes", value: stats.pendiente, color: "bg-yellow-500" },
    { label: "En progreso", value: stats.en_progreso, color: "bg-indigo-500" },
    { label: "Resueltos", value: stats.resuelto, color: "bg-green-500" },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Bienvenido, {user.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Resumen de solicitudes</p>
        </div>
        <Link href="/dashboard/requests/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Nueva solicitud
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className={`inline-flex w-10 h-10 rounded-lg ${c.color} items-center justify-center mb-3`}>
              <span className="text-white text-lg font-bold">{c.value}</span>
            </div>
            <p className="text-gray-500 text-sm">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-700">Solicitudes recientes</h2>
          <Link href="/dashboard/requests" className="text-sm text-blue-600 hover:underline">Ver todas</Link>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.length === 0 && (
            <p className="px-6 py-8 text-center text-gray-400">No hay solicitudes todavía</p>
          )}
          {recent.map((r) => (
            <Link key={r.id} href={`/dashboard/requests/${r.id}`} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
              <div>
                <p className="font-medium text-gray-800 text-sm">{r.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{r.sector.name} · {r.createdBy.name}</p>
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

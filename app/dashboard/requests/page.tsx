import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { StatusBadge } from "@/components/StatusBadge";
import { PriorityBadge } from "@/components/PriorityBadge";

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

  const statuses = ["PENDIENTE", "EN_PROGRESO", "RESUELTO", "CANCELADO"];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Solicitudes</h1>
        <Link href="/dashboard/requests/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          + Nueva solicitud
        </Link>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Estado</label>
          <select
            defaultValue={status ?? ""}
            onChange={(e) => {
              const url = new URL(window.location.href);
              if (e.target.value) url.searchParams.set("status", e.target.value);
              else url.searchParams.delete("status");
              window.location.href = url.toString();
            }}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        {user.role === "ADMIN" && (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Sector</label>
            <select
              defaultValue={sectorId ?? ""}
              onChange={(e) => {
                const url = new URL(window.location.href);
                if (e.target.value) url.searchParams.set("sectorId", e.target.value);
                else url.searchParams.delete("sectorId");
                window.location.href = url.toString();
              }}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los sectores</option>
              {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-100">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Solicitud</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prioridad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comentarios</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {requests.length === 0 && (
              <tr><td colSpan={6} className="px-6 py-10 text-center text-gray-400">No hay solicitudes</td></tr>
            )}
            {requests.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4">
                  <Link href={`/dashboard/requests/${r.id}`} className="font-medium text-gray-800 hover:text-blue-600 text-sm">{r.title}</Link>
                  <p className="text-xs text-gray-400 mt-0.5">{r.createdBy.name}</p>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{r.sector.name}</td>
                <td className="px-6 py-4"><PriorityBadge priority={r.priority} /></td>
                <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                <td className="px-6 py-4 text-xs text-gray-400">{new Date(r.createdAt).toLocaleDateString("es-AR")}</td>
                <td className="px-6 py-4 text-sm text-gray-500">{r._count.comments}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

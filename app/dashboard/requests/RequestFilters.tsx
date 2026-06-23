"use client";
import { useRouter, useSearchParams } from "next/navigation";

type Sector = { id: string; name: string };

const statuses = ["PENDIENTE", "EN_PROGRESO", "RESUELTO", "CANCELADO"];

export function RequestFilters({ sectors, isAdmin }: { sectors: Sector[]; isAdmin: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    router.push(`/dashboard/requests?${params.toString()}`);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-wrap gap-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">Estado</label>
        <select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>
      {isAdmin && (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Sector</label>
          <select
            defaultValue={searchParams.get("sectorId") ?? ""}
            onChange={(e) => update("sectorId", e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los sectores</option>
            {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

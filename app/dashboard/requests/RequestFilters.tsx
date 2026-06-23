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
    <div style={{
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.25)",
    }} className="rounded-2xl p-4 mb-5 flex flex-wrap gap-4">
      <div>
        <label className="block text-xs text-white/60 mb-1 font-medium">Estado</label>
        <select
          defaultValue={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
          className="glass-input px-3 py-1.5 text-sm pr-8"
        >
          <option value="">Todos</option>
          {statuses.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>
      {isAdmin && (
        <div>
          <label className="block text-xs text-white/60 mb-1 font-medium">Sector</label>
          <select
            defaultValue={searchParams.get("sectorId") ?? ""}
            onChange={(e) => update("sectorId", e.target.value)}
            className="glass-input px-3 py-1.5 text-sm pr-8"
          >
            <option value="">Todos los sectores</option>
            {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}

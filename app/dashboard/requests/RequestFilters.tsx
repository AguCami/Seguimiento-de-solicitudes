"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Sector = { id: string; name: string };

const statuses = ["PENDIENTE", "EN_PROGRESO", "RESUELTO", "CANCELADO"];
const statusLabel: Record<string, string> = {
  PENDIENTE: "Pendiente", EN_PROGRESO: "En progreso", RESUELTO: "Resuelto", CANCELADO: "Cancelado",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "10px",
  padding: "6px 10px",
  fontSize: "13px",
  color: "white",
  outline: "none",
  colorScheme: "dark",
};

export function RequestFilters({ sectors, isAdmin }: { sectors: Sector[]; isAdmin: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`/dashboard/requests?${params.toString()}`));
  }

  function handleSearchKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") update("q", search);
  }

  function clearAll() {
    setSearch("");
    startTransition(() => router.push("/dashboard/requests"));
  }

  const hasFilters = !!(
    searchParams.get("status") || searchParams.get("sectorId") ||
    searchParams.get("q") || searchParams.get("dateFrom") || searchParams.get("dateTo")
  );

  return (
    <div style={{
      background: "rgba(255,255,255,0.12)",
      backdropFilter: "blur(16px)",
      WebkitBackdropFilter: "blur(16px)",
      border: "1px solid rgba(255,255,255,0.25)",
    }} className="rounded-2xl p-4 mb-5 flex flex-wrap gap-3 items-end">

      {/* Search */}
      <div className="flex-1 min-w-[180px]">
        <label className="block text-xs text-white/60 mb-1 font-medium">Buscar</label>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40 pointer-events-none"
            fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={handleSearchKey}
            onBlur={() => update("q", search)}
            placeholder="Título o descripción..."
            className="glass-input w-full pl-8 pr-3 py-1.5 text-sm"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-xs text-white/60 mb-1 font-medium">Estado</label>
        <select
          value={searchParams.get("status") ?? ""}
          onChange={(e) => update("status", e.target.value)}
          className="glass-input px-3 py-1.5 text-sm"
        >
          <option value="">Todos</option>
          {statuses.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}
        </select>
      </div>

      {/* Sector (admin only) */}
      {isAdmin && (
        <div>
          <label className="block text-xs text-white/60 mb-1 font-medium">Sector</label>
          <select
            value={searchParams.get("sectorId") ?? ""}
            onChange={(e) => update("sectorId", e.target.value)}
            className="glass-input px-3 py-1.5 text-sm"
          >
            <option value="">Todos los sectores</option>
            {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
      )}

      {/* Date range */}
      <div>
        <label className="block text-xs text-white/60 mb-1 font-medium">Desde</label>
        <input
          type="date"
          value={searchParams.get("dateFrom") ?? ""}
          onChange={(e) => update("dateFrom", e.target.value)}
          style={inputStyle}
        />
      </div>
      <div>
        <label className="block text-xs text-white/60 mb-1 font-medium">Hasta</label>
        <input
          type="date"
          value={searchParams.get("dateTo") ?? ""}
          onChange={(e) => update("dateTo", e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Clear */}
      {hasFilters && (
        <button onClick={clearAll} style={{
          background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: "10px", padding: "6px 12px", color: "rgba(255,255,255,0.7)",
          fontSize: "12px", fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
        }}>
          Limpiar filtros
        </button>
      )}
    </div>
  );
}

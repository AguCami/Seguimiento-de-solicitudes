"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Sector = { id: string; name: string };

export default function NewRequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/sectors").then((r) => r.json()).then(setSectors);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sectorId) { setError("Seleccioná un sector"); return; }
    setLoading(true);
    setError("");
    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, sectorId, priority, startDate: startDate || undefined, endDate: endDate || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      router.push(`/dashboard/requests/${data.id}`);
    } else {
      setError("Error al crear la solicitud");
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white drop-shadow mb-6">Nueva solicitud</h1>

      <div style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 8px 32px rgba(31,38,135,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
      }} className="rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100}
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="Describí brevemente la solicitud" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Descripción *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5}
              className="glass-input w-full px-4 py-2.5 text-sm resize-none"
              placeholder="Detallá la solicitud..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Sector destino *</label>
              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm">
                <option value="">Seleccionar sector</option>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm">
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fecha de inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fecha de fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm" />
            </div>
          </div>

          {error && (
            <p style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
              className="text-red-200 text-sm px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-glass-primary px-6 py-2.5 text-sm">
              {loading ? "Enviando..." : "Crear solicitud"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-glass px-6 py-2.5 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

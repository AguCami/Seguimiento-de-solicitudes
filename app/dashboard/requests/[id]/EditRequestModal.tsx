"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

type Sector = { id: string; name: string };

type Request = {
  id: string; title: string; description: string;
  sectorId: string; priority: string;
  startDate: string | null; endDate: string | null;
};

export function EditRequestModal({ request, onClose }: { request: Request; onClose: () => void }) {
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [sectorId, setSectorId] = useState(request.sectorId);
  const [priority, setPriority] = useState(request.priority);
  const [startDate, setStartDate] = useState(request.startDate ? request.startDate.slice(0, 10) : "");
  const [endDate, setEndDate] = useState(request.endDate ? request.endDate.slice(0, 10) : "");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetch("/api/sectors").then((r) => r.json()).then(setSectors);
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, sectorId, priority, startDate: startDate || null, endDate: endDate || null }),
    });
    setLoading(false);
    if (res.ok) { router.refresh(); onClose(); }
    else { setError("Error al guardar los cambios"); }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4"
      style={{ background: "rgba(10,10,30,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(200,200,240,0.6)",
        boxShadow: "0 20px 60px rgba(31,38,135,0.35)",
      }} className="rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div style={{ borderBottom: "1px solid rgba(100,100,180,0.15)" }} className="flex items-center justify-between p-6">
          <h2 className="text-lg font-bold" style={{ color: "#1a1a3e" }}>Editar solicitud</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition">✕</button>
        </div>
        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Descripción *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Sector</label>
              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50">
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50">
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Fecha de inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Fecha de fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
            </div>
          </div>
          {error && (
            <p className="text-red-600 text-sm px-3 py-2 rounded-xl bg-red-50 border border-red-200">{error}</p>
          )}
          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-glass-primary flex-1 py-2 text-sm">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

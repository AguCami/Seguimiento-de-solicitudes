"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type Sector = { id: string; name: string };

type Request = {
  id: string; title: string; description: string;
  sectorId: string; priority: string;
  startDate: string | null; endDate: string | null;
};

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50";
const labelCls = "block text-xs font-semibold mb-1";
const labelStyle = { color: "rgba(20,20,60,0.7)" } as React.CSSProperties;

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
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetch("/api/sectors").then((r) => r.json()).then(setSectors);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
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

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed",
        top: 0, left: 0, right: 0, bottom: 0,
        width: "100vw", height: "100vh",
        zIndex: 9999,
        background: "rgba(10,10,40,0.65)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 24px 64px rgba(31,38,135,0.3)",
        width: "100%",
        maxWidth: "520px",
        maxHeight: "90vh",
        overflowY: "auto",
        border: "1px solid rgba(200,200,240,0.5)",
      }}>
        <div style={{ borderBottom: "1px solid #eef0f8", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1a1a3e" }}>Editar solicitud</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#9ca3af", lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label className={labelCls} style={labelStyle}>Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Descripción *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
              className={inputCls + " resize-none"} style={{ display: "block" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className={labelCls} style={labelStyle}>Sector</label>
              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} className={inputCls}>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputCls}>
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div>
              <label className={labelCls} style={labelStyle}>Fecha de inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls} style={labelStyle}>Fecha de fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
            </div>
          </div>
          {error && (
            <p style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", margin: 0 }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
            <button type="submit" disabled={loading} className="btn-glass-primary" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={onClose}
              style={{ padding: "10px 18px", fontSize: "14px", borderRadius: "12px", border: "1px solid #e5e7eb", background: "#fff", color: "#6b7280", cursor: "pointer" }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

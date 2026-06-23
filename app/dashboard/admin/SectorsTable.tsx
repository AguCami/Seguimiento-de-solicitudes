"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type Sector = { id: string; name: string; description: string | null };

function EditSectorModal({ sector, onClose }: { sector: Sector; onClose: () => void }) {
  const [name, setName] = useState(sector.name);
  const [description, setDescription] = useState(sector.description ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/sectors/${sector.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setLoading(false);
    if (res.ok) { router.refresh(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar"); }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar el sector "${sector.name}"? Solo es posible si no tiene solicitudes.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/sectors/${sector.id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) { router.refresh(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al eliminar"); }
  }

  const inputStyle: React.CSSProperties = {
    background: "rgba(255,255,255,0.25)", border: "1px solid rgba(255,255,255,0.45)",
    borderRadius: "12px", padding: "10px 14px", fontSize: "14px", color: "white",
    outline: "none", width: "100%", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
    color: "rgba(255,255,255,0.85)", textTransform: "uppercase",
  };

  return createPortal(
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      width: "100vw", height: "100vh", zIndex: 9999,
      background: "rgba(10,5,30,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.22)", backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(255,255,255,0.4)",
        borderRadius: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        width: "100%", maxWidth: "420px",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.25)" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white" }}>Editar sector</h2>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "white", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>
        <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Nombre *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required style={inputStyle} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={labelStyle}>Descripción</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} style={inputStyle} placeholder="Opcional" />
          </div>
          {error && (
            <p style={{ color: "#fca5a5", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px", padding: "10px 14px", fontSize: "13px", margin: 0 }}>{error}</p>
          )}
          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={loading} className="btn-glass-primary" style={{ flex: 1, padding: "11px", fontSize: "14px" }}>
              {loading ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={handleDelete} disabled={loading} style={{
              padding: "11px 16px", fontSize: "14px", borderRadius: "12px",
              background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.45)",
              color: "#fca5a5", cursor: "pointer",
            }}>
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function SectorsTable({ sectors }: { sectors: Sector[] }) {
  const [editing, setEditing] = useState<Sector | null>(null);

  return (
    <>
      {sectors.length === 0 && (
        <p className="text-white/50 text-sm text-center py-6">No hay sectores</p>
      )}

      {/* Desktop */}
      <table className="hidden md:table min-w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)" }}>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Descripción</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sectors.map((s, i) => (
            <tr key={s.id} style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }} className="hover:bg-white/10 transition">
              <td className="px-6 py-3 text-sm font-medium text-white">{s.name}</td>
              <td className="px-6 py-3 text-sm text-white/60">{s.description ?? "-"}</td>
              <td className="px-6 py-3">
                <button onClick={() => setEditing(s)} style={{
                  background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)",
                  borderRadius: "999px", padding: "3px 10px", color: "white", fontSize: "11px", fontWeight: 700, cursor: "pointer",
                }}>Editar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile */}
      <div className="md:hidden divide-y" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {sectors.map((s) => (
          <div key={s.id} style={{ borderColor: "rgba(255,255,255,0.1)" }} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white">{s.name}</p>
              {s.description && <p className="text-xs text-white/50">{s.description}</p>}
            </div>
            <button onClick={() => setEditing(s)} style={{
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: "999px", padding: "4px 12px", color: "white", fontSize: "12px", fontWeight: 700, cursor: "pointer", flexShrink: 0,
            }}>Editar</button>
          </div>
        ))}
      </div>

      {editing && <EditSectorModal sector={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

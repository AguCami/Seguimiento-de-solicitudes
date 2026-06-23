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

const fieldStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "6px",
};
const labelStyle: React.CSSProperties = {
  fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em",
  color: "rgba(255,255,255,0.85)", textTransform: "uppercase",
};
const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.25)",
  border: "1px solid rgba(255,255,255,0.45)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "white",
  outline: "none",
  width: "100%",
  backdropFilter: "blur(8px)",
  WebkitBackdropFilter: "blur(8px)",
  boxSizing: "border-box",
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
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        width: "100vw", height: "100vh", zIndex: 9999,
        background: "rgba(10,5,30,0.7)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "16px",
      }}
    >
      <div style={{
        background: "rgba(255,255,255,0.22)",
        backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.4)",
        borderRadius: "24px",
        boxShadow: "0 32px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        width: "100%", maxWidth: "520px",
        maxHeight: "90vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.25)",
        }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "white", letterSpacing: "-0.02em", textShadow: "0 1px 4px rgba(0,0,0,0.2)" }}>
            Editar solicitud
          </h2>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)",
            borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer",
            color: "white", fontSize: "16px", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "18px" }}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required style={inputStyle}
              onFocus={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.6)"; e.target.style.background = "rgba(255,255,255,0.22)"; }}
              onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.3)"; e.target.style.background = "rgba(255,255,255,0.15)"; }} />
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>Descripción *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={4}
              style={{ ...inputStyle, resize: "none" }}
              onFocus={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.6)"; e.target.style.background = "rgba(255,255,255,0.22)"; }}
              onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.3)"; e.target.style.background = "rgba(255,255,255,0.15)"; }} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Sector</label>
              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} style={inputStyle}>
                {sectors.map((s) => <option key={s.id} value={s.id} style={{ background: "#3b3ab5", color: "white" }}>{s.name}</option>)}
              </select>
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={inputStyle}>
                {["BAJA","MEDIA","ALTA","URGENTE"].map(p => (
                  <option key={p} value={p} style={{ background: "#3b3ab5", color: "white" }}>
                    {p[0] + p.slice(1).toLowerCase()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Fecha de inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={inputStyle}
                onFocus={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.6)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.3)"; }} />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Fecha de fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={inputStyle}
                onFocus={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.6)"; }}
                onBlur={(e) => { e.target.style.border = "1px solid rgba(255,255,255,0.3)"; }} />
            </div>
          </div>

          {error && (
            <p style={{
              color: "#fca5a5", background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px",
              padding: "10px 14px", fontSize: "13px", margin: 0,
            }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "10px", paddingTop: "4px" }}>
            <button type="submit" disabled={loading} className="btn-glass-primary"
              style={{ flex: 1, padding: "12px", fontSize: "14px" }}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={onClose} style={{
              padding: "12px 20px", fontSize: "14px", borderRadius: "12px",
              background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)",
              color: "rgba(255,255,255,0.8)", cursor: "pointer",
            }}>
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

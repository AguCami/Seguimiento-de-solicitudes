"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; role: string; sector: string | null };
type Sector = { id: string; name: string };

const inputCls = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50";
const labelCls = "block text-xs font-semibold mb-1";
const labelStyle = { color: "rgba(20,20,60,0.7)" } as React.CSSProperties;

export function EditUserModal({ user, sectors, onClose }: { user: User; sectors: Sector[]; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [sector, setSector] = useState(user.sector ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, role, sector: sector || undefined, password: password || undefined }),
    });
    setLoading(false);
    if (res.ok) { router.refresh(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al guardar"); }
  }

  async function handleDelete() {
    if (!confirm(`¿Eliminar a ${user.name}? Esta acción no se puede deshacer.`)) return;
    setLoading(true);
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    setLoading(false);
    if (res.ok) { router.refresh(); onClose(); }
    else { const d = await res.json(); setError(d.error ?? "Error al eliminar"); }
  }

  const modal = (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(10,10,40,0.6)",
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
        maxWidth: "440px",
        maxHeight: "90vh",
        overflowY: "auto",
        border: "1px solid rgba(200,200,240,0.5)",
      }}>
        <div style={{ borderBottom: "1px solid #eef0f8", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1a1a3e" }}>Editar usuario</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#9ca3af", lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className={labelCls} style={labelStyle}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls} style={labelStyle}>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)} className={inputCls}>
              <option value="SOLICITANTE">Solicitante</option>
              <option value="RESPONSABLE">Responsable de sector</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {role === "RESPONSABLE" && (
            <div>
              <label className={labelCls} style={labelStyle}>Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className={inputCls}>
                <option value="">Seleccionar sector</option>
                {sectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className={labelCls} style={labelStyle}>
              Nueva contraseña <span style={{ fontWeight: 400, color: "#9ca3af" }}>(vacío = sin cambios)</span>
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className={inputCls} />
          </div>

          {error && (
            <p style={{ color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", margin: 0 }}>{error}</p>
          )}

          <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
            <button type="submit" disabled={loading} className="btn-glass-primary" style={{ flex: 1, padding: "10px", fontSize: "14px" }}>
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={handleDelete} disabled={loading}
              style={{ padding: "10px 18px", fontSize: "14px", borderRadius: "12px", border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", cursor: "pointer" }}>
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

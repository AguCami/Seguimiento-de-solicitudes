"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; role: string; sector: string | null; avatarUrl: string | null };
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
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = new FormData();
    form.append("name", name);
    form.append("email", email);
    form.append("role", role);
    form.append("sector", sector);
    if (password) form.append("password", password);
    if (avatarFile) form.append("avatar", avatarFile);

    const res = await fetch(`/api/admin/users/${user.id}`, { method: "PATCH", body: form });
    setLoading(false);
    if (res.ok) {
      // Invalidate navbar avatar cache for this user
      try { sessionStorage.removeItem(`avatar_${user.id}`); } catch {}
      router.refresh();
      onClose();
    } else {
      const d = await res.json();
      setError(d.error ?? "Error al guardar");
    }
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
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        width: "100vw", height: "100vh", zIndex: 9999,
        background: "rgba(10,10,40,0.65)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
      }}
    >
      <div style={{
        background: "#fff", borderRadius: "20px",
        boxShadow: "0 24px 64px rgba(31,38,135,0.3)",
        width: "100%", maxWidth: "460px", maxHeight: "90vh", overflowY: "auto",
        border: "1px solid rgba(200,200,240,0.5)",
      }}>
        <div style={{ borderBottom: "1px solid #eef0f8", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#1a1a3e" }}>Editar usuario</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px", color: "#9ca3af", lineHeight: 1 }}>✕</button>
        </div>

        <form onSubmit={handleSave} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "14px" }}>

          {/* Avatar */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", flexShrink: 0 }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt={name}
                  style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: "3px solid #e0e7ff" }} />
              ) : (
                <div style={{
                  width: 72, height: 72, borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 28, fontWeight: 700, color: "white",
                  border: "3px solid #e0e7ff",
                }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  position: "absolute", bottom: 0, right: 0,
                  width: 24, height: 24, borderRadius: "50%",
                  background: "#6366f1", border: "2px solid white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg width="11" height="11" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", margin: "0 0 2px" }}>{name || "Nombre del usuario"}</p>
              <p style={{ fontSize: 11, color: "#9ca3af", margin: "0 0 8px" }}>{email}</p>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                style={{
                  fontSize: 12, color: "#6366f1", background: "#eef2ff",
                  border: "1px solid #c7d2fe", borderRadius: 8,
                  padding: "4px 10px", cursor: "pointer", fontWeight: 600,
                }}
              >
                {avatarPreview ? "Cambiar foto" : "Subir foto"}
              </button>
              {avatarFile && (
                <button
                  type="button"
                  onClick={() => { setAvatarFile(null); setAvatarPreview(user.avatarUrl); if (fileRef.current) fileRef.current.value = ""; }}
                  style={{ fontSize: 11, color: "#9ca3af", background: "none", border: "none", cursor: "pointer", marginLeft: 8 }}
                >
                  Cancelar
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
          </div>

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
              <option value="EDITOR">Editor</option>
              <option value="GESTOR">Gestor (admin sin ver solicitudes ajenas)</option>
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

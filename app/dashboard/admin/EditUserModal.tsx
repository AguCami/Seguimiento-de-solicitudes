"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; email: string; role: string; sector: string | null };
type Sector = { id: string; name: string };

export function EditUserModal({ user, sectors, onClose }: { user: User; sectors: Sector[]; onClose: () => void }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [sector, setSector] = useState(user.sector ?? "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

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

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4"
      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)" }}>
      <div style={{
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "0 8px 32px rgba(31,38,135,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
      }} className="rounded-2xl w-full max-w-md">
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.2)" }} className="flex items-center justify-between p-6">
          <h2 className="text-lg font-bold text-white">Editar usuario</h2>
          <button onClick={onClose} className="text-white/50 hover:text-white text-xl transition">✕</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="glass-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="glass-input w-full px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="glass-input w-full px-3 py-2 text-sm">
              <option value="SOLICITANTE">Solicitante</option>
              <option value="RESPONSABLE">Responsable de sector</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {role === "RESPONSABLE" && (
            <div>
              <label className="block text-xs font-medium text-white/70 mb-1">Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)}
                className="glass-input w-full px-3 py-2 text-sm">
                <option value="">Seleccionar sector</option>
                {sectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1">
              Nueva contraseña <span className="text-white/40">(dejar vacío para no cambiar)</span>
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" className="glass-input w-full px-3 py-2 text-sm" />
          </div>

          {error && (
            <p style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
              className="text-red-200 text-sm px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-glass-primary flex-1 py-2 text-sm">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={handleDelete} disabled={loading}
              style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.35)", color: "#fca5a5" }}
              className="px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-500/30 transition disabled:opacity-50">
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

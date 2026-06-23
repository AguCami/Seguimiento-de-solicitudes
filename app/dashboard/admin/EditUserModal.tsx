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
    <div className="fixed inset-0 flex items-center justify-center z-[100] p-4"
      style={{ background: "rgba(10,10,30,0.55)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)" }}>
      <div style={{
        background: "rgba(255,255,255,0.92)",
        border: "1px solid rgba(200,200,240,0.6)",
        boxShadow: "0 20px 60px rgba(31,38,135,0.35)",
      }} className="rounded-2xl w-full max-w-md">
        <div style={{ borderBottom: "1px solid rgba(100,100,180,0.15)" }} className="flex items-center justify-between p-6">
          <h2 className="text-lg font-bold" style={{ color: "#1a1a3e" }}>Editar usuario</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl transition">✕</button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Rol</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50">
              <option value="SOLICITANTE">Solicitante</option>
              <option value="RESPONSABLE">Responsable de sector</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          {role === "RESPONSABLE" && (
            <div>
              <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>Sector</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50">
                <option value="">Seleccionar sector</option>
                {sectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: "rgba(20,20,60,0.7)" }}>
              Nueva contraseña <span className="font-normal text-gray-400">(dejar vacío para no cambiar)</span>
            </label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-gray-50" />
          </div>

          {error && (
            <p className="text-red-600 text-sm px-3 py-2 rounded-xl bg-red-50 border border-red-200">{error}</p>
          )}

          <div className="flex gap-2 pt-2">
            <button type="submit" disabled={loading} className="btn-glass-primary flex-1 py-2 text-sm">
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>
            <button type="button" onClick={handleDelete} disabled={loading}
              className="px-4 py-2 rounded-xl text-sm font-medium border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition disabled:opacity-50">
              Eliminar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

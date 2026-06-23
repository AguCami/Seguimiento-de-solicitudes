"use client";
import { useState } from "react";
import { EditUserModal } from "./EditUserModal";

type User = { id: string; name: string; email: string; role: string; sector: string | null };
type Sector = { id: string; name: string };

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  RESPONSABLE: "Responsable",
  SOLICITANTE: "Solicitante",
};

export function UsersTable({ users, sectors }: { users: User[]; sectors: Sector[] }) {
  const [editing, setEditing] = useState<User | null>(null);

  return (
    <>
      {/* Desktop table */}
      <table className="hidden md:table min-w-full">
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.08)" }}>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Email</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Rol</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Sector</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-white/60 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u, i) => (
            <tr key={u.id}
              style={{ borderTop: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none" }}
              className="hover:bg-white/10 transition glass-row">
              <td className="px-6 py-3 text-sm font-medium text-white">{u.name}</td>
              <td className="px-6 py-3 text-sm text-white/65">{u.email}</td>
              <td className="px-6 py-3 text-sm text-white/65">{roleLabel[u.role] ?? u.role}</td>
              <td className="px-6 py-3 text-sm text-white/65">{u.sector ?? "-"}</td>
              <td className="px-6 py-3">
                <button onClick={() => setEditing(u)}
                  className="text-xs text-white font-medium hover:text-white/70 underline underline-offset-2 transition">
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="md:hidden divide-y" style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
        {users.map((u) => (
          <div key={u.id} style={{ borderColor: "rgba(255,255,255,0.1)" }}
            className="px-4 py-4 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-white truncate">{u.name}</p>
              <p className="text-xs text-white/50 truncate">{u.email}</p>
              <p className="text-xs text-white/60 mt-0.5">
                {roleLabel[u.role] ?? u.role}{u.sector ? ` · ${u.sector}` : ""}
              </p>
            </div>
            <button onClick={() => setEditing(u)} style={{
              background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.35)",
              borderRadius: "999px", padding: "4px 12px", color: "white",
              fontSize: "12px", fontWeight: 700, flexShrink: 0,
            }}>
              Editar
            </button>
          </div>
        ))}
      </div>

      {editing && (
        <EditUserModal user={editing} sectors={sectors} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

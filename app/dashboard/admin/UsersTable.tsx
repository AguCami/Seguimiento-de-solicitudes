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
      <table className="min-w-full">
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

      {editing && (
        <EditUserModal user={editing} sectors={sectors} onClose={() => setEditing(null)} />
      )}
    </>
  );
}

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
      <table className="min-w-full divide-y divide-gray-100">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sector</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-gray-50">
              <td className="px-6 py-3 text-sm font-medium text-gray-700">{u.name}</td>
              <td className="px-6 py-3 text-sm text-gray-500">{u.email}</td>
              <td className="px-6 py-3 text-sm text-gray-500">{roleLabel[u.role] ?? u.role}</td>
              <td className="px-6 py-3 text-sm text-gray-500">{u.sector ?? "-"}</td>
              <td className="px-6 py-3">
                <button
                  onClick={() => setEditing(u)}
                  className="text-xs text-blue-600 hover:underline font-medium"
                >
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

"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  RESPONSABLE: "Responsable",
  SOLICITANTE: "Solicitante",
};

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as any;

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-700 text-lg">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        Solicitudes
      </Link>

      <div className="flex items-center gap-6">
        <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-600">Inicio</Link>
        <Link href="/dashboard/requests" className="text-sm text-gray-600 hover:text-blue-600">Solicitudes</Link>
        {user?.role !== "SOLICITANTE" && (
          <Link href="/dashboard/requests/new" className="text-sm text-gray-600 hover:text-blue-600">Nueva</Link>
        )}
        {user?.role === "ADMIN" && (
          <Link href="/dashboard/admin" className="text-sm text-gray-600 hover:text-blue-600">Admin</Link>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-700">{user?.name}</p>
          <p className="text-xs text-gray-500">{roleLabel[user?.role] ?? user?.role}</p>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-sm text-gray-500 hover:text-red-500 transition"
        >
          Salir
        </button>
      </div>
    </nav>
  );
}

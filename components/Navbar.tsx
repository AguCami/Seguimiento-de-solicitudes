"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  RESPONSABLE: "Responsable",
  SOLICITANTE: "Solicitante",
};

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const pathname = usePathname();

  const links = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/dashboard/requests", label: "Solicitudes" },
    { href: "/dashboard/requests/new", label: "Nueva" },
    ...(user?.role === "ADMIN" ? [{ href: "/dashboard/admin", label: "Admin" }] : []),
  ];

  return (
    <nav style={{
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      borderBottom: "1px solid rgba(255,255,255,0.25)",
      boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
    }} className="px-6 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white text-lg drop-shadow">
        <div style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))",
          border: "1px solid rgba(255,255,255,0.4)",
          backdropFilter: "blur(10px)",
        }} className="w-8 h-8 rounded-xl flex items-center justify-center">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        Solicitudes
      </Link>

      <div className="flex items-center gap-1">
        {links.map((l) => (
          <Link key={l.href} href={l.href} style={{
            background: pathname === l.href ? "rgba(255,255,255,0.25)" : "transparent",
            border: pathname === l.href ? "1px solid rgba(255,255,255,0.35)" : "1px solid transparent",
            backdropFilter: pathname === l.href ? "blur(10px)" : "none",
          }} className="text-sm text-white font-medium px-3 py-1.5 rounded-xl transition-all hover:bg-white/20">
            {l.label}
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div style={{
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.25)",
          backdropFilter: "blur(10px)",
        }} className="px-3 py-1.5 rounded-xl text-right">
          <p className="text-sm font-medium text-white leading-tight">{user?.name}</p>
          <p className="text-xs text-white/65">{roleLabel[user?.role] ?? user?.role}</p>
        </div>
        <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
          background: "rgba(255,255,255,0.15)",
          border: "1px solid rgba(255,255,255,0.25)",
        }} className="text-sm text-white/80 hover:text-white px-3 py-1.5 rounded-xl transition-all hover:bg-white/20">
          Salir
        </button>
      </div>
    </nav>
  );
}

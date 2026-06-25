"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { SettingsPanel } from "./SettingsPanel";

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360},55%,45%)`;
}

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  EDITOR: "Editor",
  RESPONSABLE: "Responsable",
  SOLICITANTE: "Solicitante",
};

export function Navbar() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user?.id) return;
    const cacheKey = `avatar_${user.id}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setAvatarUrl(cached === "none" ? null : cached); return; }
    fetch("/api/profile").then(r => r.ok ? r.json() : null).then(d => {
      const url = d?.avatarUrl ?? null;
      sessionStorage.setItem(cacheKey, url ?? "none");
      setAvatarUrl(url);
    });
  }, [user?.id]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    if (userMenuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [userMenuOpen]);

  const links = [
    { href: "/dashboard", label: "Inicio" },
    { href: "/dashboard/requests", label: "Solicitudes" },
    { href: "/dashboard/requests/new", label: "Nueva solicitud" },
    ...(user?.role === "ADMIN" || user?.role === "EDITOR" ? [{ href: "/dashboard/admin", label: "Admin" }] : []),
  ];

  const navStyle = {
    background: "rgba(255,255,255,0.15)",
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    borderBottom: "1px solid rgba(255,255,255,0.25)",
    boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
  };

  return (
    <nav style={navStyle} className="sticky top-0 z-40">
      {/* Main row */}
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-white text-base drop-shadow">
          <div style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))",
            border: "1px solid rgba(255,255,255,0.4)",
            backdropFilter: "blur(10px)",
          }} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <span className="hidden sm:inline">Solicitudes</span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} style={{
              background: pathname === l.href ? "rgba(255,255,255,0.25)" : "transparent",
              border: pathname === l.href ? "1px solid rgba(255,255,255,0.35)" : "1px solid transparent",
            }} className="text-sm text-white font-medium px-3 py-1.5 rounded-xl transition-all hover:bg-white/20">
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Avatar + user dropdown - desktop */}
          <div ref={userMenuRef} className="hidden sm:block relative">
            <button onClick={() => setUserMenuOpen(v => !v)} style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: "14px", padding: "4px 10px 4px 5px",
              display: "flex", alignItems: "center", gap: "8px", cursor: "pointer",
              transition: "background 0.15s",
            }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.12)"; }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.3)" }} />
              ) : (
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: hashColor(user?.name ?? "U"), border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "white", flexShrink: 0 }}>
                  {(user?.name ?? "U")[0].toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] text-white/55">{roleLabel[user?.role] ?? user?.role}</p>
              </div>
              <svg width="10" height="10" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {userMenuOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 8px)", right: 0, zIndex: 9997,
                background: "rgba(20,10,50,0.92)", backdropFilter: "blur(32px)",
                border: "1px solid rgba(255,255,255,0.2)", borderRadius: "14px",
                boxShadow: "0 16px 48px rgba(0,0,0,0.35)", minWidth: "170px", overflow: "hidden",
              }}>
                <Link href="/dashboard/profile" onClick={() => setUserMenuOpen(false)} style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px",
                  color: "rgba(255,255,255,0.85)", fontSize: "13px", fontWeight: 500,
                  borderBottom: "1px solid rgba(255,255,255,0.1)", transition: "background 0.1s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
                  Mi perfil
                </Link>
                <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
                  display: "flex", alignItems: "center", gap: "8px", padding: "10px 14px", width: "100%",
                  background: "none", border: "none", color: "rgba(255,100,100,0.85)", fontSize: "13px",
                  fontWeight: 500, cursor: "pointer", transition: "background 0.1s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(239,68,68,0.1)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = ""; }}
                >
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>

          {/* Settings gear */}
          <SettingsPanel />

          {/* Hamburger - mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2 rounded-xl hover:bg-white/20 transition"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}
          >
            <span style={{ display: "block", width: 18, height: 2, background: "white", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(45deg) translate(3px,3px)" : "none" }} />
            <span style={{ display: "block", width: 18, height: 2, background: "white", borderRadius: 2, opacity: menuOpen ? 0 : 1, transition: "all 0.2s" }} />
            <span style={{ display: "block", width: 18, height: 2, background: "white", borderRadius: 2, transition: "all 0.2s", transform: menuOpen ? "rotate(-45deg) translate(3px,-3px)" : "none" }} />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }} className="md:hidden px-4 pb-4 pt-2 space-y-1">
          {/* User info */}
          <div style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            className="px-4 py-3 rounded-xl mb-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover", border: "1px solid rgba(255,255,255,0.3)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: hashColor(user?.name ?? "U"), border: "1px solid rgba(255,255,255,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "white", flexShrink: 0 }}>
                  {(user?.name ?? "U")[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-white/60">{roleLabel[user?.role] ?? user?.role}</p>
              </div>
            </div>
            <button onClick={() => signOut({ callbackUrl: "/login" })} style={{
              background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            }} className="text-xs text-white px-3 py-1.5 rounded-xl flex-shrink-0">
              Salir
            </button>
          </div>

          {/* Nav links */}
          {[...links, { href: "/dashboard/profile", label: "Mi perfil" }].map((l) => (
            <Link key={l.href} href={l.href}
              onClick={() => setMenuOpen(false)}
              style={{
                background: pathname === l.href ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)",
                border: `1px solid ${pathname === l.href ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)"}`,
              }}
              className="flex items-center text-sm text-white font-medium px-4 py-3 rounded-xl transition-all hover:bg-white/20">
              {l.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

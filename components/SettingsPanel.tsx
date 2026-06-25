"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { EasterEgg } from "./EasterEgg";

const THEMES = [
  { id: "indigo", label: "Índigo",    colors: ["#3b3ab5", "#5b4fcf"] },
  { id: "ocean",  label: "Océano",    colors: ["#1565c0", "#0288d1"] },
  { id: "forest", label: "Bosque",    colors: ["#065f46", "#166534"] },
  { id: "sunset", label: "Atardecer", colors: ["#c2410c", "#ea580c"] },
  { id: "rose",   label: "Rosa",      colors: ["#9d174d", "#a21caf"] },
  { id: "carbon", label: "Carbón",    colors: ["#1e293b", "#334155"] },
  { id: "gold",   label: "Dorado",    colors: ["#78350f", "#d97706"] },
];

function applyTheme(themeId: string) {
  const root = document.documentElement;
  if (themeId === "indigo") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", themeId);
  localStorage.setItem("theme", themeId);
}

export function SettingsPanel() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const isAdmin = user?.role === "ADMIN" || user?.role === "GESTOR";

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gearClicks, setGearClicks] = useState(0);
  const [easterActive, setEasterActive] = useState(false);
  const [activeTheme, setActiveTheme] = useState("indigo");
  const [darkMode, setDarkMode] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [orgName, setOrgName] = useState("Solicitudes");
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoMsg, setLogoMsg] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("theme") ?? "indigo";
    setActiveTheme(saved);
    applyTheme(saved);
    const dm = localStorage.getItem("darkMode") === "true";
    setDarkMode(dm);
    if (dm) document.documentElement.classList.add("dark");
    // Fetch app settings
    fetch("/api/settings").then(r => r.json()).then(s => {
      if (s.logoUrl) setLogoUrl(s.logoUrl);
      if (s.orgName) setOrgName(s.orgName);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleGearClick() {
    setOpen(prev => !prev);
    if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
    clickTimerRef.current = setTimeout(() => setGearClicks(0), 4000);
    setGearClicks(prev => {
      const next = prev + 1;
      if (next >= 10) {
        setOpen(false);
        setEasterActive(true);
        if (clickTimerRef.current) clearTimeout(clickTimerRef.current);
        return 0;
      }
      return next;
    });
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    if (next) document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
    localStorage.setItem("darkMode", String(next));
  }

  function handleThemeChange(id: string) {
    setActiveTheme(id);
    applyTheme(id);
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    setLogoMsg("");
    const form = new FormData();
    form.append("logo", file);
    const res = await fetch("/api/settings", { method: "PATCH", body: form });
    setLogoUploading(false);
    if (res.ok) {
      const data = await res.json();
      setLogoUrl(data.logoUrl);
      setLogoMsg("Logo guardado");
    } else {
      const d = await res.json();
      setLogoMsg(d.error ?? "Error al subir");
    }
  }

  async function handleRemoveLogo() {
    await fetch("/api/settings", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key: "logoUrl" }) });
    setLogoUrl(null);
    setLogoMsg("Logo eliminado");
    if (logoRef.current) logoRef.current.value = "";
  }

  const isHeating = gearClicks >= 6;

  const divider = (
    <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "16px 0" }} />
  );

  const panel = open ? (
    <div ref={panelRef} style={{
      position: "fixed", top: "60px", right: "16px", zIndex: 9998,
      background: "rgba(20,15,50,0.92)",
      backdropFilter: "blur(32px) saturate(180%)",
      WebkitBackdropFilter: "blur(32px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "20px",
      boxShadow: "0 16px 48px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
      width: "300px",
      padding: "20px",
      maxHeight: "calc(100vh - 80px)",
      overflowY: "auto",
    }}>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "18px" }}>
        Configuración
      </p>

      {/* ── Modo oscuro ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>{darkMode ? "🌙" : "☀️"}</span>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>Modo oscuro</p>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", margin: 0 }}>{darkMode ? "Activado" : "Desactivado"}</p>
          </div>
        </div>
        <button onClick={toggleDarkMode} style={{
          width: 44, height: 26, borderRadius: 999, border: "none", cursor: "pointer",
          background: darkMode ? "rgba(102,126,234,0.9)" : "rgba(255,255,255,0.25)",
          position: "relative", transition: "background 0.25s", flexShrink: 0,
        }}>
          <span style={{
            position: "absolute", top: 3, left: darkMode ? 21 : 3,
            width: 20, height: 20, background: "white", borderRadius: "50%",
            transition: "left 0.25s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)", display: "block",
          }} />
        </button>
      </div>

      {divider}

      {/* ── Tema ── */}
      <div>
        <p style={{ fontSize: "13px", fontWeight: 600, color: "white", marginBottom: 12 }}>Tema de color</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
          {THEMES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => handleThemeChange(t.id)}
              title={t.label}
              style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 12,
                background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})`,
                border: activeTheme === t.id
                  ? "2.5px solid white"
                  : "2px solid rgba(255,255,255,0.2)",
                boxShadow: activeTheme === t.id ? "0 0 0 2px rgba(255,255,255,0.3)" : "none",
                transition: "all 0.15s",
                position: "relative",
              }}>
                {activeTheme === t.id && (
                  <svg style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }}
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", fontWeight: 500, whiteSpace: "nowrap" }}>{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {divider}

      {/* ── Logo PDF (admin only) ── */}
      {isAdmin && (
        <div>
          <p style={{ fontSize: "13px", fontWeight: 600, color: "white", marginBottom: 4 }}>Logo en PDF</p>
          <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)", marginBottom: 12 }}>
            Aparece en el encabezado al exportar solicitudes
          </p>

          {logoUrl ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <img src={logoUrl} alt="Logo" style={{ height: 40, maxWidth: 100, objectFit: "contain", borderRadius: 6, background: "rgba(255,255,255,0.1)", padding: 4 }} />
              <div>
                <button
                  type="button"
                  onClick={() => logoRef.current?.click()}
                  style={{ fontSize: 11, color: "rgba(165,180,252,0.9)", background: "none", border: "none", cursor: "pointer", display: "block", marginBottom: 2 }}
                >
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  style={{ fontSize: 11, color: "rgba(252,165,165,0.9)", background: "none", border: "none", cursor: "pointer" }}
                >
                  Eliminar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => logoRef.current?.click()}
              disabled={logoUploading}
              style={{
                width: "100%", padding: "10px", borderRadius: 12, cursor: "pointer",
                background: "rgba(255,255,255,0.08)", border: "2px dashed rgba(255,255,255,0.25)",
                color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 600,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                marginBottom: 8,
              }}
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              {logoUploading ? "Subiendo..." : "Subir logo (PNG/SVG)"}
            </button>
          )}

          <input ref={logoRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden"
            onChange={handleLogoUpload} />

          {logoMsg && (
            <p style={{ fontSize: 11, color: logoMsg.includes("Error") ? "rgba(252,165,165,0.9)" : "rgba(134,239,172,0.9)", marginTop: 4 }}>
              {logoMsg}
            </p>
          )}
        </div>
      )}

      {/* Easter egg hint */}
      {gearClicks >= 6 && (
        <p style={{ fontSize: "10px", color: "rgba(255,200,50,0.6)", textAlign: "center", marginTop: "14px", fontStyle: "italic" }}>
          {10 - gearClicks} más... 👀
        </p>
      )}
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={handleGearClick}
        data-easter-ignore="true"
        title="Configuración"
        style={{
          background: open ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.15)",
          border: `1px solid ${gearClicks >= 6 ? "rgba(255,200,50,0.6)" : "rgba(255,255,255,0.25)"}`,
          borderRadius: "12px",
          width: "36px", height: "36px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", transition: "all 0.2s",
          color: "white",
          animation: isHeating ? "gearSpin 0.4s linear infinite" : undefined,
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {mounted && panel && createPortal(panel, document.body)}
      <EasterEgg active={easterActive} onReset={() => setEasterActive(false)} />
    </>
  );
}

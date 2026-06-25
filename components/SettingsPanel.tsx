"use client";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { EasterEgg } from "./EasterEgg";

export function SettingsPanel() {
  const [open, setOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [gearClicks, setGearClicks] = useState(0);
  const [easterActive, setEasterActive] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("darkMode") === "true";
    setDarkMode(saved);
    if (saved) document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("darkMode", "true");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("darkMode", "false");
    }
  }, [darkMode, mounted]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleGearClick() {
    setOpen(prev => !prev);

    // Reset click timer: must click 10 times within 4s window
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

  // Spinning animation when getting close
  const isHeating = gearClicks >= 6;

  const panel = open ? (
    <div ref={panelRef} style={{
      position: "fixed",
      top: "60px",
      right: "16px",
      zIndex: 9998,
      background: "rgba(30,20,60,0.85)",
      backdropFilter: "blur(32px) saturate(180%)",
      WebkitBackdropFilter: "blur(32px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.25)",
      borderRadius: "20px",
      boxShadow: "0 16px 48px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      width: "260px",
      padding: "20px",
    }}>
      <p style={{ fontSize: "13px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "16px" }}>
        Configuración
      </p>

      {/* Dark mode toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "18px" }}>{darkMode ? "🌙" : "☀️"}</span>
          <div>
            <p style={{ fontSize: "14px", fontWeight: 600, color: "white", margin: 0 }}>Modo oscuro</p>
            <p style={{ fontSize: "11px", color: "rgba(255,255,255,0.45)", margin: 0 }}>{darkMode ? "Activado" : "Desactivado"}</p>
          </div>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            width: "44px", height: "26px", borderRadius: "999px", border: "none", cursor: "pointer",
            background: darkMode ? "rgba(102,126,234,0.9)" : "rgba(255,255,255,0.25)",
            position: "relative", transition: "background 0.25s ease", flexShrink: 0,
          }}
        >
          <span style={{
            position: "absolute", top: "3px",
            left: darkMode ? "21px" : "3px",
            width: "20px", height: "20px",
            background: "white", borderRadius: "50%",
            transition: "left 0.25s ease",
            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
            display: "block",
          }} />
        </button>
      </div>

      {/* Secret hint when heating up */}
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

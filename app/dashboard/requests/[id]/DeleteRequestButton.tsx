"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export function DeleteRequestButton({ requestId }: { requestId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/requests/${requestId}`, { method: "DELETE" });
    router.push("/dashboard/requests");
    router.refresh();
  }

  const modal = confirming ? (
    <div onClick={(e) => { if (e.target === e.currentTarget) setConfirming(false); }} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      width: "100vw", height: "100vh", zIndex: 9999,
      background: "rgba(10,5,30,0.75)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.18)", backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(255,255,255,0.35)",
        borderRadius: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        width: "100%", maxWidth: "380px", padding: "32px 28px", textAlign: "center",
      }}>
        <div style={{
          width: "52px", height: "52px", borderRadius: "50%", margin: "0 auto 16px",
          background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="22" height="22" fill="none" stroke="#fca5a5" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </div>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "white", margin: "0 0 8px" }}>Eliminar solicitud</h3>
        <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.6)", margin: "0 0 24px" }}>
          Esta acción no se puede deshacer. Se eliminarán también los comentarios y archivos adjuntos.
        </p>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => setConfirming(false)} style={{
            flex: 1, padding: "11px", borderRadius: "12px", fontSize: "14px", fontWeight: 600,
            background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)",
            color: "rgba(255,255,255,0.8)", cursor: "pointer",
          }}>
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={loading} style={{
            flex: 1, padding: "11px", borderRadius: "12px", fontSize: "14px", fontWeight: 700,
            background: "rgba(239,68,68,0.6)", border: "1px solid rgba(239,68,68,0.7)",
            color: "white", cursor: "pointer",
          }}>
            {loading ? "Eliminando..." : "Sí, eliminar"}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button onClick={() => setConfirming(true)} style={{
        background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.45)",
        backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
        color: "#fca5a5", padding: "4px 10px", borderRadius: "999px",
        fontSize: "11px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap",
      }}>
        Eliminar
      </button>
      {confirming && createPortal(modal, document.body)}
    </>
  );
}

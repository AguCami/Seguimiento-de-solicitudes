"use client";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";

type User = { id: string; name: string; role: string };
type Collaborator = { id: string; user: { id: string; name: string } };

const roleLabel: Record<string, string> = {
  ADMIN: "Admin", EDITOR: "Editor", RESPONSABLE: "Responsable", SOLICITANTE: "Solicitante",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.4)",
  borderRadius: "12px", padding: "9px 14px", fontSize: "14px", color: "white",
  outline: "none", width: "100%", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
  boxSizing: "border-box",
};

export function ShareRequestModal({
  requestId, collaborators, onClose,
}: {
  requestId: string;
  collaborators: Collaborator[];
  onClose: () => void;
}) {
  const [users, setUsers] = useState<User[]>([]);
  const [collabs, setCollabs] = useState<Collaborator[]>(collaborators);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    fetch("/api/users").then(r => r.json()).then(setUsers);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const collabIds = new Set(collabs.map(c => c.user.id));

  const filtered = users.filter(u =>
    !collabIds.has(u.id) &&
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  async function addCollab(user: User) {
    setLoading(user.id);
    const res = await fetch(`/api/requests/${requestId}/collaborators`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id }),
    });
    setLoading(null);
    if (res.ok) {
      setCollabs(prev => [...prev, { id: user.id, user: { id: user.id, name: user.name } }]);
      setSearch("");
      router.refresh();
    }
  }

  async function removeCollab(userId: string) {
    setLoading(userId);
    await fetch(`/api/requests/${requestId}/collaborators`, {
      method: "DELETE", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    setLoading(null);
    setCollabs(prev => prev.filter(c => c.user.id !== userId));
    router.refresh();
  }

  const modal = (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      width: "100vw", height: "100vh", zIndex: 9999,
      background: "rgba(10,5,30,0.7)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
    }}>
      <div style={{
        background: "rgba(255,255,255,0.2)", backdropFilter: "blur(40px) saturate(180%)",
        WebkitBackdropFilter: "blur(40px) saturate(180%)", border: "1px solid rgba(255,255,255,0.38)",
        borderRadius: "24px", boxShadow: "0 32px 80px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.5)",
        width: "100%", maxWidth: "440px", maxHeight: "85vh", overflowY: "auto",
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.2)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "white" }}>Compartir solicitud</h2>
            <p style={{ margin: "2px 0 0", fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
              Los colaboradores pueden ver y comentar
            </p>
          </div>
          <button onClick={onClose} style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "50%", width: "32px", height: "32px", cursor: "pointer", color: "white", fontSize: "16px", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Current collaborators */}
          {collabs.length > 0 && (
            <div>
              <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                Colaboradores ({collabs.length})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {collabs.map(c => (
                  <div key={c.user.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "8px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(102,126,234,0.5)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "white" }}>
                        {c.user.name[0].toUpperCase()}
                      </div>
                      <span style={{ fontSize: "14px", color: "white", fontWeight: 500 }}>{c.user.name}</span>
                    </div>
                    <button onClick={() => removeCollab(c.user.id)} disabled={loading === c.user.id} style={{ background: "rgba(239,68,68,0.2)", border: "1px solid rgba(239,68,68,0.4)", borderRadius: "8px", padding: "3px 10px", color: "#fca5a5", fontSize: "12px", cursor: "pointer" }}>
                      {loading === c.user.id ? "..." : "Quitar"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search to add */}
          <div>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
              Agregar usuario
            </p>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre..."
              style={inputStyle}
            />
            {search && (
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                {filtered.length === 0 && (
                  <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)", textAlign: "center", padding: "12px" }}>Sin resultados</p>
                )}
                {filtered.map(u => (
                  <button key={u.id} onClick={() => addCollab(u)} disabled={loading === u.id}
                    style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "9px 14px", cursor: "pointer", transition: "background 0.15s", textAlign: "left" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
                  >
                    <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "rgba(102,126,234,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 700, color: "white", flexShrink: 0 }}>
                      {u.name[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "white" }}>{u.name}</p>
                      <p style={{ margin: 0, fontSize: "11px", color: "rgba(255,255,255,0.45)" }}>{roleLabel[u.role] ?? u.role}</p>
                    </div>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
                      {loading === u.id ? "..." : "+ Agregar"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (!mounted) return null;
  return createPortal(modal, document.body);
}

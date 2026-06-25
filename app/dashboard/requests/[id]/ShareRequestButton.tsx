"use client";
import { useState } from "react";
import { ShareRequestModal } from "./ShareRequestModal";

type Collaborator = { id: string; user: { id: string; name: string } };

export function ShareRequestButton({ requestId, collaborators }: { requestId: string; collaborators: Collaborator[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: "rgba(var(--a1),0.25)", border: "1px solid rgba(var(--a1),0.5)",
        borderRadius: "10px", padding: "6px 12px", color: "rgba(255,255,255,0.85)",
        fontSize: "13px", fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", gap: "5px",
        transition: "background 0.15s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(var(--a1),0.4)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(var(--a1),0.25)"; }}
      >
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
          <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98"/>
        </svg>
        Compartir
        {collaborators.length > 0 && (
          <span style={{ background: "rgba(var(--a1),0.6)", borderRadius: "999px", minWidth: "16px", height: "16px", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 700, padding: "0 3px" }}>
            {collaborators.length}
          </span>
        )}
      </button>
      {open && <ShareRequestModal requestId={requestId} collaborators={collaborators} onClose={() => setOpen(false)} />}
    </>
  );
}

"use client";
import { useState } from "react";
import { EditRequestModal } from "./EditRequestModal";

type RequestData = {
  id: string; title: string; description: string;
  sectorId: string; priority: string;
  startDate: string | null; endDate: string | null;
};

export function EditRequestButton({ request }: { request: RequestData }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)} style={{
        background: "rgba(255,255,255,0.25)",
        border: "1px solid rgba(255,255,255,0.5)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: "white",
        textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        padding: "4px 10px",
        borderRadius: "999px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.02em",
        cursor: "pointer",
        whiteSpace: "nowrap" as const,
      }}>
        Editar
      </button>
      {open && <EditRequestModal request={request} onClose={() => setOpen(false)} />}
    </>
  );
}

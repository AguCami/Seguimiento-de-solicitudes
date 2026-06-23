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
        background: "rgba(255,255,255,0.22)",
        border: "1px solid rgba(255,255,255,0.4)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        color: "white",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }} className="text-xs px-3 py-1.5 rounded-xl font-semibold hover:bg-white/30 transition">
        Editar
      </button>
      {open && <EditRequestModal request={request} onClose={() => setOpen(false)} />}
    </>
  );
}

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
      <button onClick={() => setOpen(true)}
        className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1.5 rounded-lg hover:bg-gray-200 transition font-medium">
        Editar
      </button>
      {open && <EditRequestModal request={request} onClose={() => setOpen(false)} />}
    </>
  );
}

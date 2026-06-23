"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const statuses = [
  { value: "PENDIENTE", label: "Pendiente" },
  { value: "EN_PROGRESO", label: "En progreso" },
  { value: "RESUELTO", label: "Resuelto" },
  { value: "CANCELADO", label: "Cancelado" },
];

export function RequestActions({ requestId, currentStatus, userRole }: {
  requestId: string;
  currentStatus: string;
  userRole: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleUpdate() {
    setLoading(true);
    await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    await fetch(`/api/requests/${requestId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: comment }),
    });
    setComment("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }} className="mt-5 pt-5">
      <div className="flex items-center gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-white/60 mb-1">Cambiar estado</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="glass-input px-3 py-2 text-sm"
          >
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
        <button
          onClick={handleUpdate}
          disabled={loading || status === currentStatus}
          className="mt-4 btn-glass-primary px-4 py-2 text-sm"
        >
          Actualizar estado
        </button>
      </div>

      <form onSubmit={handleComment} className="flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Agregar comentario o respuesta..."
          className="glass-input flex-1 px-4 py-2.5 text-sm"
        />
        <button
          type="submit"
          disabled={loading || !comment.trim()}
          className="btn-glass px-4 py-2.5 text-sm"
        >
          Comentar
        </button>
      </form>
    </div>
  );
}

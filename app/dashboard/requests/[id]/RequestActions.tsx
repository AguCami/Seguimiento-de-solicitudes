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
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleUpdate() {
    setLoading(true);
    setError("");
    const res = await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Error al actualizar");
      setStatus(currentStatus);
    }
    setLoading(false);
    router.refresh();
  }

  async function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    const form = new FormData();
    form.append("content", comment);
    await fetch(`/api/requests/${requestId}/comments`, { method: "POST", body: form });
    setComment("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)" }} className="mt-5 pt-5 space-y-3">
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-white/60 mb-1">Cambiar estado</label>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setError(""); }}
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

      {error && (
        <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8 }}>
          <span>⚠️</span>
          <p style={{ fontSize: 13, color: "rgba(252,165,165,0.95)", margin: 0 }}>{error}</p>
        </div>
      )}

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

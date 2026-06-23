"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type User = { id: string; name: string };

export function AssignResponsable({
  requestId,
  assignedToId,
  responsables,
}: {
  requestId: string;
  assignedToId: string | null;
  responsables: User[];
}) {
  const [value, setValue] = useState(assignedToId ?? "");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleChange(newVal: string) {
    setValue(newVal);
    setLoading(true);
    await fetch(`/api/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignedToId: newVal || null }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
      <label style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}>
        Responsable asignado:
      </label>
      <select
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        disabled={loading}
        className="glass-input px-3 py-1.5 text-sm"
        style={{ minWidth: "180px" }}
      >
        <option value="">Sin asignar</option>
        {responsables.map((u) => (
          <option key={u.id} value={u.id}>{u.name}</option>
        ))}
      </select>
      {loading && <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)" }}>Guardando…</span>}
    </div>
  );
}

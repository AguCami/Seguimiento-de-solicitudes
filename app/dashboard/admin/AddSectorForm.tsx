"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function AddSectorForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/sectors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Sector creado correctamente");
      setName(""); setDescription("");
      router.refresh();
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Error al crear sector");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre del sector"
        className="glass-input w-full px-3 py-2 text-sm" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)"
        className="glass-input w-full px-3 py-2 text-sm" />
      {message && (
        <p style={message.includes("correctamente")
          ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#6ee7b7" }
          : { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
          className="text-sm px-3 py-2 rounded-xl">{message}</p>
      )}
      <button type="submit" disabled={loading} className="btn-glass-primary w-full py-2 text-sm">
        {loading ? "Creando..." : "Crear sector"}
      </button>
    </form>
  );
}

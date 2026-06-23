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
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción (opcional)"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      {message && <p className={`text-sm ${message.includes("correctamente") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50">
        {loading ? "Creando..." : "Crear sector"}
      </button>
    </form>
  );
}

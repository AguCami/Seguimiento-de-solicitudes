"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Sector = { id: string; name: string };

export function RegisterUserForm({ sectors }: { sectors: Sector[] }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("SOLICITANTE");
  const [sector, setSector] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role, sector: sector || undefined }),
    });
    setLoading(false);
    if (res.ok) {
      setMessage("Usuario creado correctamente");
      setName(""); setEmail(""); setPassword(""); setRole("SOLICITANTE"); setSector("");
      router.refresh();
    } else {
      const d = await res.json();
      setMessage(d.error ?? "Error al crear usuario");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nombre completo"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Contraseña"
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      <select value={role} onChange={(e) => setRole(e.target.value)}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
        <option value="SOLICITANTE">Solicitante</option>
        <option value="RESPONSABLE">Responsable de sector</option>
        <option value="ADMIN">Administrador</option>
      </select>
      {role === "RESPONSABLE" && (
        <select value={sector} onChange={(e) => setSector(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Seleccionar sector</option>
          {sectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      )}
      {message && <p className={`text-sm ${message.includes("correctamente") ? "text-green-600" : "text-red-500"}`}>{message}</p>}
      <button type="submit" disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
        {loading ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}

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
        className="glass-input w-full px-3 py-2 text-sm" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email"
        className="glass-input w-full px-3 py-2 text-sm" />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Contraseña"
        className="glass-input w-full px-3 py-2 text-sm" />
      <select value={role} onChange={(e) => setRole(e.target.value)}
        className="glass-input w-full px-3 py-2 text-sm">
        <option value="SOLICITANTE">Solicitante</option>
        <option value="RESPONSABLE">Responsable de sector</option>
        <option value="EDITOR">Editor</option>
        <option value="ADMIN">Administrador</option>
      </select>
      {role === "RESPONSABLE" && (
        <select value={sector} onChange={(e) => setSector(e.target.value)}
          className="glass-input w-full px-3 py-2 text-sm">
          <option value="">Seleccionar sector</option>
          {sectors.map((s) => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
      )}
      {message && (
        <p style={message.includes("correctamente")
          ? { background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)", color: "#6ee7b7" }
          : { background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}
          className="text-sm px-3 py-2 rounded-xl">{message}</p>
      )}
      <button type="submit" disabled={loading} className="btn-glass-primary w-full py-2 text-sm">
        {loading ? "Creando..." : "Crear usuario"}
      </button>
    </form>
  );
}

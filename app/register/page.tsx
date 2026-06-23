"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError("Las contraseñas no coinciden"); return; }
    if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error al crear la cuenta");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div style={{
        background: "rgba(255,255,255,0.18)",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.35)",
        boxShadow: "0 8px 32px rgba(31,38,135,0.18), inset 0 1px 0 rgba(255,255,255,0.5)",
      }} className="rounded-3xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div style={{
            background: "linear-gradient(135deg, rgba(102,126,234,0.7), rgba(118,75,162,0.7))",
            border: "1px solid rgba(255,255,255,0.4)",
            boxShadow: "0 4px 20px rgba(102,126,234,0.4)",
          }} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold drop-shadow" style={{ color: "#1a1a3e" }}>Crear cuenta</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(30,30,80,0.65)" }}>Registrate para enviar solicitudes</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(20,20,60,0.85)" }}>Nombre completo</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="glass-input w-full px-4 py-2.5 text-sm" placeholder="Tu nombre" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(20,20,60,0.85)" }}>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              className="glass-input w-full px-4 py-2.5 text-sm" placeholder="tu@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(20,20,60,0.85)" }}>Contraseña</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              className="glass-input w-full px-4 py-2.5 text-sm" placeholder="Mínimo 6 caracteres" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(20,20,60,0.85)" }}>Confirmar contraseña</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
              className="glass-input w-full px-4 py-2.5 text-sm" placeholder="Repetí la contraseña" />
          </div>
          {error && (
            <p style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#b91c1c" }}
              className="text-sm px-3 py-2 rounded-xl font-medium">{error}</p>
          )}
          <button type="submit" disabled={loading} className="btn-glass-primary w-full py-2.5 text-sm">
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: "rgba(30,30,80,0.6)" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold hover:opacity-75 transition" style={{ color: "#4f46e5" }}>
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  );
}

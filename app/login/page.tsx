"use client";
import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) setError("Email o contraseña incorrectos");
    else router.push("/dashboard");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold drop-shadow" style={{ color: "#1a1a3e" }}>Seguimiento de Solicitudes</h1>
          <p className="mt-1 text-sm" style={{ color: "rgba(30,30,80,0.65)" }}>Ingresá con tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(20,20,60,0.85)" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1" style={{ color: "rgba(20,20,60,0.85)" }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p style={{ background: "rgba(220,38,38,0.12)", border: "1px solid rgba(220,38,38,0.35)", color: "#b91c1c" }}
              className="text-sm px-3 py-2 rounded-xl font-medium">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-glass-primary w-full py-2.5 text-sm"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm mt-4" style={{ color: "rgba(30,30,80,0.6)" }}>
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-semibold hover:opacity-75 transition" style={{ color: "#4f46e5" }}>
            Registrate
          </Link>
        </p>

        <div style={{
          background: "rgba(255,255,255,0.3)",
          border: "1px solid rgba(255,255,255,0.5)",
        }} className="mt-5 p-4 rounded-2xl text-xs">
          <p className="font-semibold mb-1" style={{ color: "rgba(20,20,60,0.75)" }}>Usuarios de prueba:</p>
          <p style={{ color: "rgba(30,30,80,0.6)" }}>Admin: admin@empresa.com / admin123</p>
          <p style={{ color: "rgba(30,30,80,0.6)" }}>Responsable IT: it@empresa.com / it123</p>
          <p style={{ color: "rgba(30,30,80,0.6)" }}>Solicitante: usuario@empresa.com / usuario123</p>
        </div>
      </div>
    </div>
  );
}

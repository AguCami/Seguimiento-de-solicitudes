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
            background: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.1))",
            border: "1px solid rgba(255,255,255,0.5)",
            backdropFilter: "blur(10px)",
          }} className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4">
            <svg className="w-8 h-8 text-white drop-shadow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white drop-shadow">Seguimiento de Solicitudes</h1>
          <p className="text-white/65 mt-1 text-sm">Ingresá con tus credenciales</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Email</label>
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
            <label className="block text-sm font-medium text-white/80 mb-1">Contraseña</label>
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
            <p style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
              className="text-red-200 text-sm px-3 py-2 rounded-xl">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-glass-primary w-full py-2.5 text-sm"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="text-center text-sm text-white/60 mt-4">
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="text-white font-medium hover:text-white/80 underline underline-offset-2">
            Registrate
          </Link>
        </p>

        <div style={{
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.15)",
        }} className="mt-5 p-4 rounded-2xl text-xs text-white/50">
          <p className="font-medium mb-1 text-white/70">Usuarios de prueba:</p>
          <p>Admin: admin@empresa.com / admin123</p>
          <p>Responsable IT: it@empresa.com / it123</p>
          <p>Solicitante: usuario@empresa.com / usuario123</p>
        </div>
      </div>
    </div>
  );
}

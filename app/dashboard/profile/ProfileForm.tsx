"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type UserData = { id: string; name: string; email: string; role: string; sector?: string | null; avatarUrl?: string | null };

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador", EDITOR: "Editor", RESPONSABLE: "Responsable", SOLICITANTE: "Solicitante",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.12)",
  border: "1px solid rgba(255,255,255,0.25)",
  borderRadius: "12px",
  padding: "10px 14px",
  fontSize: "14px",
  color: "white",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
};

function hashColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash) % 360;
  return `hsl(${h},55%,45%)`;
}

export function ProfileForm({ user }: { user: UserData }) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatarUrl ?? null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const avatarRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("La foto no puede superar 2MB"); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword && newPassword !== confirmPassword) {
      setError("Las contraseñas nuevas no coinciden"); return;
    }

    setSaving(true);
    const form = new FormData();
    form.append("name", name);
    form.append("email", email);
    if (newPassword) { form.append("currentPassword", currentPassword); form.append("newPassword", newPassword); }
    if (avatarFile) form.append("avatar", avatarFile);

    const res = await fetch("/api/profile", { method: "PATCH", body: form });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) { setError(data.error ?? "Error al guardar"); return; }

    setSuccess("¡Perfil actualizado correctamente!");
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setAvatarFile(null);
    // Invalidate avatar cache so Navbar picks up the new photo
    sessionStorage.removeItem(`avatar_${user.id}`);
    router.refresh();
  }

  const avatarColor = hashColor(user.name);

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <div className="card-enter" style={{
        background: "rgba(255,255,255,0.15)", backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)", border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
        borderRadius: "24px", padding: "32px",
      }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div style={{ position: "relative", display: "inline-block" }}>
              {avatarPreview ? (
                <img src={avatarPreview} alt="avatar"
                  style={{ width: 96, height: 96, borderRadius: "50%", objectFit: "cover", border: "3px solid rgba(255,255,255,0.3)" }} />
              ) : (
                <div style={{
                  width: 96, height: 96, borderRadius: "50%",
                  background: avatarColor, border: "3px solid rgba(255,255,255,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 36, fontWeight: 700, color: "white",
                }}>
                  {user.name[0].toUpperCase()}
                </div>
              )}
              <label style={{
                position: "absolute", bottom: 0, right: 0,
                background: "rgba(99,102,241,0.85)", border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "50%", width: 28, height: 28, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }} title="Cambiar foto">
                <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <input ref={avatarRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </label>
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">{user.name}</p>
              <p className="text-xs text-white/50">{roleLabel[user.role] ?? user.role}{user.sector ? ` · ${user.sector}` : ""}</p>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "24px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "16px" }}>
              Información personal
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/60 mb-1.5 font-medium">Nombre</label>
                <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} required />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5 font-medium">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
              </div>
            </div>
          </div>

          <div style={{ borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: "24px" }}>
            <p style={{ fontSize: "11px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: "16px" }}>
              Cambiar contraseña <span style={{ fontWeight: 400, textTransform: "none", opacity: 0.6 }}>(opcional)</span>
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-white/60 mb-1.5 font-medium">Contraseña actual</label>
                <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
              </div>
              <div>
                <label className="block text-xs text-white/60 mb-1.5 font-medium">Nueva contraseña</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} style={inputStyle} placeholder="Mínimo 6 caracteres" />
              </div>
              {newPassword && (
                <div>
                  <label className="block text-xs text-white/60 mb-1.5 font-medium">Confirmar nueva contraseña</label>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={inputStyle} placeholder="••••••••" />
                </div>
              )}
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", borderRadius: "12px", padding: "10px 14px" }}>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}
          {success && (
            <div style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)", borderRadius: "12px", padding: "10px 14px" }}>
              <p className="text-sm text-green-300">{success}</p>
            </div>
          )}

          <button type="submit" disabled={saving} style={{
            width: "100%", background: "linear-gradient(135deg, rgba(99,102,241,0.85), rgba(139,92,246,0.85))",
            border: "1px solid rgba(139,92,246,0.6)", borderRadius: "14px",
            padding: "12px", color: "white", fontSize: "15px", fontWeight: 700,
            cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.7 : 1,
            transition: "opacity 0.15s",
          }}>
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      </div>
    </div>
  );
}

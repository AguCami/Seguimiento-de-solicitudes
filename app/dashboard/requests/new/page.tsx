"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Sector = { id: string; name: string };

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return "🖼️";
  if (type === "application/pdf") return "📄";
  return "📎";
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function NewRequestPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requestedTo, setRequestedTo] = useState("");
  const [sectorId, setSectorId] = useState("");
  const [priority, setPriority] = useState("MEDIA");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/sectors").then((r) => r.json()).then(setSectors);
  }, []);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...selected.filter((f) => !existing.has(f.name))];
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(name: string) {
    setFiles((prev) => prev.filter((f) => f.name !== name));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!sectorId) { setError("Seleccioná un sector"); return; }
    setLoading(true);
    setError("");

    const res = await fetch("/api/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, requestedTo: requestedTo || undefined, sectorId, priority, startDate: startDate || undefined, endDate: endDate || undefined }),
    });

    if (!res.ok) { setError("Error al crear la solicitud"); setLoading(false); return; }

    const data = await res.json();

    // Upload files one by one
    for (const file of files) {
      const form = new FormData();
      form.append("file", file);
      await fetch(`/api/requests/${data.id}/attachments`, { method: "POST", body: form });
    }

    router.push(`/dashboard/requests/${data.id}`);
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-white drop-shadow mb-6">Nueva solicitud</h1>

      <div style={{
        background: "rgba(255,255,255,0.15)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 8px 32px rgba(31,38,135,0.15), inset 0 1px 0 rgba(255,255,255,0.4)",
      }} className="rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required maxLength={100}
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="Describí brevemente la solicitud" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Solicitado a</label>
            <input value={requestedTo} onChange={(e) => setRequestedTo(e.target.value)} maxLength={100}
              className="glass-input w-full px-4 py-2.5 text-sm"
              placeholder="Nombre de la persona o área destinataria" />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1">Descripción *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5}
              className="glass-input w-full px-4 py-2.5 text-sm resize-none"
              placeholder="Detallá la solicitud..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Sector destino *</label>
              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm">
                <option value="">Seleccionar sector</option>
                {sectors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Prioridad</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm">
                <option value="BAJA">Baja</option>
                <option value="MEDIA">Media</option>
                <option value="ALTA">Alta</option>
                <option value="URGENTE">Urgente</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fecha de inicio</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-1">Fecha de fin</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
                className="glass-input w-full px-4 py-2.5 text-sm" />
            </div>
          </div>

          {/* Adjuntos */}
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">Adjuntos</label>
            <label style={{
              background: "rgba(255,255,255,0.1)",
              border: "2px dashed rgba(255,255,255,0.35)",
              borderRadius: "14px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
              className="hover:bg-white/20 hover:border-white/50"
            >
              <svg style={{ width: 28, height: 28, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}
                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <span className="text-sm text-white/70 font-medium">Adjuntar comprobante o ticket</span>
              <span className="text-xs text-white/45 mt-1">Imágenes o PDF · máx. 4.5 MB c/u</span>
              <input ref={fileInputRef} type="file" accept="image/*,.pdf" multiple onChange={handleFileChange} className="hidden" />
            </label>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((f) => (
                  <div key={f.name} style={{
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 14px",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{getFileIcon(f.type)}</span>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{f.name}</p>
                        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", margin: 0 }}>{formatSize(f.size)}</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => removeFile(f.name)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)", fontSize: 16, flexShrink: 0, marginLeft: 8 }}
                      className="hover:text-red-300 transition">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
              className="text-red-200 text-sm px-3 py-2 rounded-xl">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="btn-glass-primary px-6 py-2.5 text-sm">
              {loading ? (files.length > 0 ? "Subiendo..." : "Enviando...") : "Crear solicitud"}
            </button>
            <button type="button" onClick={() => router.back()} className="btn-glass px-6 py-2.5 text-sm">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

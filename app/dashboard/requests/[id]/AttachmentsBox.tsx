"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

type Attachment = { id: string; name: string; url: string; type: string; size: number };

export function AttachmentsBox({ requestId, attachments }: { requestId: string; attachments: Attachment[] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/requests/${requestId}/attachments`, { method: "POST", body: form });
    setUploading(false);
    if (res.ok) router.refresh();
    else { const d = await res.json(); setError(d.error ?? "Error al subir el archivo"); }
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(attachmentId: string) {
    if (!confirm("¿Eliminar este archivo?")) return;
    await fetch(`/api/requests/${requestId}/attachments?attachmentId=${attachmentId}`, { method: "DELETE" });
    router.refresh();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  function getIcon(type: string) {
    if (type.startsWith("image/")) return "🖼️";
    if (type === "application/pdf") return "📄";
    return "📎";
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.3)",
      boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
    }} className="rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-white">Adjuntos ({attachments.length})</h2>
        <label className={`cursor-pointer btn-glass px-3 py-1.5 text-sm ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Subiendo..." : "+ Agregar archivo"}
          <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {error && (
        <p style={{ background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)" }}
          className="text-red-200 text-sm px-3 py-2 rounded-xl mb-3">{error}</p>
      )}

      {attachments.length === 0 && (
        <p className="text-white/50 text-sm">No hay archivos adjuntos</p>
      )}

      <div className="space-y-2">
        {attachments.map((a) => (
          <div key={a.id} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}
            className="flex items-center justify-between p-3 rounded-xl">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl flex-shrink-0">{getIcon(a.type)}</span>
              <div className="min-w-0">
                <a href={a.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-white hover:text-white/70 underline underline-offset-2 truncate block">{a.name}</a>
                <p className="text-xs text-white/45">{formatSize(a.size)}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(a.id)}
              className="text-white/40 hover:text-red-300 transition ml-3 flex-shrink-0 text-sm">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

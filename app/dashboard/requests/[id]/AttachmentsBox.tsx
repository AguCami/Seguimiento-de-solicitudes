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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-700">Adjuntos ({attachments.length})</h2>
        <label className={`cursor-pointer bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-100 transition ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
          {uploading ? "Subiendo..." : "+ Agregar archivo"}
          <input ref={inputRef} type="file" accept="image/*,.pdf" onChange={handleUpload} className="hidden" />
        </label>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {attachments.length === 0 && (
        <p className="text-gray-400 text-sm">No hay archivos adjuntos</p>
      )}

      <div className="space-y-2">
        {attachments.map((a) => (
          <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl flex-shrink-0">{getIcon(a.type)}</span>
              <div className="min-w-0">
                <a href={`/api/attachments/${a.id}`} target="_blank" rel="noopener noreferrer"
                  className="text-sm font-medium text-blue-600 hover:underline truncate block">{a.name}</a>
                <p className="text-xs text-gray-400">{formatSize(a.size)}</p>
              </div>
            </div>
            <button onClick={() => handleDelete(a.id)}
              className="text-gray-400 hover:text-red-500 transition ml-3 flex-shrink-0 text-sm">
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

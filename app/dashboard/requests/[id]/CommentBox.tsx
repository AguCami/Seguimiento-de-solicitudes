"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function CommentBox({ requestId }: { requestId: string }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() && !file) return;
    setLoading(true);

    const form = new FormData();
    form.append("content", comment);
    if (file) form.append("file", file);

    await fetch(`/api/requests/${requestId}/comments`, { method: "POST", body: form });
    setComment("");
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setLoading(false);
    router.refresh();
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Agregar un comentario..."
          className="glass-input flex-1 px-4 py-2.5 text-sm"
        />
        {/* Attach file */}
        <label title="Adjuntar archivo" style={{
          background: file ? "rgba(99,102,241,0.3)" : "rgba(255,255,255,0.12)",
          border: `1px solid ${file ? "rgba(99,102,241,0.6)" : "rgba(255,255,255,0.25)"}`,
          borderRadius: "12px", width: "40px", height: "40px",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
        }}>
          <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <input ref={fileRef} type="file" accept="image/*,.pdf,.doc,.docx,.xls,.xlsx" className="hidden"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <button
          type="submit"
          disabled={loading || (!comment.trim() && !file)}
          className="btn-glass px-4 py-2.5 text-sm"
        >
          {loading ? "…" : "Comentar"}
        </button>
      </div>

      {/* File preview chip */}
      {file && (
        <div style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.35)", borderRadius: "10px" }}
          className="flex items-center gap-2 px-3 py-2">
          <svg width="13" height="13" fill="none" stroke="rgba(165,180,252,0.9)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
          <span className="text-xs text-indigo-200 flex-1 truncate">{file.name}</span>
          <span className="text-xs text-white/40">{formatSize(file.size)}</span>
          <button type="button" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ""; }}
            className="text-white/40 hover:text-red-300 transition text-sm leading-none ml-1">✕</button>
        </div>
      )}
    </form>
  );
}

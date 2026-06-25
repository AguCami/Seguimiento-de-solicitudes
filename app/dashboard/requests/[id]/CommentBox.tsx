"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type UserMention = { id: string; name: string };

export function CommentBox({ requestId }: { requestId: string }) {
  const [comment, setComment] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserMention[]>([]);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/users").then(r => r.json()).then((data: UserMention[]) => setUsers(data)).catch(() => {});
  }, []);

  const filteredUsers = mentionQuery !== null
    ? users.filter(u => u.name.toLowerCase().includes(mentionQuery.toLowerCase())).slice(0, 5)
    : [];

  function handleCommentChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setComment(val);

    const cursor = e.target.selectionStart ?? val.length;
    const textBefore = val.slice(0, cursor);
    const match = textBefore.match(/@(\w*)$/);
    if (match) {
      setMentionQuery(match[1]);
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
    }
  }

  function insertMention(user: UserMention) {
    const cursor = inputRef.current?.selectionStart ?? comment.length;
    const textBefore = comment.slice(0, cursor);
    const textAfter = comment.slice(cursor);
    const atIdx = textBefore.lastIndexOf("@");
    const newText = textBefore.slice(0, atIdx) + `@${user.name} ` + textAfter;
    setComment(newText);
    setMentionQuery(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (mentionQuery === null || filteredUsers.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setMentionIndex(i => Math.min(i + 1, filteredUsers.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setMentionIndex(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); insertMention(filteredUsers[mentionIndex]); }
    else if (e.key === "Escape") { setMentionQuery(null); }
  }

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
    setMentionQuery(null);
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
      <div className="flex gap-2" style={{ position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input
            ref={inputRef}
            value={comment}
            onChange={handleCommentChange}
            onKeyDown={handleKeyDown}
            placeholder="Agregar un comentario… (usá @nombre para mencionar)"
            className="glass-input w-full px-4 py-2.5 text-sm"
          />
          {/* Mention dropdown */}
          {mentionQuery !== null && filteredUsers.length > 0 && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, right: 0, marginBottom: 4,
              background: "rgba(20,18,60,0.95)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(99,102,241,0.5)", borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
              overflow: "hidden", zIndex: 50,
            }}>
              {filteredUsers.map((u, i) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => insertMention(u)}
                  style={{
                    width: "100%", textAlign: "left", padding: "8px 14px",
                    background: i === mentionIndex ? "rgba(99,102,241,0.3)" : "transparent",
                    border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  }}
                >
                  <div style={{
                    width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                    background: "rgba(99,102,241,0.5)", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 11, fontWeight: 700, color: "white",
                  }}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.9)", fontWeight: i === mentionIndex ? 600 : 400 }}>
                    @{u.name}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

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

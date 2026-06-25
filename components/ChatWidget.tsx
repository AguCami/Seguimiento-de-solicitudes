"use client";
import { useState, useEffect, useRef, useCallback } from "react";

type User = { id: string; name: string; role: string };
type Message = { id: string; content: string; senderId: string; createdAt: string; read: boolean };
type Conversation = { user: User; last: { content: string; createdAt: string; senderId: string } | null; unread: number };

const roleLabel: Record<string, string> = {
  ADMIN: "Admin", EDITOR: "Editor", RESPONSABLE: "Responsable", SOLICITANTE: "Solicitante",
};

function timeAgo(date: string) {
  const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (diff < 60) return "ahora";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return new Date(date).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit" });
}

export function ChatWidget({ myId }: { myId: string }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<"list" | "chat">("list");
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [totalUnread, setTotalUnread] = useState(0);
  const [activeUser, setActiveUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const esRef = useRef<EventSource | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) { const d = await res.json(); setConversations(d.conversations); setTotalUnread(d.totalUnread); }
    } catch {}
  }, []);

  // Poll conversation list every 6s (just for unread counts / new conversations)
  useEffect(() => {
    fetchConversations();
    const id = setInterval(fetchConversations, 6000);
    return () => clearInterval(id);
  }, [fetchConversations]);

  // SSE connection for active chat
  useEffect(() => {
    if (esRef.current) { esRef.current.close(); esRef.current = null; }
    if (!activeUser || view !== "chat") return;

    const es = new EventSource(`/api/messages/${activeUser.id}/stream`);
    esRef.current = es;

    es.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === "init") {
        setMessages(data.messages);
        setConversations(prev => prev.map(c => c.user.id === activeUser.id ? { ...c, unread: 0 } : c));
        setTotalUnread(prev => Math.max(0, prev - (conversations.find(c => c.user.id === activeUser.id)?.unread ?? 0)));
      } else if (data.type === "new" && data.messages.length > 0) {
        setMessages(prev => {
          const ids = new Set(prev.map(m => m.id));
          return [...prev, ...data.messages.filter((m: Message) => !ids.has(m.id))];
        });
        fetchConversations();
      }
    };

    es.onerror = () => { es.close(); };

    return () => { es.close(); esRef.current = null; };
  }, [activeUser, view]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { if (view === "chat" && open) setTimeout(() => inputRef.current?.focus(), 100); }, [view, open]);

  function openChat(conv: Conversation) {
    setActiveUser(conv.user);
    setMessages([]);
    setView("chat");
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || !activeUser || sending) return;
    setSending(true);
    const content = input.trim();
    setInput("");
    try {
      const res = await fetch(`/api/messages/${activeUser.id}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        fetchConversations();
      }
    } catch {}
    setSending(false);
  }

  const panelStyle: React.CSSProperties = {
    position: "fixed", bottom: "80px", right: "20px", zIndex: 9990,
    width: "320px", height: "460px",
    background: "rgba(20,10,50,0.88)",
    backdropFilter: "blur(40px) saturate(180%)", WebkitBackdropFilter: "blur(40px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.2)", borderRadius: "20px",
    boxShadow: "0 24px 64px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
    display: "flex", flexDirection: "column", overflow: "hidden",
    animation: "fadeInUp 0.2s ease both",
  };

  return (
    <>
      {/* Floating bubble */}
      <button onClick={() => setOpen(!open)} style={{
        position: "fixed", bottom: "20px", right: "20px", zIndex: 9991,
        width: "52px", height: "52px", borderRadius: "50%",
        background: "linear-gradient(135deg, rgba(102,126,234,0.9), rgba(118,75,162,0.9))",
        border: "1px solid rgba(255,255,255,0.3)",
        boxShadow: "0 4px 20px rgba(102,126,234,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        transition: "transform 0.2s ease",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1.08)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "scale(1)"; }}
      >
        {open ? (
          <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
        ) : (
          <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        )}
        {totalUnread > 0 && !open && (
          <span style={{
            position: "absolute", top: "0px", right: "0px",
            background: "#ef4444", color: "white", fontSize: "10px", fontWeight: 700,
            borderRadius: "999px", minWidth: "18px", height: "18px",
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid rgba(20,10,50,0.8)", padding: "0 3px",
          }}>{totalUnread > 9 ? "9+" : totalUnread}</span>
        )}
      </button>

      {open && (
        <div style={panelStyle}>
          {/* Header */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
            {view === "chat" && (
              <button onClick={() => { setView("list"); setActiveUser(null); }} style={{ background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "8px", padding: "4px 8px", color: "rgba(255,255,255,0.7)", fontSize: "12px", cursor: "pointer" }}>←</button>
            )}
            <p style={{ fontSize: "14px", fontWeight: 700, color: "white", margin: 0, flex: 1 }}>
              {view === "list" ? "Mensajes" : activeUser?.name}
            </p>
            {view === "chat" && activeUser && (
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.45)", background: "rgba(255,255,255,0.08)", borderRadius: "999px", padding: "2px 8px" }}>
                {roleLabel[activeUser.role] ?? activeUser.role}
              </span>
            )}
            {view === "chat" && (
              <span style={{ fontSize: "10px", color: "rgba(52,211,153,0.8)", background: "rgba(52,211,153,0.12)", borderRadius: "999px", padding: "2px 8px", border: "1px solid rgba(52,211,153,0.25)" }}>
                ● en vivo
              </span>
            )}
          </div>

          {/* Conversation list */}
          {view === "list" && (
            <div style={{ flex: 1, overflowY: "auto" }}>
              {conversations.length === 0 && (
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", textAlign: "center", padding: "40px 16px" }}>No hay usuarios todavía</p>
              )}
              {conversations.map((conv) => (
                <button key={conv.user.id} onClick={() => openChat(conv)} style={{
                  width: "100%", padding: "12px 16px", background: "transparent", border: "none",
                  borderBottom: "1px solid rgba(255,255,255,0.06)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: "12px", transition: "background 0.15s",
                }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.06)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <div style={{ width: "38px", height: "38px", borderRadius: "50%", flexShrink: 0, background: "rgba(102,126,234,0.5)", border: "1px solid rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "15px", fontWeight: 700, color: "white" }}>
                    {conv.user.name[0].toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "white", margin: 0 }}>{conv.user.name}</p>
                      {conv.last && <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)" }}>{timeAgo(conv.last.createdAt)}</span>}
                    </div>
                    <p style={{ fontSize: "12px", color: conv.unread > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: conv.unread > 0 ? 600 : 400 }}>
                      {conv.last ? (conv.last.senderId === myId ? "Vos: " : "") + conv.last.content : roleLabel[conv.user.role] ?? conv.user.role}
                    </p>
                  </div>
                  {conv.unread > 0 && (
                    <span style={{ background: "#6366f1", color: "white", fontSize: "10px", fontWeight: 700, borderRadius: "999px", minWidth: "18px", height: "18px", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", flexShrink: 0 }}>{conv.unread}</span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Chat view */}
          {view === "chat" && (
            <>
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: "6px" }}>
                {messages.length === 0 && (
                  <p style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px", textAlign: "center", margin: "auto 0" }}>Iniciá la conversación</p>
                )}
                {messages.map((msg) => {
                  const isMine = msg.senderId === myId;
                  return (
                    <div key={msg.id} style={{ display: "flex", justifyContent: isMine ? "flex-end" : "flex-start" }}>
                      <div style={{
                        maxWidth: "75%", padding: "8px 12px",
                        borderRadius: isMine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                        background: isMine ? "rgba(102,126,234,0.75)" : "rgba(255,255,255,0.12)",
                        border: `1px solid ${isMine ? "rgba(102,126,234,0.9)" : "rgba(255,255,255,0.15)"}`,
                        fontSize: "13px", color: "white", lineHeight: "1.4", wordBreak: "break-word",
                      }}>
                        {msg.content}
                        <div style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", marginTop: "3px", textAlign: isMine ? "right" : "left" }}>
                          {new Date(msg.createdAt).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form onSubmit={sendMessage} style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.1)", display: "flex", gap: "8px", flexShrink: 0 }}>
                <input ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribí un mensaje..."
                  style={{ flex: 1, background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: "12px", padding: "8px 12px", fontSize: "13px", color: "white", outline: "none" }} />
                <button type="submit" disabled={!input.trim() || sending} style={{ background: "rgba(102,126,234,0.8)", border: "1px solid rgba(102,126,234,0.9)", borderRadius: "10px", width: "36px", height: "36px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: !input.trim() ? 0.4 : 1, transition: "opacity 0.15s" }}>
                  <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" /></svg>
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}

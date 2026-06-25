"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type SubTask = { id: string; title: string; done: boolean };

export function SubTasksBox({ requestId, subtasks, canManage }: {
  requestId: string;
  subtasks: SubTask[];
  canManage: boolean;
}) {
  const [tasks, setTasks] = useState<SubTask[]>(subtasks);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const router = useRouter();

  const done = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);
  const allDone = total > 0 && done === total;

  async function toggleTask(task: SubTask) {
    const newDone = !task.done;
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, done: newDone } : t));
    await fetch(`/api/requests/${requestId}/subtasks`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtaskId: task.id, done: newDone }),
    });
    router.refresh();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/requests/${requestId}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle.trim() }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks(prev => [...prev, task]);
      setNewTitle("");
      setShowInput(false);
    }
    setAdding(false);
  }

  async function deleteTask(id: string) {
    setTasks(prev => prev.filter(t => t.id !== id));
    await fetch(`/api/requests/${requestId}/subtasks`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subtaskId: id }),
    });
    router.refresh();
  }

  return (
    <div style={{
      background: "rgba(255,255,255,0.15)",
      backdropFilter: "blur(20px) saturate(180%)",
      WebkitBackdropFilter: "blur(20px) saturate(180%)",
      border: "1px solid rgba(255,255,255,0.3)",
      boxShadow: "0 4px 24px rgba(31,38,135,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
    }} className="rounded-2xl p-6 card-enter" style2={{ animationDelay: "60ms" }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-white">Subtareas</h2>
          {total > 0 && (
            <span style={{
              background: allDone ? "rgba(34,197,94,0.25)" : "rgba(99,102,241,0.25)",
              border: `1px solid ${allDone ? "rgba(34,197,94,0.5)" : "rgba(99,102,241,0.4)"}`,
              borderRadius: "999px", padding: "1px 8px", fontSize: "11px", fontWeight: 700,
              color: allDone ? "rgba(134,239,172,0.95)" : "rgba(165,180,252,0.95)",
            }}>
              {done}/{total}
            </span>
          )}
        </div>
        {canManage && (
          <button onClick={() => setShowInput(v => !v)} style={{
            background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)",
            borderRadius: "10px", padding: "4px 12px", color: "rgba(165,180,252,0.9)",
            fontSize: "12px", fontWeight: 600, cursor: "pointer",
          }}>
            {showInput ? "Cancelar" : "+ Agregar"}
          </button>
        )}
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "999px", height: 6, marginBottom: 16, overflow: "hidden" }}>
          <div style={{
            height: "100%", borderRadius: "999px",
            width: `${progress}%`,
            background: allDone
              ? "linear-gradient(90deg, rgba(34,197,94,0.8), rgba(16,185,129,0.8))"
              : "linear-gradient(90deg, rgba(99,102,241,0.8), rgba(139,92,246,0.8))",
            transition: "width 0.4s ease",
          }} />
        </div>
      )}

      {/* Add input */}
      {showInput && (
        <form onSubmit={addTask} className="flex gap-2 mb-4">
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Nombre de la subtarea..."
            autoFocus
            className="glass-input flex-1 px-3 py-2 text-sm"
          />
          <button type="submit" disabled={adding || !newTitle.trim()} style={{
            background: "rgba(99,102,241,0.7)", border: "1px solid rgba(99,102,241,0.9)",
            borderRadius: "10px", padding: "6px 14px", color: "white",
            fontSize: "13px", fontWeight: 600, cursor: "pointer", opacity: !newTitle.trim() ? 0.5 : 1,
          }}>
            {adding ? "…" : "Agregar"}
          </button>
        </form>
      )}

      {/* Task list */}
      {tasks.length === 0 && !showInput && (
        <p className="text-white/40 text-sm">
          {canManage ? "No hay subtareas. Agregá una con el botón +." : "No hay subtareas en esta solicitud."}
        </p>
      )}

      <div className="space-y-2">
        {tasks.map(task => (
          <div key={task.id} className="flex items-center gap-3 group">
            <button
              onClick={() => canManage ? toggleTask(task) : null}
              disabled={!canManage}
              style={{
                width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                border: `2px solid ${task.done ? "rgba(34,197,94,0.8)" : "rgba(255,255,255,0.35)"}`,
                background: task.done ? "rgba(34,197,94,0.3)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: canManage ? "pointer" : "default",
                transition: "all 0.15s",
              }}
            >
              {task.done && (
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="rgba(134,239,172,0.95)" strokeWidth="3.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </button>
            <span style={{
              flex: 1, fontSize: 14,
              color: task.done ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.85)",
              textDecoration: task.done ? "line-through" : "none",
              transition: "all 0.2s",
            }}>
              {task.title}
            </span>
            {canManage && (
              <button
                onClick={() => deleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 transition"
                style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", background: "none", border: "none", padding: "0 2px" }}
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Completion banner */}
      {allDone && (
        <div style={{
          marginTop: 16, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.35)",
          borderRadius: 12, padding: "8px 14px", display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 16 }}>✅</span>
          <p style={{ fontSize: 13, color: "rgba(134,239,172,0.9)", margin: 0, fontWeight: 500 }}>
            Todas las subtareas completadas — podés resolver la solicitud.
          </p>
        </div>
      )}
    </div>
  );
}

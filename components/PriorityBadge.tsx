import React from "react";

const config: Record<string, { label: string; style: React.CSSProperties }> = {
  BAJA:    { label: "Baja",    style: { background: "rgba(156,163,175,0.25)", border: "1px solid rgba(156,163,175,0.4)", color: "#374151" } },
  MEDIA:   { label: "Media",   style: { background: "rgba(99,102,241,0.22)", border: "1px solid rgba(99,102,241,0.4)", color: "#3730a3" } },
  ALTA:    { label: "Alta",    style: { background: "rgba(251,146,60,0.25)", border: "1px solid rgba(251,146,60,0.4)", color: "#9a3412" } },
  URGENTE: { label: "Urgente", style: { background: "rgba(239,68,68,0.22)", border: "1px solid rgba(239,68,68,0.4)", color: "#991b1b" } },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const c = config[priority] ?? { label: priority, style: { background: "rgba(156,163,175,0.2)", border: "1px solid rgba(156,163,175,0.3)", color: "#374151" } };
  return (
    <span style={{ ...c.style, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold">
      {c.label}
    </span>
  );
}

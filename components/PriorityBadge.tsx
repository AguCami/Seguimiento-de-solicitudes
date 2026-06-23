const config: Record<string, { label: string; bg: string; border: string }> = {
  BAJA:    { label: "Baja",    bg: "rgba(156,163,175,0.45)", border: "rgba(156,163,175,0.7)" },
  MEDIA:   { label: "Media",   bg: "rgba(99,102,241,0.6)",   border: "rgba(99,102,241,0.85)" },
  ALTA:    { label: "Alta",    bg: "rgba(251,146,60,0.6)",   border: "rgba(251,146,60,0.85)" },
  URGENTE: { label: "Urgente", bg: "rgba(239,68,68,0.6)",    border: "rgba(239,68,68,0.85)" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const c = config[priority] ?? { label: priority, bg: "rgba(156,163,175,0.45)", border: "rgba(156,163,175,0.7)" };
  return (
    <span style={{
      background: c.bg,
      border: `1px solid ${c.border}`,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
      color: "white",
      textShadow: "0 1px 2px rgba(0,0,0,0.3)",
      padding: "4px 10px",
      borderRadius: "999px",
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.02em",
      display: "inline-flex",
      alignItems: "center",
      whiteSpace: "nowrap" as const,
    }}>
      {c.label}
    </span>
  );
}

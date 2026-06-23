const config: Record<string, { label: string; bg: string; border: string }> = {
  PENDIENTE:   { label: "Pendiente",   bg: "rgba(251,191,36,0.55)",  border: "rgba(251,191,36,0.8)" },
  EN_PROGRESO: { label: "En progreso", bg: "rgba(99,102,241,0.6)",   border: "rgba(99,102,241,0.85)" },
  RESUELTO:    { label: "Resuelto",    bg: "rgba(34,197,94,0.55)",   border: "rgba(34,197,94,0.8)" },
  CANCELADO:   { label: "Cancelado",   bg: "rgba(156,163,175,0.45)", border: "rgba(156,163,175,0.7)" },
};

export function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? { label: status, bg: "rgba(156,163,175,0.45)", border: "rgba(156,163,175,0.7)" };
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

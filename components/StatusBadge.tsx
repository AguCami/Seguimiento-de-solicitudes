const config: Record<string, { label: string; style: React.CSSProperties }> = {
  PENDIENTE:   { label: "Pendiente",   style: { background: "rgba(251,191,36,0.25)", border: "1px solid rgba(251,191,36,0.4)", color: "#92400e" } },
  EN_PROGRESO: { label: "En progreso", style: { background: "rgba(99,102,241,0.25)", border: "1px solid rgba(99,102,241,0.4)", color: "#3730a3" } },
  RESUELTO:    { label: "Resuelto",    style: { background: "rgba(52,211,153,0.25)", border: "1px solid rgba(52,211,153,0.4)", color: "#065f46" } },
  CANCELADO:   { label: "Cancelado",   style: { background: "rgba(156,163,175,0.25)", border: "1px solid rgba(156,163,175,0.4)", color: "#374151" } },
};

export function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? { label: status, style: { background: "rgba(156,163,175,0.2)", border: "1px solid rgba(156,163,175,0.3)", color: "#374151" } };
  return (
    <span style={{ ...c.style, backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}
      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold">
      {c.label}
    </span>
  );
}

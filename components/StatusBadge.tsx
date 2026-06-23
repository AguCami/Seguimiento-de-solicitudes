const config: Record<string, { label: string; className: string }> = {
  PENDIENTE:   { label: "Pendiente",   className: "bg-yellow-100 text-yellow-800" },
  EN_PROGRESO: { label: "En progreso", className: "bg-blue-100 text-blue-800" },
  RESUELTO:    { label: "Resuelto",    className: "bg-green-100 text-green-800" },
  CANCELADO:   { label: "Cancelado",   className: "bg-gray-100 text-gray-600" },
};

export function StatusBadge({ status }: { status: string }) {
  const c = config[status] ?? { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

const config: Record<string, { label: string; className: string }> = {
  BAJA:    { label: "Baja",    className: "bg-gray-100 text-gray-600" },
  MEDIA:   { label: "Media",   className: "bg-blue-100 text-blue-700" },
  ALTA:    { label: "Alta",    className: "bg-orange-100 text-orange-700" },
  URGENTE: { label: "Urgente", className: "bg-red-100 text-red-700" },
};

export function PriorityBadge({ priority }: { priority: string }) {
  const c = config[priority] ?? { label: priority, className: "bg-gray-100 text-gray-600" };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${c.className}`}>
      {c.label}
    </span>
  );
}

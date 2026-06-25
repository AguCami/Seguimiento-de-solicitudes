"use client";
import { useSearchParams } from "next/navigation";

export function ExportPDFListButton() {
  const searchParams = useSearchParams();

  function handleExport() {
    const params = new URLSearchParams(searchParams.toString());
    const url = `/dashboard/requests/print?${params.toString()}`;
    window.open(url, "_blank");
  }

  return (
    <button
      onClick={handleExport}
      className="btn-glass px-4 py-2 text-sm flex items-center gap-2"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 12h4M10 16h4M10 8h2" />
      </svg>
      PDF
    </button>
  );
}

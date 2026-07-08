"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PAGE_COUNT_OPTIONS = [1, 5, 10];

function PdfIcon({ size = 18 }: { size?: number }) {
  return (
    <svg fill="none" height={size} viewBox="0 0 24 24" width={size}>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
      />
      <path d="M14 2v6h6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
      <rect fill="#e5484d" height="7" rx="1.4" width="14" x="3" y="13.4" />
      <text fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="6.2" fontWeight="700" textAnchor="middle" x="10" y="18.6">
        PDF
      </text>
    </svg>
  );
}

export function GeneratePrintPdfButton() {
  const router = useRouter();
  const [pages, setPages] = useState(String(PAGE_COUNT_OPTIONS[0]));
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/qr/print-page-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pages: Number(pages) })
      });
      if (!res.ok) throw new Error("No se pudo generar el PDF.");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "qrpropina-pagina-qr.pdf";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      router.refresh();
    } catch (error) {
      console.error(error instanceof Error ? error.message : "No se pudo generar el PDF.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="qr-pdf-group">
      <label className="sr-only" htmlFor="pdfPages">Cantidad de páginas</label>
      <select
        disabled={loading}
        id="pdfPages"
        onChange={(e) => setPages(e.target.value)}
        value={pages}
      >
        {PAGE_COUNT_OPTIONS.map((option) => (
          <option key={option} value={option}>
            {option} página{option > 1 ? "s" : ""}
          </option>
        ))}
      </select>
      <button className="button secondary" disabled={loading} onClick={handleClick} type="button">
        {loading ? (
          <>
            <span className="btn-spinner" />
            Generando...
          </>
        ) : (
          <>
            <PdfIcon size={18} />
            Descargar PDF
          </>
        )}
      </button>
    </div>
  );
}

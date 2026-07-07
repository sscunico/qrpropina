"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText } from "lucide-react";

export function GeneratePrintPageButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      const res = await fetch("/api/admin/qr/print-page", { method: "POST" });
      if (!res.ok) throw new Error("No se pudo generar la página.");

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filenameMatch = disposition.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "qrpropina-pagina-qr.docx";

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);

      router.refresh();
    } catch (error) {
      console.error(error instanceof Error ? error.message : "No se pudo generar la página.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button className="button secondary" disabled={loading} onClick={handleClick} type="button">
      {loading ? (
        <>
          <span className="btn-spinner" />
          Generando...
        </>
      ) : (
        <>
          <FileText size={18} />
          Generar página
        </>
      )}
    </button>
  );
}

"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, ExternalLink, ImageDown, QrCode, Trash2 } from "lucide-react";
import QRCode from "qrcode";
import type { CreatorQrCode } from "@/lib/db";
import { deleteAdminQr } from "@/app/admin/actions";

type Row = CreatorQrCode & { url: string };

async function qrPngBlob(url: string): Promise<Blob> {
  const dataUrl = await QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
    color: { dark: "#101828", light: "#ffffff" },
  });
  const res = await fetch(dataUrl);
  return res.blob();
}

function CopyLinkButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(url);
      setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch { /* silencioso */ }
  }

  return (
    <button className={`icon-button${done ? " secondary" : ""}`} onClick={handleClick} title="Copiar link" type="button">
      {done ? <Check size={16} /> : <Copy size={15} />}
    </button>
  );
}

function CopyImageButton({ url }: { url: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await qrPngBlob(url);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch { /* silencioso */ } finally {
      setLoading(false);
    }
  }

  return (
    <button className={`icon-button${done ? " secondary" : ""}`} disabled={loading} onClick={handleClick} title="Copiar imagen QR" type="button">
      {loading ? <span className="btn-spinner btn-spinner--muted" /> : done ? <Check size={16} /> : <ImageDown size={15} />}
    </button>
  );
}

function DeleteButton({ id, disabled, onDelete }: { id: string; disabled: boolean; onDelete: (id: string) => Promise<void> }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending || disabled) return;
    setPending(true);
    await onDelete(id);
    setPending(false);
  }

  return (
    <button className="icon-button danger" disabled={pending || disabled} onClick={handleClick} title="Eliminar QR" type="button">
      {pending ? <span className="btn-spinner btn-spinner--light" /> : <Trash2 size={16} />}
    </button>
  );
}

export function AdminQrGrid({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    await deleteAdminQr(id);
    router.refresh();
  }

  if (rows.length === 0) {
    return <p className="muted">Todavía no hay QR generados. Creá el primero arriba.</p>;
  }

  return (
    <div className="qr-grid-wrap">
      <div className="table-responsive">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>URL</th>
              <th className="table-actions-heading"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isDeleting = deletingId === row.id;
              return (
                <tr key={row.id} style={{ opacity: isDeleting ? 0.4 : 1, pointerEvents: isDeleting ? "none" : undefined, transition: "opacity 200ms" }}>
                  <td>
                    <span className="section-title-with-icon" style={{ fontWeight: 700 }}>
                      {isDeleting
                        ? <span className="btn-spinner btn-spinner--muted" style={{ flexShrink: 0 }} />
                        : <QrCode size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />}
                      {row.qrId}
                    </span>
                  </td>
                  <td>
                    <code style={{ fontSize: "0.8rem" }}>{row.url}</code>
                  </td>
                  <td>
                    <div className="table-actions">
                      <a className="icon-button" href={row.url} rel="noopener noreferrer" target="_blank" title="Abrir en nueva pestaña">
                        <ExternalLink size={15} />
                      </a>
                      <CopyLinkButton url={row.url} />
                      <CopyImageButton url={row.url} />
                      <DeleteButton disabled={isDeleting} id={row.id} onDelete={handleDelete} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

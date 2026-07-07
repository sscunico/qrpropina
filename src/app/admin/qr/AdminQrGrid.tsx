"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Copy, Eye, ExternalLink, FileText, ImageDown, QrCode, Trash2, X } from "lucide-react";
import { deleteAdminQr, deleteAdminQrBulk } from "@/app/admin/actions";
import { DragScrollArea } from "@/components/DragScrollArea";
import type { CreatorQrCode } from "@/lib/db";

type Row = CreatorQrCode & { url: string; image: string };

async function qrPngBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}

function QrRowIcon({ isBulkPrint, isDeleting }: { isBulkPrint: boolean; isDeleting: boolean }) {
  if (isDeleting) {
    return <span className="btn-spinner btn-spinner--muted admin-qr-row-spinner" />;
  }

  return isBulkPrint ? <FileText size={15} /> : <QrCode size={15} />;
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
    } catch {
      // El copiado puede fallar si el navegador bloquea clipboard.
    }
  }

  return (
    <button
      aria-label="Copiar link"
      className="icon-button secondary"
      data-no-drag-scroll
      onClick={handleClick}
      title="Copiar link"
      type="button"
    >
      {done ? <Check size={16} /> : <Copy size={15} />}
    </button>
  );
}

function CopyImageButton({ image }: { image: string }) {
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function handleClick() {
    if (loading) return;

    setLoading(true);
    try {
      const blob = await qrPngBlob(image);
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      setDone(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setDone(false), 1800);
    } catch {
      // El copiado de imagen depende del soporte del navegador.
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      aria-label="Copiar imagen QR"
      className="icon-button secondary"
      data-no-drag-scroll
      disabled={loading}
      onClick={handleClick}
      title="Copiar imagen QR"
      type="button"
    >
      {loading ? <span className="btn-spinner btn-spinner--muted" /> : done ? <Check size={16} /> : <ImageDown size={15} />}
    </button>
  );
}

function ViewQrButton({ qrId, image }: { qrId: string; image: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        aria-label="Ver QR"
        className="icon-button secondary"
        data-no-drag-scroll
        onClick={() => setOpen(true)}
        title="Ver QR"
        type="button"
      >
        <Eye size={15} />
      </button>

      {open ? (
        <div className="qr-preview-overlay" onClick={() => setOpen(false)}>
          <div className="qr-preview-modal" onClick={(e) => e.stopPropagation()}>
            <button aria-label="Cerrar" className="qr-preview-close" onClick={() => setOpen(false)} type="button">
              <X size={18} />
            </button>
            <img alt={`QR ${qrId}`} className="qr-preview-image" src={image} />
          </div>
        </div>
      ) : null}
    </>
  );
}

function DeleteButton({ disabled, id, onDelete }: { disabled: boolean; id: string; onDelete: (id: string) => Promise<void> }) {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    if (pending || disabled) return;

    setPending(true);
    await onDelete(id);
    setPending(false);
  }

  return (
    <button
      aria-label="Eliminar QR"
      className="icon-button danger"
      data-no-drag-scroll
      disabled={pending || disabled}
      onClick={handleClick}
      title="Eliminar QR"
      type="button"
    >
      {pending ? <span className="btn-spinner btn-spinner--light" /> : <Trash2 size={16} />}
    </button>
  );
}

export function AdminQrGrid({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function handleDelete(id: string) {
    setDeletingIds((prev) => new Set(prev).add(id));
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });

    await deleteAdminQr(id);
    router.refresh();
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.size === rows.length ? new Set() : new Set(rows.map((row) => row.id))));
  }

  async function handleBulkDelete() {
    if (bulkDeleting || selectedIds.size === 0) return;

    const ids = Array.from(selectedIds);
    setBulkDeleting(true);
    setDeletingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
    setSelectedIds(new Set());

    await deleteAdminQrBulk(ids);
    setBulkDeleting(false);
    router.refresh();
  }

  if (rows.length === 0) {
    return <p className="muted">Todavía no hay QR generados. Creá el primero arriba.</p>;
  }

  const allSelected = rows.length > 0 && selectedIds.size === rows.length;

  return (
    <div className="qr-grid-wrap">
      {selectedIds.size > 0 ? (
        <div className="qr-form-actions admin-qr-bulk-actions">
          <span className="muted">
            {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
          </span>
          <button className="button danger" disabled={bulkDeleting} onClick={handleBulkDelete} type="button">
            {bulkDeleting ? (
              <>
                <span className="btn-spinner" />
                Eliminando...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Eliminar seleccionados
              </>
            )}
          </button>
        </div>
      ) : null}

      <DragScrollArea ariaLabel="Tabla de QR creados" className="table-responsive qr-table-scroll">
        <table className="table admin-qr-table">
          <thead>
            <tr>
              <th className="qr-select-heading">
                <input aria-label="Seleccionar todos" checked={allSelected} data-no-drag-scroll onChange={toggleSelectAll} type="checkbox" />
              </th>
              <th>ID</th>
              <th>URL</th>
              <th className="table-actions-heading"><span className="sr-only">Acciones</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isDeleting = deletingIds.has(row.id);
              const isSelected = selectedIds.has(row.id);

              return (
                <tr className={isDeleting ? "admin-qr-row deleting" : "admin-qr-row"} key={row.id}>
                  <td>
                    <input
                      aria-label={`Seleccionar ${row.qrId}`}
                      checked={isSelected}
                      data-no-drag-scroll
                      disabled={isDeleting}
                      onChange={() => toggleSelected(row.id)}
                      type="checkbox"
                    />
                  </td>
                  <td>
                    <span className="section-title-with-icon admin-qr-id">
                      <QrRowIcon isBulkPrint={row.isBulkPrint} isDeleting={isDeleting} />
                      {row.qrId}
                    </span>
                  </td>
                  <td><code>{row.url}</code></td>
                  <td>
                    <div className="table-actions" data-no-drag-scroll>
                      <a aria-label="Abrir en nueva pestaña" className="icon-button primary" href={row.url} rel="noopener noreferrer" target="_blank" title="Abrir en nueva pestaña">
                        <ExternalLink size={15} />
                      </a>
                      <CopyLinkButton url={row.url} />
                      <ViewQrButton image={row.image} qrId={row.qrId} />
                      <CopyImageButton image={row.image} />
                      <DeleteButton disabled={isDeleting} id={row.id} onDelete={handleDelete} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </DragScrollArea>

      <div className="admin-qr-card-list">
        {rows.map((row) => {
          const isDeleting = deletingIds.has(row.id);
          const isSelected = selectedIds.has(row.id);

          return (
            <article className={isDeleting ? "admin-qr-card deleting" : "admin-qr-card"} key={`${row.id}-card`}>
              <label className="admin-qr-card-check">
                <input
                  aria-label={`Seleccionar ${row.qrId}`}
                  checked={isSelected}
                  disabled={isDeleting}
                  onChange={() => toggleSelected(row.id)}
                  type="checkbox"
                />
                <span>Seleccionar</span>
              </label>

              <div className="admin-qr-card-main">
                <div className="section-title-with-icon admin-qr-id">
                  <QrRowIcon isBulkPrint={row.isBulkPrint} isDeleting={isDeleting} />
                  <strong>{row.qrId}</strong>
                </div>
                <code>{row.url}</code>
                <div className="admin-qr-card-badges">
                  <span className={row.isAutoInstallable ? "pill ok" : "pill"}>
                    {row.isAutoInstallable ? "Auto instalable" : "Manual"}
                  </span>
                  {row.isBulkPrint ? <span className="pill warn">Impresión</span> : null}
                </div>
              </div>

              <div className="table-actions admin-qr-card-actions">
                <a aria-label="Abrir en nueva pestaña" className="icon-button primary" href={row.url} rel="noopener noreferrer" target="_blank" title="Abrir en nueva pestaña">
                  <ExternalLink size={15} />
                </a>
                <CopyLinkButton url={row.url} />
                <ViewQrButton image={row.image} qrId={row.qrId} />
                <CopyImageButton image={row.image} />
                <DeleteButton disabled={isDeleting} id={row.id} onDelete={handleDelete} />
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { BadgePercent, ExternalLink, QrCode, Trash2, X } from "lucide-react";
import { DragScrollArea } from "@/components/DragScrollArea";

type CreatorGridRow = {
  id: string;
  displayName: string;
  label: string;
  photoUrl: string | null;
  publicUrl: string;
  commissionPercent: number;
  receivedLabel: string;
  platformFeeLabel: string;
  mercadoPagoConnected: boolean;
  slug: string;
};

type ColumnKey = "avatar" | "creator" | "mp" | "commission" | "received" | "actions";

type Column = {
  key: ColumnKey;
  header: string;
  hiddenHeader?: boolean;
  thClassName?: string;
  render: (row: CreatorGridRow) => ReactNode;
};

type CreatorsGridProps = {
  rows: CreatorGridRow[];
};

const STORAGE_KEY = "qrpropina.creators.columns.v2";
const DEFAULT_ORDER: ColumnKey[] = ["avatar", "creator", "mp", "commission", "received", "actions"];

function normalizeOrder(value: unknown): ColumnKey[] {
  if (!Array.isArray(value)) {
    return DEFAULT_ORDER;
  }

  const valid = value.filter((item): item is ColumnKey => DEFAULT_ORDER.includes(item as ColumnKey));
  const missing = DEFAULT_ORDER.filter((key) => !valid.includes(key));
  return [...valid, ...missing];
}

function moveItem(items: ColumnKey[], from: ColumnKey, to: ColumnKey) {
  if (from === to) return items;

  const next = [...items];
  const fromIndex = next.indexOf(from);
  const toIndex = next.indexOf(to);
  if (fromIndex === -1 || toIndex === -1) return items;

  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function CreatorsGrid({ rows }: CreatorsGridProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<ColumnKey[]>(DEFAULT_ORDER);
  const [draggingColumn, setDraggingColumn] = useState<ColumnKey | null>(null);
  const [overColumn, setOverColumn] = useState<ColumnKey | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(false);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryString = searchParams.toString();
  const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

  function showToast() {
    setToast(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(false), 5000);
  }

  function dismissToast() {
    setToast(false);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }

  async function handleDeleteConfirm() {
    if (!confirmId) return;
    setDeleting(true);
    const formData = new FormData();
    formData.append("creatorId", confirmId);
    formData.append("next", currentUrl);
    await fetch("/api/admin/creadores/delete", { method: "POST", body: formData });
    setConfirmId(null);
    setDeleting(false);
    router.refresh();
    showToast();
  }

  useEffect(() => {
    try {
      setOrder(normalizeOrder(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "null")));
    } catch {
      setOrder(DEFAULT_ORDER);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(order));
  }, [isReady, order]);

  const columns = useMemo<Record<ColumnKey, Column>>(
    () => ({
      avatar: {
        key: "avatar",
        header: "Foto",
        hiddenHeader: true,
        thClassName: "creator-avatar-heading",
        render: (row) => (
          <td className="creator-avatar-cell" key={`${row.id}-avatar`}>
            <img
              alt=""
              decoding="async"
              height={44}
              referrerPolicy="no-referrer"
              src={row.photoUrl || "/default-profile.svg"}
              width={44}
            />
          </td>
        )
      },
      creator: {
        key: "creator",
        header: "Creador",
        render: (row) => (
          <td className="creator-name-cell" key={`${row.id}-creator`}>
            <strong>{row.displayName}</strong>
            <span>{row.label}</span>
            <code className="creator-public-url">{row.publicUrl}</code>
          </td>
        )
      },
      mp: {
        key: "mp",
        header: "MP",
        hiddenHeader: true,
        render: (row) => (
          <td key={`${row.id}-mp`} style={{ minWidth: 120, textAlign: "center" }}>
            {row.mercadoPagoConnected ? (
              <div className="mp-connect-button mp-connect-button--connected mp-connect-button--mini" aria-label="Mercado Pago integrado" style={{ margin: "0 auto" }}>
                <img alt="Mercado Pago" src="/mp-logo.svg" />
              </div>
            ) : (
              <span className="muted" style={{ fontSize: "0.8rem" }}>Sin integrar</span>
            )}
          </td>
        )
      },
      commission: {
        key: "commission",
        header: "Comisión",
        render: (row) => (
          <td key={`${row.id}-commission`}>
            <span className="pill"><BadgePercent size={14} />{row.commissionPercent}%</span>
          </td>
        )
      },
      received: {
        key: "received",
        header: "Propinas",
        render: (row) => (
          <td key={`${row.id}-received`}>
            <span className="tip-split-value">
              <strong>{row.receivedLabel}</strong>
              <span>/</span>
              <strong>{row.platformFeeLabel}</strong>
            </span>
          </td>
        )
      },
      actions: {
        key: "actions",
        header: "Acciones",
        hiddenHeader: true,
        thClassName: "table-actions-heading",
        render: (row) => {
          return (
            <td key={`${row.id}-actions`}>
              <div className="table-actions">
                <Link className="icon-button primary" href={`/admin/creadores/${row.id}`} title="Ver QR"><QrCode size={18} /></Link>
                <Link className="icon-button secondary" href={`/t/${row.slug}`} title="Abrir página pública"><ExternalLink size={18} /></Link>
                <button className="icon-button danger" title="Borrar creador" type="button" onClick={() => setConfirmId(row.id)}>
                  <Trash2 size={18} />
                </button>
              </div>
            </td>
          );
        }
      }
    }),
    [currentUrl]
  );

  function handleDrop(target: ColumnKey) {
    if (!draggingColumn) return;

    setOrder((current) => moveItem(current, draggingColumn, target));
    setDraggingColumn(null);
    setOverColumn(null);
  }

  return (
    <div style={{ display: "contents" }}>
    {confirmId && (
      <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.45)", display: "grid", placeItems: "center" }}>
        <div style={{ background: "var(--surface)", borderRadius: "var(--radius)", padding: "28px 28px 24px", width: "min(380px, calc(100vw - 32px))", boxShadow: "0 20px 50px rgba(26,31,54,0.2)", position: "relative" }}>
          <button
            onClick={() => setConfirmId(null)}
            style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 4, display: "flex" }}
            title="Cerrar"
            type="button"
          >
            <X size={18} />
          </button>
          <h3 style={{ margin: "0 0 8px", fontSize: "1.05rem" }}>Eliminar creador</h3>
          <p style={{ margin: "0 0 24px", color: "var(--muted)", fontSize: "0.95rem" }}>¿Está seguro que quiere eliminar este creador? Esta acción no se puede deshacer.</p>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="button secondary" disabled={deleting} onClick={() => setConfirmId(null)} type="button">No</button>
            <button className="button danger" disabled={deleting} onClick={handleDeleteConfirm} type="button">{deleting ? "Eliminando…" : "Sí, eliminar"}</button>
          </div>
        </div>
      </div>
    )}

    {toast && (
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 300, minWidth: 260, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)", padding: "14px 16px", boxShadow: "0 8px 32px rgba(26,31,54,0.16)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontWeight: 700, color: "var(--text)" }}>Creador eliminado</span>
        <button onClick={dismissToast} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2, display: "flex" }} title="Cerrar" type="button">
          <X size={16} />
        </button>
      </div>
    )}

    <DragScrollArea ariaLabel="Tabla de creadores" className="table-responsive creators-table-scroll">
      <table className="table creators-table">
        <thead>
          <tr>
            {order.map((key) => {
              const column = columns[key];
              const isDragging = draggingColumn === key;
              const isOver = overColumn === key && draggingColumn !== key;

              return (
                <th
                  className={[column.thClassName, "reorderable-column", isDragging ? "dragging-column" : null, isOver ? "drop-target-column" : null].filter(Boolean).join(" ")}
                  data-no-drag-scroll
                  draggable
                  key={key}
                  onDragEnd={() => {
                    setDraggingColumn(null);
                    setOverColumn(null);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setOverColumn(key);
                  }}
                  onDragStart={(event) => {
                    setDraggingColumn(key);
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", key);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    handleDrop(key);
                  }}
                >
                  <span className={column.hiddenHeader ? "sr-only" : undefined}>{column.header}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {order.map((key) => columns[key].render(row))}
            </tr>
          ))}
        </tbody>
      </table>
    </DragScrollArea>
    </div>
  );
}

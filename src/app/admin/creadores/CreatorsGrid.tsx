"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import { BadgePercent, ExternalLink, QrCode, Trash2 } from "lucide-react";
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

type ColumnKey = "avatar" | "creator" | "commission" | "received" | "actions";

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

const STORAGE_KEY = "qrpropina.creators.columns";
const DEFAULT_ORDER: ColumnKey[] = ["avatar", "creator", "commission", "received", "actions"];

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
  const [order, setOrder] = useState<ColumnKey[]>(DEFAULT_ORDER);
  const [draggingColumn, setDraggingColumn] = useState<ColumnKey | null>(null);
  const [overColumn, setOverColumn] = useState<ColumnKey | null>(null);
  const [isReady, setIsReady] = useState(false);
  const queryString = searchParams.toString();
  const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

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
      commission: {
        key: "commission",
        header: "Comisión",
        render: (row) => (
          <td key={`${row.id}-commission`}>
            <div className="commission-stack">
              <span className="pill"><BadgePercent size={14} />{row.commissionPercent}%</span>
              <span className={row.mercadoPagoConnected ? "mp-status-box ok" : "mp-status-box warn"}>
                {row.mercadoPagoConnected ? "Integrado" : "Sin integrar"}
              </span>
            </div>
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
                <form action="/api/admin/creadores/delete" method="post">
                  <input name="creatorId" type="hidden" value={row.id} />
                  <input name="next" type="hidden" value={currentUrl} />
                  <button className="icon-button danger" title="Borrar creador" type="submit">
                    <Trash2 size={18} />
                  </button>
                </form>
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
  );
}

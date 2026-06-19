import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { listNotificationsForCreator } from "@/lib/db";
import { MarkReadOnMount } from "./MarkReadOnMount";
import { deleteNotificationAction } from "./actions";
import { Trash2 } from "lucide-react";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const dynamic = "force-dynamic";

export default async function NotificacionesPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  const creatorId = session.creatorId ?? null;
  const { items, total, totalPages } = creatorId
    ? await listNotificationsForCreator(creatorId, page)
    : { items: [], total: 0, totalPages: 1 };

  return (
    <main className="page">
      <MarkReadOnMount />

      <div className="section-row">
        <div>
          <h1>Notificaciones</h1>
          <p className="muted">
            {total === 0
              ? "No tenés notificaciones."
              : `${total} notificación${total !== 1 ? "es" : ""} en total`}
          </p>
        </div>
      </div>

      <section className="panel">
        {items.length === 0 ? (
          <div className="notif-empty">
            <Bell size={32} strokeWidth={1.5} />
            <p>No hay notificaciones para mostrar.</p>
          </div>
        ) : (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Notificación</th>
                  <th>Fecha</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((n) => (
                  <tr className={n.isRead ? undefined : "notif-row-unread"} key={n.id}>
                    <td>
                      <strong>{n.title}</strong>
                      {n.body ? <p className="notif-body">{n.body}</p> : null}
                    </td>
                    <td className="muted notif-date">
                      {new Date(n.createdAt).toLocaleString("es-AR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </td>
                    <td className="notif-actions">
                      <form action={deleteNotificationAction}>
                        <input name="id" type="hidden" value={n.id} />
                        <button
                          className="icon-button ghost"
                          title="Eliminar notificación"
                          type="submit"
                        >
                          <Trash2 size={16} />
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 ? (
              <div className="pagination">
                {page > 1 ? (
                  <Link className="button secondary" href={`?page=${page - 1}`}>
                    <ChevronLeft size={16} />
                    Anterior
                  </Link>
                ) : null}
                <span className="muted pagination-info">
                  Página {page} de {totalPages}
                </span>
                {page < totalPages ? (
                  <Link className="button secondary" href={`?page=${page + 1}`}>
                    Siguiente
                    <ChevronRight size={16} />
                  </Link>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

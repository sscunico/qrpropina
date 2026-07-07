import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Bell } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { ADMIN_NOTIFICATIONS_ID, listNotificationsForCreator } from "@/lib/db";
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

  const targetId =
    session.role === "admin" ? ADMIN_NOTIFICATIONS_ID : (session.creatorId ?? null);

  const { items, total, totalPages } = targetId
    ? await listNotificationsForCreator(targetId, page)
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
            <div className="table-scroll-wrap">
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
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                        {n.photoUrl ? (
                          <img
                            alt=""
                            referrerPolicy="no-referrer"
                            src={n.photoUrl}
                            style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0, marginTop: 2 }}
                          />
                        ) : null}
                        <div style={{ flex: 1 }}>
                          <strong>{n.title}</strong>
                          {n.body ? <p className="notif-body">{n.body}</p> : null}
                        </div>
                        {n.imageUrl ? (
                          <img
                            alt="QR"
                            src={n.imageUrl}
                            style={{ width: 56, height: 56, borderRadius: 6, flexShrink: 0 }}
                          />
                        ) : null}
                      </div>
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
                        <input name="creatorId" type="hidden" value={targetId ?? ""} />
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
            </div>

            <div className="notif-card-list">
              {items.map((n) => (
                <article className={n.isRead ? "notif-card" : "notif-card unread"} key={`${n.id}-card`}>
                  <div className="notif-card-main">
                    {n.photoUrl ? (
                      <img
                        alt=""
                        className="notif-card-avatar"
                        referrerPolicy="no-referrer"
                        src={n.photoUrl}
                      />
                    ) : null}
                    <div className="notif-card-copy">
                      <strong>{n.title}</strong>
                      {n.body ? <p className="notif-body">{n.body}</p> : null}
                      <span className="muted notif-card-date">
                        {new Date(n.createdAt).toLocaleString("es-AR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    {n.imageUrl ? (
                      <img
                        alt="QR"
                        className="notif-card-image"
                        src={n.imageUrl}
                      />
                    ) : null}
                  </div>
                  <form action={deleteNotificationAction} className="notif-card-actions">
                    <input name="id" type="hidden" value={n.id} />
                    <input name="creatorId" type="hidden" value={targetId ?? ""} />
                    <button
                      className="button secondary"
                      title="Eliminar notificación"
                      type="submit"
                    >
                      <Trash2 size={16} />
                      Eliminar
                    </button>
                  </form>
                </article>
              ))}
            </div>

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

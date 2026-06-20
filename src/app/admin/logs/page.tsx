import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { listPaymentEvents } from "@/lib/db";

type Props = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export const dynamic = "force-dynamic";
const PAGE_SIZE_OPTIONS = [25, 50, 100, 200];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

function tryParseJson(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function eventTypeBadgeClass(eventType: string) {
  if (eventType.includes("error")) return "pill warn";
  if (eventType.includes("response")) return "pill ok";
  return "pill";
}

function normalizePageSize(value?: string) {
  const parsed = parseInt(value || "50", 10);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : 50;
}

function buildHref(page: number, pageSize: number) {
  return `/admin/logs?page=${page}&pageSize=${pageSize}`;
}

export default async function AdminLogsPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const params = await searchParams;
  const pageSize = normalizePageSize(params.pageSize);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const allEvents = await listPaymentEvents(5000);
  const total = allEvents.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const events = allEvents.slice(offset, offset + pageSize);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Herramientas</p>
          <h1>Logs</h1>
          <p className="muted">Eventos técnicos y llamadas de pago registradas por la app.</p>
        </div>
      </section>

      <section className="panel">
        <div className="admin-table-toolbar">
          <p className="muted">{total === 0 ? "No hay logs." : `${total} log${total !== 1 ? "s" : ""} en total`}</p>
          <form className="page-size-form" method="get">
            <input name="page" type="hidden" value="1" />
            <label htmlFor="pageSize">Items por página</label>
            <select id="pageSize" name="pageSize" defaultValue={pageSize.toString()}>
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <button className="button secondary" type="submit">Aplicar</button>
          </form>
        </div>

        {events.length === 0 ? (
          <p className="muted">No hay eventos registrados todavía. Generá una propina para ver los logs acá.</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table logs-table">
                <thead>
                  <tr>
                    <th>Evento</th>
                    <th>Fecha</th>
                    <th>Tip</th>
                    <th>URL</th>
                    <th>Payload</th>
                  </tr>
                </thead>
                <tbody>
                  {events.map((event) => {
                    const parsed = tryParseJson(event.payload);
                    return (
                      <tr key={event.id}>
                        <td><span className={eventTypeBadgeClass(event.eventType)}>{event.eventType}</span></td>
                        <td className="muted log-date-cell">{formatDateTime(event.createdAt)}</td>
                        <td><code>{event.tipId || "-"}</code></td>
                        <td>
                          {parsed?.url ? (
                            <div className="log-url-row compact"><span className="log-method">{parsed.method ?? "GET"}</span><code className="log-url">{parsed.url}</code></div>
                          ) : <span className="muted">-</span>}
                        </td>
                        <td>
                          <details className="log-details">
                            <summary>Ver</summary>
                            <pre className="log-payload">{parsed ? JSON.stringify(parsed.body ?? parsed, null, 2) : event.payload}</pre>
                          </details>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Paginación de logs">
              {safePage > 1 ? <Link className="button secondary" href={buildHref(safePage - 1, pageSize)}><ChevronLeft size={16} />Anterior</Link> : null}
              <span className="muted pagination-info">Página {safePage} de {totalPages}</span>
              {safePage < totalPages ? <Link className="button secondary" href={buildHref(safePage + 1, pageSize)}>Siguiente<ChevronRight size={16} /></Link> : null}
            </nav>
          </>
        )}
      </section>
    </main>
  );
}

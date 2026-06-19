import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { listPaymentEvents } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "medium"
  }).format(new Date(value));
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

export default async function AdminLogsPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const events = await listPaymentEvents(300);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <Link className="back-link" href="/admin">
            <ArrowLeft size={16} />
            Panel
          </Link>
          <p className="kicker">Administración</p>
          <h1>Logs de API</h1>
          <p className="muted">
            Llamadas enviadas a Mercado Pago y eventos de pago. Últimos {events.length} registros.
          </p>
        </div>
      </section>

      {events.length === 0 ? (
        <section className="panel">
          <p className="muted">No hay eventos registrados todavía. Generá una propina para ver los logs aquí.</p>
        </section>
      ) : (
        <section className="log-list">
          {events.map((event) => {
            const parsed = tryParseJson(event.payload);
            return (
              <article className="log-entry panel" key={event.id}>
                <div className="log-entry-header">
                  <span className={eventTypeBadgeClass(event.eventType)}>
                    {event.eventType}
                  </span>
                  <span className="muted log-meta">{formatDateTime(event.createdAt)}</span>
                  {event.tipId && (
                    <span className="muted log-meta">tip: {event.tipId}</span>
                  )}
                </div>
                {parsed?.url && (
                  <div className="log-url-row">
                    <span className="log-method">{parsed.method ?? "GET"}</span>
                    <code className="log-url">{parsed.url}</code>
                  </div>
                )}
                <pre className="log-payload">
                  {parsed
                    ? JSON.stringify(parsed.body ?? parsed, null, 2)
                    : event.payload}
                </pre>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

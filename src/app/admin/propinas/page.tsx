import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { DragScrollArea } from "@/components/DragScrollArea";
import { getAdminSession } from "@/lib/auth";
import { listApprovedTipsForCreator, listApprovedTipsWithCreators } from "@/lib/db";
import { formatMoney, centsToPesos } from "@/lib/money";

export const dynamic = "force-dynamic";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export default async function PropinasPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/login");
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);

  if (session.role === "admin") {
    const { items, total, totalPages } = await listApprovedTipsWithCreators(page);

    return (
      <main className="page">
        <section className="hero-row">
          <div>
            <p className="kicker">Administración</p>
            <h1>Propinas</h1>
            <p className="muted">
              {total === 0
                ? "Aún no hay propinas aprobadas."
                : `${total} propina${total !== 1 ? "s" : ""} aprobada${total !== 1 ? "s" : ""} en total`}
            </p>
          </div>
        </section>

        <section className="panel">
          {items.length === 0 ? (
            <div className="notif-empty">
              <DollarSign size={32} strokeWidth={1.5} />
              <p>No hay propinas para mostrar.</p>
            </div>
          ) : (
            <>
              <DragScrollArea ariaLabel="Tabla de propinas" className="table-scroll">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Creador</th>
                      <th>Fecha y hora</th>
                      <th className="tip-col-amount">Recibe <InfoTooltip text="Monto que recibe el creador luego de descontar la comisión de la plataforma." position="bottom" /></th>
                      <th className="tip-col-pct">Comisión <InfoTooltip text="Porcentaje retenido por la plataforma sobre esta propina." position="bottom" /></th>
                      <th className="tip-col-fee">Comisión $ <InfoTooltip text="Monto en pesos retenido por la plataforma en esta propina." position="bottom" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((tip) => {
                      const receivedCents = tip.amountCents - tip.platformFeeCents;
                      return (
                        <tr key={tip.id}>
                          <td>
                            <div className="tip-creator-cell">
                              {tip.creator.photoUrl ? (
                                <img
                                  alt=""
                                  className="tip-creator-avatar"
                                  referrerPolicy="no-referrer"
                                  src={tip.creator.photoUrl}
                                />
                              ) : (
                                <div className="tip-creator-avatar tip-creator-avatar-fallback">
                                  {tip.creator.displayName.slice(0, 2).toUpperCase()}
                                </div>
                              )}
                              <span>{tip.creator.displayName}</span>
                            </div>
                          </td>
                          <td className="muted notif-date">{formatDate(tip.createdAt)}</td>
                          <td className="tip-col-amount"><strong>{formatMoney(receivedCents)}</strong></td>
                          <td className="tip-col-pct muted">{tip.creator.commissionPercent}%</td>
                          <td className="tip-col-fee muted">{formatMoney(tip.platformFeeCents)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </DragScrollArea>

              {totalPages > 1 ? (
                <div className="pagination">
                  {page > 1 ? (
                    <Link className="button secondary" href={`?page=${page - 1}`}>
                      <ChevronLeft size={16} />
                      Anterior
                    </Link>
                  ) : null}
                  <span className="muted pagination-info">Página {page} de {totalPages}</span>
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

  // Vista creador
  const creatorId = session.creatorId;
  if (!creatorId) {
    redirect("/login");
  }

  const { items, total, totalPages } = await listApprovedTipsForCreator(creatorId, page);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Mis ingresos</p>
          <h1>Propinas</h1>
          <p className="muted">
            {total === 0
              ? "Aún no recibiste propinas."
              : `${total} propina${total !== 1 ? "s" : ""} recibida${total !== 1 ? "s" : ""}`}
          </p>
        </div>
      </section>

      <section className="panel">
        {items.length === 0 ? (
          <div className="notif-empty">
            <DollarSign size={32} strokeWidth={1.5} />
            <p>Todavía no recibiste propinas.</p>
          </div>
        ) : (
          <>
            <DragScrollArea ariaLabel="Tabla de mis propinas" className="table-scroll">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha y hora</th>
                    <th className="tip-col-amount">Cantidad que recibís <InfoTooltip text="Monto acreditado en tu cuenta de Mercado Pago, descontada la comisión de la plataforma." position="bottom" /></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tip) => {
                    const receivedCents = tip.amountCents - tip.platformFeeCents;
                    return (
                      <tr key={tip.id}>
                        <td className="muted notif-date">{formatDate(tip.createdAt)}</td>
                        <td className="tip-col-amount"><strong>{formatMoney(receivedCents)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </DragScrollArea>

            {totalPages > 1 ? (
              <div className="pagination">
                {page > 1 ? (
                  <Link className="button secondary" href={`?page=${page - 1}`}>
                    <ChevronLeft size={16} />
                    Anterior
                  </Link>
                ) : null}
                <span className="muted pagination-info">Página {page} de {totalPages}</span>
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

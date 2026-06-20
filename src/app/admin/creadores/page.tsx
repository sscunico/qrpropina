import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgePercent, ChevronLeft, ChevronRight, ExternalLink, Plus, QrCode, Trash2, Wallet } from "lucide-react";
import { createCreator, deleteCreator } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/auth";
import { appUrl } from "@/lib/env";
import { getAppSettings, isApprovedTip, listCreatorsWithRecentTips } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { sellerIsConnected } from "@/lib/mercadopago";

type Props = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export const dynamic = "force-dynamic";
const PAGE_SIZE_OPTIONS = [9, 18, 36, 72];

function normalizePageSize(value?: string) {
  const parsed = parseInt(value || "9", 10);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : 9;
}

function buildHref(page: number, pageSize: number) {
  return `/admin/creadores?page=${page}&pageSize=${pageSize}`;
}

export default async function AdminCreatorsPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const params = await searchParams;
  const pageSize = normalizePageSize(params.pageSize);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const [allCreators, settings] = await Promise.all([listCreatorsWithRecentTips(5), getAppSettings()]);
  const total = allCreators.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const offset = (safePage - 1) * pageSize;
  const creators = allCreators.slice(offset, offset + pageSize);
  const commissionPercent = settings.transferDiscountPercent;

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Administración</p>
          <h1>Creadores</h1>
          <p className="muted">Gestiona perfiles, links públicos y QR.</p>
        </div>
        <Link className="button dark" href="#nuevo"><Plus size={18} />Nuevo creador</Link>
      </section>

      <section className="panel">
        <div className="admin-table-toolbar">
          <p className="muted">{total === 0 ? "No hay creadores." : `${total} creador${total !== 1 ? "es" : ""} en total`}</p>
          <form className="page-size-form" method="get">
            <input name="page" type="hidden" value="1" />
            <label htmlFor="pageSize">Items por página</label>
            <select id="pageSize" name="pageSize" defaultValue={pageSize.toString()}>
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <button className="button secondary" type="submit">Aplicar</button>
          </form>
        </div>

        {creators.length === 0 ? (
          <p className="muted">Todavía no hay creadores cargados.</p>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table creators-table">
                <thead>
                  <tr>
                    <th className="creator-avatar-heading"><span className="sr-only">Foto</span></th>
                    <th>Creador</th>
                    <th>Link público</th>
                    <th>Comisión</th>
                    <th>Aprobado</th>
                    <th>Mercado Pago</th>
                    <th className="table-actions-heading"><span className="sr-only">Acciones</span></th>
                  </tr>
                </thead>
                <tbody>
                  {creators.map((creator) => {
                    const publicUrl = `${appUrl()}/t/${creator.slug}`;
                    const approved = creator.tips.filter(isApprovedTip);
                    const received = approved.reduce((sum, tip) => sum + tip.amountCents, 0);
                    const creatorLabel = [creator.role, creator.locationName].filter(Boolean).join(" - ") || "Creador";
                    const isMercadoPagoConnected = sellerIsConnected(creator);
                    const deleteCreatorWithId = deleteCreator.bind(null, creator.id);

                    return (
                      <tr key={creator.id}>
                        <td className="creator-avatar-cell">
                          <img
                            alt=""
                            decoding="async"
                            height={44}
                            referrerPolicy="no-referrer"
                            src={creator.photoUrl || "/default-profile.svg"}
                            width={44}
                          />
                        </td>
                        <td className="creator-name-cell">
                          <strong>{creator.displayName}</strong>
                          <span>{creatorLabel}</span>
                        </td>
                        <td><code className="table-url">{publicUrl}</code></td>
                        <td><span className="pill"><BadgePercent size={14} />{commissionPercent}%</span></td>
                        <td><strong>{formatMoney(received)}</strong></td>
                        <td>
                          <span className={isMercadoPagoConnected ? "pill ok" : "pill warn"}>
                            <Wallet size={14} />
                            {isMercadoPagoConnected ? "Integrado" : "Sin integrar"}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <Link className="icon-button primary" href={`/admin/creadores/${creator.id}`} title="Ver QR"><QrCode size={18} /></Link>
                            <Link className="icon-button secondary" href={`/t/${creator.slug}`} title="Abrir página pública"><ExternalLink size={18} /></Link>
                            <form action={deleteCreatorWithId}>
                              <button className="icon-button danger" title="Borrar creador" type="submit">
                                <Trash2 size={18} />
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <nav className="pagination" aria-label="Paginación de creadores">
              {safePage > 1 ? <Link className="button secondary" href={buildHref(safePage - 1, pageSize)}><ChevronLeft size={16} />Anterior</Link> : null}
              <span className="muted pagination-info">Página {safePage} de {totalPages}</span>
              {safePage < totalPages ? <Link className="button secondary" href={buildHref(safePage + 1, pageSize)}>Siguiente<ChevronRight size={16} /></Link> : null}
            </nav>
          </>
        )}
      </section>

      <section className="panel" id="nuevo" style={{ marginTop: 24 }}>
        <div className="section-row compact-row">
          <div>
            <h2>Nuevo creador</h2>
            <p className="muted">El alias será parte del link público: /t/alias.</p>
          </div>
        </div>
        <form action={createCreator} className="form">
          <div className="form-grid">
            <div className="field"><label htmlFor="displayName">Nombre visible</label><input id="displayName" name="displayName" placeholder="Juan Pérez" required /></div>
            <div className="field"><label htmlFor="slug">Alias URL</label><input id="slug" name="slug" placeholder="juan-perez" required /></div>
            <div className="field"><label htmlFor="role">Actividad</label><input id="role" name="role" placeholder="Mozo, barbero, delivery" /></div>
            <div className="field"><label htmlFor="locationName">Lugar</label><input id="locationName" name="locationName" placeholder="Bar Demo" /></div>
            <div className="field">
              <label htmlFor="commissionPercent">Comisión %</label>
              <input id="commissionPercent" name="commissionPercent" type="number" min="0" max="40" step="0.1" defaultValue={commissionPercent} required />
            </div>
          </div>
          <div><button className="button primary" type="submit"><Plus size={18} />Crear creador</button></div>
        </form>
      </section>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgePercent, Database, Download, ExternalLink, Plus, QrCode, ScrollText, Wallet } from "lucide-react";
import { createCreator, setMercadoPagoIntegrationVisibility } from "@/app/admin/actions";
import { getAdminSession } from "@/lib/auth";
import { appUrl, platformCommissionPercent } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { sellerIsConnected } from "@/lib/mercadopago";
import { aggregateTips, getAppSettings, getStorageInfo, isApprovedTip, listCreatorsWithRecentTips } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "Sin datos";
  }

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function AdminPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const [creators, totals, storageInfo, settings] = await Promise.all([
    listCreatorsWithRecentTips(5),
    aggregateTips(),
    getStorageInfo(),
    getAppSettings()
  ]);
  const commissionPercent = platformCommissionPercent();
  const showMercadoPagoIntegration = settings.showMercadoPagoIntegration;
  const toggleMercadoPagoIntegration = setMercadoPagoIntegrationVisibility.bind(
    null,
    !showMercadoPagoIntegration
  );

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Panel local</p>
          <h1>qrpropina</h1>
          <p className="muted">
            Crea creadores, genera sus QR y cobra propinas con comisión de plataforma.
          </p>
        </div>
        <div className="admin-hero-actions">
          <form action={toggleMercadoPagoIntegration} className="admin-switch-form">
            <button
              aria-pressed={showMercadoPagoIntegration}
              className={showMercadoPagoIntegration ? "switch-control checked" : "switch-control"}
              type="submit"
            >
              <span className="switch-track">
                <span className="switch-thumb" />
              </span>
              <span>Mostrar integracion de Mercado Pago</span>
            </button>
          </form>
          <Link className="button dark" href="#nuevo">
            <Plus size={18} />
            Nuevo creador
          </Link>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <span className="muted">Propinas aprobadas</span>
          <strong>{totals.count}</strong>
        </div>
        <div className="stat">
          <span className="muted">Volumen aprobado</span>
          <strong>{formatMoney(totals.amountCents)}</strong>
        </div>
        <div className="stat">
          <span className="muted">Comisión cobrada</span>
          <strong>{formatMoney(totals.platformFeeCents)}</strong>
        </div>
      </section>

      <section className="panel storage-panel" id="datos-locales">
        <div className="section-row">
          <div>
            <p className="kicker">Datos locales</p>
            <h2>Base de datos de creadores</h2>
            <p className="muted">
              Los creadores, propinas y eventos quedan guardados en este equipo.
            </p>
          </div>
          <div className="actions">
            <Link className="button secondary" href="/admin/logs">
              <ScrollText size={18} />
              Ver logs
            </Link>
            <a className="button secondary" href="/api/admin/export">
              <Download size={18} />
              Descargar backup
            </a>
          </div>
        </div>
        <div className="storage-list">
          <div className="storage-row">
            <span className="muted">
              <Database size={16} />
              Archivo
            </span>
            <code>{storageInfo.dbPath}</code>
          </div>
          <div className="storage-row">
            <span className="muted">Backups</span>
            <code>{storageInfo.backupDir}</code>
          </div>
          <div className="storage-row">
            <span className="muted">Estado</span>
            <strong>{storageInfo.exists ? "Activo" : "Pendiente"}</strong>
          </div>
          <div className="storage-row">
            <span className="muted">Tamano</span>
            <strong>{formatBytes(storageInfo.sizeBytes)}</strong>
          </div>
          <div className="storage-row">
            <span className="muted">Ultimo cambio</span>
            <strong>{formatDateTime(storageInfo.updatedAt)}</strong>
          </div>
        </div>
        <p className="muted small-note">
          Se crea un backup automatico diario antes de sobrescribir los datos.
        </p>
      </section>

      <section className="grid">
        {creators.map((creator) => {
          const publicUrl = `${appUrl()}/t/${creator.slug}`;
          const approved = creator.tips.filter(isApprovedTip);
          const received = approved.reduce((sum, tip) => sum + tip.amountCents, 0);

          return (
            <article className="creator-card" key={creator.id}>
              <div className="card-title">
                <div>
                  <h2>{creator.displayName}</h2>
                  <p className="muted">
                    {[creator.role, creator.locationName].filter(Boolean).join(" - ") ||
                      "Creador"}
                  </p>
                </div>
                {showMercadoPagoIntegration ? (
                  <span className={sellerIsConnected(creator) ? "pill ok" : "pill warn"}>
                    <Wallet size={14} />
                    {sellerIsConnected(creator) ? "Conectado" : "Sin conectar"}
                  </span>
                ) : null}
              </div>
              <div className="actions">
                <span className="pill">
                  <BadgePercent size={14} />
                  {commissionPercent}% comisión
                </span>
                <span className="pill">{formatMoney(received)} aprobado</span>
              </div>
              <p className="muted">{publicUrl}</p>
              <div className="actions">
                <Link className="button primary" href={`/admin/creadores/${creator.id}`}>
                  <QrCode size={17} />
                  Ver QR
                </Link>
                <Link className="icon-button secondary" href={`/t/${creator.slug}`} title="Abrir página pública">
                  <ExternalLink size={18} />
                </Link>
              </div>
            </article>
          );
        })}
      </section>

      <section className="panel" id="nuevo" style={{ marginTop: 24 }}>
        <div className="section-row">
          <div>
            <h2>Nuevo creador</h2>
            <p className="muted">El alias será parte del link público: /t/alias.</p>
          </div>
        </div>
        <form action={createCreator} className="form">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="displayName">Nombre visible</label>
              <input id="displayName" name="displayName" placeholder="Juan Perez" required />
            </div>
            <div className="field">
              <label htmlFor="slug">Alias URL</label>
              <input id="slug" name="slug" placeholder="juan-perez" required />
            </div>
            <div className="field">
              <label htmlFor="role">Actividad</label>
              <input id="role" name="role" placeholder="Mozo, barbero, delivery" />
            </div>
            <div className="field">
              <label htmlFor="locationName">Lugar</label>
              <input id="locationName" name="locationName" placeholder="Bar Demo" />
            </div>
            <div className="field">
              <label htmlFor="commissionPercent">Comisión %</label>
              <input
                id="commissionPercent"
                name="commissionPercent"
                type="number"
                min="0"
                max="40"
                step="0.1"
                defaultValue={commissionPercent}
                required
              />
            </div>
          </div>
          <div>
            <button className="button primary" type="submit">
              <Plus size={18} />
              Crear creador
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

import Link from "next/link";
import { BadgePercent, ExternalLink, Plus, QrCode, Wallet } from "lucide-react";
import { createRecipient } from "@/app/admin/actions";
import { appUrl } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { sellerIsConnected } from "@/lib/mercadopago";
import { aggregateTips, listRecipientsWithRecentTips } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [recipients, totals] = await Promise.all([
    listRecipientsWithRecentTips(5),
    aggregateTips()
  ]);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Panel local</p>
          <h1>qrpropina</h1>
          <p className="muted">
            Crea receptores, genera sus QR y cobra propinas con comision de plataforma.
          </p>
        </div>
        <Link className="button dark" href="#nuevo">
          <Plus size={18} />
          Nuevo receptor
        </Link>
      </section>

      <section className="stats">
        <div className="stat">
          <span className="muted">Propinas</span>
          <strong>{totals.count}</strong>
        </div>
        <div className="stat">
          <span className="muted">Volumen</span>
          <strong>{formatMoney(totals.amountCents)}</strong>
        </div>
        <div className="stat">
          <span className="muted">Comision estimada</span>
          <strong>{formatMoney(totals.platformFeeCents)}</strong>
        </div>
      </section>

      <section className="grid">
        {recipients.map((recipient) => {
          const publicUrl = `${appUrl()}/t/${recipient.slug}`;
          const received = recipient.tips.reduce((sum, tip) => sum + tip.amountCents, 0);

          return (
            <article className="recipient-card" key={recipient.id}>
              <div className="card-title">
                <div>
                  <h2>{recipient.displayName}</h2>
                  <p className="muted">
                    {[recipient.role, recipient.locationName].filter(Boolean).join(" - ") ||
                      "Receptor"}
                  </p>
                </div>
                <span className={sellerIsConnected(recipient) ? "pill ok" : "pill warn"}>
                  <Wallet size={14} />
                  {sellerIsConnected(recipient) ? "Conectado" : "Demo"}
                </span>
              </div>
              <div className="actions">
                <span className="pill">
                  <BadgePercent size={14} />
                  {recipient.commissionPercent}% comision
                </span>
                <span className="pill">{formatMoney(received)}</span>
              </div>
              <p className="muted">{publicUrl}</p>
              <div className="actions">
                <Link className="button primary" href={`/admin/receptores/${recipient.id}`}>
                  <QrCode size={17} />
                  Ver QR
                </Link>
                <Link className="icon-button secondary" href={`/t/${recipient.slug}`} title="Abrir pagina publica">
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
            <h2>Nuevo receptor</h2>
            <p className="muted">El alias sera parte del link publico: /t/alias.</p>
          </div>
        </div>
        <form action={createRecipient} className="form">
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
              <label htmlFor="commissionPercent">Comision %</label>
              <input
                id="commissionPercent"
                name="commissionPercent"
                type="number"
                min="0"
                max="40"
                step="0.1"
                defaultValue="8"
                required
              />
            </div>
          </div>
          <div>
            <button className="button primary" type="submit">
              <Plus size={18} />
              Crear receptor
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

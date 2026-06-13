import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgePercent, CheckCircle2, ExternalLink, Power, QrCode, Wallet } from "lucide-react";
import { toggleRecipient, updateRecipient } from "@/app/admin/actions";
import { CopyLinkButton } from "@/app/admin/receptores/[id]/CopyLinkButton";
import { appUrl } from "@/lib/env";
import { getRecipientWithTips } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { sellerIsConnected } from "@/lib/mercadopago";
import { qrDataUrl } from "@/lib/qrcode";

type Props = {
  params: Promise<{ id: string }>;
};

export const dynamic = "force-dynamic";

export default async function RecipientDetailPage({ params }: Props) {
  const { id } = await params;
  const recipient = await getRecipientWithTips(id, 12);

  if (!recipient) {
    notFound();
  }

  const publicUrl = `${appUrl()}/t/${recipient.slug}`;
  const qr = await qrDataUrl(publicUrl);
  const totalReceived = recipient.tips.reduce((sum, tip) => sum + tip.amountCents, 0);
  const totalFee = recipient.tips.reduce((sum, tip) => sum + tip.platformFeeCents, 0);

  const updateWithId = updateRecipient.bind(null, recipient.id);
  const toggleWithId = toggleRecipient.bind(null, recipient.id, !recipient.isActive);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Receptor</p>
          <h1>{recipient.displayName}</h1>
          <p className="muted">{publicUrl}</p>
        </div>
        <div className="actions">
          <Link className="button secondary" href={publicUrl}>
            <ExternalLink size={17} />
            Abrir
          </Link>
          <Link
            className="button primary"
            href={`/api/mercadopago/oauth/start?recipientId=${recipient.id}`}
          >
            <Wallet size={17} />
            Conectar MP
          </Link>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <span className="muted">Estado</span>
          <strong>{recipient.isActive ? "Activo" : "Pausado"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Recibido reciente</span>
          <strong>{formatMoney(totalReceived)}</strong>
        </div>
        <div className="stat">
          <span className="muted">Comision reciente</span>
          <strong>{formatMoney(totalFee)}</strong>
        </div>
      </section>

      <div className="grid">
        <section className="panel">
          <h2>QR publico</h2>
          <div className="qr-box">
            <img alt={`QR de ${recipient.displayName}`} src={qr} />
          </div>
          <div className="actions" style={{ marginTop: 16 }}>
            <a className="button secondary" href={qr} download={`${recipient.slug}-qr.png`}>
              <QrCode size={17} />
              Descargar
            </a>
            <CopyLinkButton value={publicUrl} />
          </div>
          <p className="muted" style={{ marginTop: 12 }}>
            Para imprimir, usa este QR. Si cambia el dominio, actualiza APP_URL y genera el QR de nuevo.
          </p>
        </section>

        <section className="panel">
          <h2>Configuracion</h2>
          <form action={updateWithId} className="form">
            <div className="field">
              <label htmlFor="displayName">Nombre visible</label>
              <input id="displayName" name="displayName" defaultValue={recipient.displayName} required />
            </div>
            <div className="field">
              <label htmlFor="slug">Alias URL</label>
              <input id="slug" name="slug" defaultValue={recipient.slug} required />
            </div>
            <div className="field">
              <label htmlFor="role">Actividad</label>
              <input id="role" name="role" defaultValue={recipient.role || ""} />
            </div>
            <div className="field">
              <label htmlFor="locationName">Lugar</label>
              <input id="locationName" name="locationName" defaultValue={recipient.locationName || ""} />
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
                defaultValue={recipient.commissionPercent}
                required
              />
            </div>
            <div className="actions">
              <button className="button primary" type="submit">
                <CheckCircle2 size={17} />
                Guardar
              </button>
              <button className="button secondary" formAction={toggleWithId} type="submit">
                <Power size={17} />
                {recipient.isActive ? "Pausar" : "Activar"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="panel" style={{ marginTop: 24 }}>
        <div className="section-row">
          <div>
            <h2>Mercado Pago</h2>
            <p className="muted">
              En produccion cada receptor debe conectar su cuenta para que el dinero vaya a su Mercado Pago.
            </p>
          </div>
          <span className={sellerIsConnected(recipient) ? "pill ok" : "pill warn"}>
            <Wallet size={14} />
            {sellerIsConnected(recipient) ? "Cuenta conectada" : "Modo demo o token global"}
          </span>
        </div>
        <div className="actions">
          <span className="pill">
            <BadgePercent size={14} />
            Marketplace fee: {recipient.commissionPercent}%
          </span>
          {recipient.mpUserId ? <span className="pill">MP user {recipient.mpUserId}</span> : null}
        </div>
      </section>

      <section className="panel" style={{ marginTop: 24 }}>
        <h2>Ultimas propinas</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Monto</th>
              <th>Comision</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {recipient.tips.map((tip) => (
              <tr key={tip.id}>
                <td>{formatMoney(tip.amountCents, tip.currency)}</td>
                <td>{formatMoney(tip.platformFeeCents, tip.currency)}</td>
                <td>{tip.status}</td>
                <td>{new Date(tip.createdAt).toLocaleString("es-AR")}</td>
              </tr>
            ))}
            {recipient.tips.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  Todavia no hay propinas.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </section>
    </main>
  );
}

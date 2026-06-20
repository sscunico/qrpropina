import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BadgePercent,
  CheckCircle2,
  Download,
  ExternalLink,
  Pencil,
  Power,
  Trash2,
  Wallet
} from "lucide-react";
import {
  createCreatorQr,
  deleteCreatorQr,
  toggleCreator,
  updateCreator,
  updateCreatorMercadoPagoAlias,
  updateCreatorProfile,
  updateCreatorQr
} from "@/app/admin/actions";
import { CopyLinkButton } from "@/app/admin/creadores/[id]/CopyLinkButton";
import { MercadoPagoAliasForm } from "@/app/admin/creadores/[id]/MercadoPagoAliasForm";
import { MercadoPagoAlertButton } from "@/app/admin/creadores/[id]/MercadoPagoAlertButton";
import { QrIdForm } from "@/app/admin/creadores/[id]/QrIdForm";
import { getAdminSession } from "@/lib/auth";
import { getAppSettings, getCreatorWithTips, isApprovedTip } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { sellerIsConnected } from "@/lib/mercadopago";
import { qrDataUrl } from "@/lib/qrcode";

type CreatorSection = "qrs" | "perfil" | "mercadopago" | "propinas";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    editQr?: string;
    mp?: string;
    mpError?: string;
    section?: string;
  }>;
};

export const dynamic = "force-dynamic";

function normalizeSection(value?: string): CreatorSection {
  if (value === "perfil" || value === "mercadopago" || value === "propinas" || value === "qrs") {
    return value;
  }

  return "qrs";
}

export default async function CreatorDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { editQr, mp, mpError, section } = await searchParams;
  const requestedSection = editQr ? "qrs" : normalizeSection(section);
  const session = await getAdminSession();
  const [creator, settings] = await Promise.all([
    getCreatorWithTips(id, 12),
    getAppSettings()
  ]);

  if (!creator) {
    notFound();
  }

  const isAdmin = session?.role === "admin";
  const canView = isAdmin || (session?.role === "creator" && session.creatorId === creator.id);

  if (!canView) {
    notFound();
  }

  const creatorHref = `/admin/creadores/${creator.id}`;
  const publicUrl = `${appUrl()}/t/${creator.slug}`;
  const qrsHref = `${creatorHref}?section=qrs`;
  const perfilHref = `${creatorHref}?section=perfil`;
  const commissionPercent = settings.transferDiscountPercent;
  const showMercadoPagoIntegration = settings.showMercadoPagoIntegration;
  const activeSection =
    (requestedSection === "mercadopago" || requestedSection === "propinas") && !showMercadoPagoIntegration
      ? "qrs"
      : requestedSection;
  const sectionTitle: Record<CreatorSection, string> = {
    qrs: "Mi QR",
    perfil: "Mi perfil",
    mercadopago: "Mercado Pago",
    propinas: "Propinas"
  };

  const qrItems = await Promise.all(
    creator.qrCodes.map(async (item) => {
      const url = `${appUrl()}/q/${item.qrId}`;
      return {
        ...item,
        url,
        image: await qrDataUrl(url)
      };
    })
  );

  const approvedTips = creator.tips.filter(isApprovedTip);
  const totalReceived = approvedTips.reduce((sum, tip) => sum + tip.amountCents, 0);
  const totalFee = approvedTips.reduce((sum, tip) => sum + tip.platformFeeCents, 0);

  const updateWithId = updateCreator.bind(null, creator.id);
  const updateProfileWithId = updateCreatorProfile.bind(null, creator.id);
  const updateMpAliasWithId = updateCreatorMercadoPagoAlias.bind(null, creator.id);
  const toggleWithId = toggleCreator.bind(null, creator.id, !creator.isActive);
  const createQrWithId = createCreatorQr.bind(null, creator.id);
  const selectedQr = editQr ? qrItems.find((item) => item.id === editQr) : null;
  const selectedQrAction = selectedQr
    ? updateCreatorQr.bind(null, creator.id, selectedQr.id)
    : createQrWithId;
  const showNewUserBanner =
    !isAdmin &&
    session?.role === "creator" &&
    (!creator.locationName || !creator.role || creator.role === "Creador" || creator.qrCodes.length === 0);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">{sectionTitle[activeSection]}</p>
          <h1>{creator.displayName}</h1>
          <p className="muted">{publicUrl}</p>
        </div>
        <div className="actions">
          <Link className="button secondary" href={publicUrl}>
            <ExternalLink size={17} />
            Abrir
          </Link>
          {showMercadoPagoIntegration ? (
            isAdmin ? (
              <Link className="button primary" href={`/api/mercadopago/oauth/start?creatorId=${creator.id}`}>
                <Wallet size={17} />
                Integrar Mercado Pago
              </Link>
            ) : (
              <MercadoPagoAlertButton creatorId={creator.id} isConnected={sellerIsConnected(creator)} />
            )
          ) : null}
        </div>
      </section>

      {showMercadoPagoIntegration && mp === "connected" ? (
        <div className="message success">Mercado Pago quedo conectado correctamente.</div>
      ) : null}
      {showMercadoPagoIntegration && mpError ? <div className="message error">{mpError}</div> : null}

      {showNewUserBanner ? (
        <section className="onboarding-banner">
          <div>
            <p className="kicker">Usuario nuevo</p>
            <h2>Completa tus datos para empezar a recibir propinas</h2>
            <p>
              Primero carga tu nombre visible, alias, actividad y lugar. Despues crea tu primer QR,
              descargalo y compartilo o imprimilo para que tus clientes puedan pagar desde el celular.
            </p>
          </div>
          <div className="banner-actions">
            <Link className="button primary" href={`${perfilHref}#mis-datos`}>
              <Pencil size={17} />
              Completar datos
            </Link>
            <Link className="button secondary" href={`${qrsHref}#qr-editor`}>
              Crear QR
            </Link>
          </div>
        </section>
      ) : null}

      <section className="stats">
        <div className="stat">
          <span className="muted">Estado</span>
          <strong>{creator.isActive ? "Activo" : "Pausado"}</strong>
        </div>
        <div className="stat">
          <span className="muted">Recibido aprobado</span>
          <strong>{formatMoney(totalReceived)}</strong>
        </div>
        {isAdmin ? (
          <div className="stat">
            <span className="muted">Comisión cobrada</span>
            <strong>{formatMoney(totalFee)}</strong>
          </div>
        ) : null}
      </section>

      <div className="creator-section-view">
        {activeSection === "qrs" ? (
          <section className="panel" id="qrs">
            <div className="section-row">
              <div>
                <h2>Crear / editar QR</h2>
                <p className="muted">
                  {selectedQr
                    ? "Edita el ID de este QR. La URL se actualiza automaticamente."
                    : "Crea un ID unico para generar una URL del tipo /q/id."}
                </p>
              </div>
              <span className="pill">{creator.qrCodes.length}/30 QR</span>
            </div>

            <div className="qr-editor" id="qr-editor">
              {selectedQr || creator.qrCodes.length < 30 ? (
                <>
                  {selectedQr ? (
                    <div className="message compact">
                      Editando <strong>{selectedQr.qrId}</strong>
                    </div>
                  ) : null}
                  <QrIdForm
                    key={selectedQr?.id ?? "create"}
                    className="form qr-create-form"
                    defaultValue={selectedQr?.qrId ?? ""}
                    exceptRecordId={selectedQr?.id}
                    formAction={selectedQrAction}
                    inputId="qrEditorId"
                    submitLabel={selectedQr ? "Guardar cambios" : "Crear QR"}
                    submitStyle={selectedQr ? "secondary" : "primary"}
                    cancelHref={selectedQr ? `${qrsHref}#qr-editor` : undefined}
                  />
                </>
              ) : (
                <div className="message">Este creador ya tiene el máximo de 30 QR.</div>
              )}
            </div>

            <div className="section-row qr-grid-heading">
              <div>
                <h2>QR creados</h2>
                <p className="muted">Usa Editar para llevar el QR al formulario superior.</p>
              </div>
            </div>

            <div className="qr-list">
              {qrItems.length === 0 ? (
                <div className="message">
                  Todavia no hay QR creados. Crea el primer ID para generar su URL.
                </div>
              ) : null}

              {qrItems.map((item) => {
                const deleteQrWithId = deleteCreatorQr.bind(null, creator.id, item.id);

                return (
                  <article className="qr-item" key={item.id}>
                    <div className="qr-item-header">
                      <div className="qr-item-title">
                        <p className="kicker">ID del QR</p>
                        <h3>{item.qrId}</h3>
                        <div className="qr-url-row">
                          <code>{item.url}</code>
                          <CopyLinkButton iconOnly value={item.url} />
                          <a
                            aria-label="Abrir en nueva pestaña"
                            className="button secondary icon-only"
                            href={item.url}
                            rel="noreferrer"
                            target="_blank"
                            title="Abrir en nueva pestaña"
                          >
                            <ExternalLink size={15} />
                          </a>
                        </div>
                      </div>
                      <div className="qr-item-actions">
                        <Link
                          className="button secondary"
                          href={`${qrsHref}&editQr=${item.id}#qr-editor`}
                        >
                          <Pencil size={17} />
                          Editar
                        </Link>
                        <form action={deleteQrWithId}>
                          <button className="button danger" type="submit">
                            <Trash2 size={17} />
                            Eliminar
                          </button>
                        </form>
                      </div>
                    </div>

                    <div className="qr-large">
                      <img alt={`QR ${item.qrId}`} src={item.image} />
                    </div>

                    <div className="qr-item-footer">
                      <a className="button primary" href={item.image} download={`${item.qrId}-qr.png`}>
                        <Download size={17} />
                        Descargar QR
                      </a>
                      <CopyLinkButton value={item.url} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        ) : null}

        {activeSection === "perfil" ? (
          isAdmin ? (
            <section className="panel" id="mis-datos">
              <h2>Configuración</h2>
              <form action={updateWithId} className="form">
                <div className="field">
                  <label htmlFor="displayName">Nombre visible</label>
                  <input id="displayName" name="displayName" defaultValue={creator.displayName} required />
                </div>
                <div className="field">
                  <label htmlFor="slug">Alias URL</label>
                  <input id="slug" name="slug" defaultValue={creator.slug} required />
                </div>
                <div className="field">
                  <label htmlFor="role">Actividad</label>
                  <input id="role" name="role" defaultValue={creator.role || ""} />
                </div>
                <div className="field">
                  <label htmlFor="locationName">Lugar</label>
                  <input id="locationName" name="locationName" defaultValue={creator.locationName || ""} />
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
                <div className="actions">
                  <button className="button primary" type="submit">
                    <CheckCircle2 size={17} />
                    Guardar
                  </button>
                  <button className="button secondary" formAction={toggleWithId} type="submit">
                    <Power size={17} />
                    {creator.isActive ? "Pausar" : "Activar"}
                  </button>
                </div>
              </form>
            </section>
          ) : (
            <section className="panel" id="mis-datos">
              <h2>Mis datos</h2>
              <p className="muted">
                Estos datos se muestran en tu link público y ayudan a identificar tus QR.
              </p>
              <form action={updateProfileWithId} className="form">
                <div className="field">
                  <label htmlFor="profileDisplayName">Nombre visible</label>
                  <input
                    id="profileDisplayName"
                    name="displayName"
                    defaultValue={creator.displayName}
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="profileSlug">Alias URL</label>
                  <input
                    id="profileSlug"
                    name="slug"
                    defaultValue={creator.slug}
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    required
                  />
                </div>
                <div className="field">
                  <label htmlFor="profileRole">Actividad</label>
                  <input
                    id="profileRole"
                    name="role"
                    defaultValue={creator.role || ""}
                    placeholder="Mozo, barbero, delivery"
                  />
                </div>
                <div className="field">
                  <label htmlFor="profileLocationName">Lugar</label>
                  <input
                    id="profileLocationName"
                    name="locationName"
                    defaultValue={creator.locationName || ""}
                    placeholder="Bar, local o zona"
                  />
                </div>
                <button className="button primary" type="submit">
                  <CheckCircle2 size={17} />
                  Guardar mis datos
                </button>
              </form>

              <div className="storage-list profile-summary">
                <div className="storage-row">
                  <span className="muted">Saldo aprobado</span>
                  <strong>{formatMoney(totalReceived)}</strong>
                </div>
                <div className="storage-row">
                  <span className="muted">Link público</span>
                  <code>{publicUrl}</code>
                </div>
              </div>
            </section>
          )
        ) : null}

        {showMercadoPagoIntegration && activeSection === "mercadopago" ? (
          <section className="panel">
            <div className="section-row">
              <div>
                <h2>Mercado Pago</h2>
                <p className="muted">
                  Primero cargá el alias de Mercado Pago. La conexión real de la cuenta se confirma luego con OAuth.
                </p>
              </div>
              <span className={sellerIsConnected(creator) ? "pill ok" : "pill warn"}>
                <Wallet size={14} />
                {sellerIsConnected(creator) ? "Cuenta conectada" : "Sin conectar"}
              </span>
            </div>

            <MercadoPagoAliasForm
              creatorId={creator.id}
              defaultValue={creator.mpAlias}
              formAction={updateMpAliasWithId}
            />

            <div className="mp-alias-summary">
              <span className={creator.mpAlias ? "pill ok" : "pill warn"}>
                Alias: {creator.mpAlias || "sin cargar"}
              </span>
            </div>

            <div className="storage-list mp-account-summary">
              <div className="storage-row">
                <span className="muted">Usuario MP</span>
                <strong>{creator.mpUserId || "Sin conectar"}</strong>
              </div>
              <div className="storage-row">
                <span className="muted">Alias detectado</span>
                <strong>{creator.mpNickname || "Sin datos"}</strong>
              </div>
              <div className="storage-row">
                <span className="muted">Email</span>
                <strong>{creator.mpEmail || "No informado"}</strong>
              </div>
              <div className="storage-row">
                <span className="muted">Nombre</span>
                <strong>
                  {[creator.mpFirstName, creator.mpLastName].filter(Boolean).join(" ") || "No informado"}
                </strong>
              </div>
              <div className="storage-row">
                <span className="muted">Sitio / país</span>
                <strong>{[creator.mpSiteId, creator.mpCountryId].filter(Boolean).join(" / ") || "No informado"}</strong>
              </div>
              {creator.mpPermalink ? (
                <div className="storage-row">
                  <span className="muted">Perfil</span>
                  <a href={creator.mpPermalink} target="_blank" rel="noreferrer">
                    {creator.mpPermalink}
                  </a>
                </div>
              ) : null}
            </div>

            {isAdmin ? (
              <div className="actions">
                <span className="pill">
                  <BadgePercent size={14} />
                  Marketplace fee: {commissionPercent}%
                </span>
                {creator.mpUserId ? <span className="pill">MP user {creator.mpUserId}</span> : null}
              </div>
            ) : (
              <div className="actions">
                <MercadoPagoAlertButton creatorId={creator.id} isConnected={sellerIsConnected(creator)} />
              </div>
            )}
          </section>
        ) : null}

        {showMercadoPagoIntegration && activeSection === "propinas" ? (
          <section className="panel">
            <h2>Ultimas propinas</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Monto</th>
                  <th>Comisión</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {creator.tips.map((tip) => (
                  <tr key={tip.id}>
                    <td>{formatMoney(tip.amountCents, tip.currency)}</td>
                    <td>{formatMoney(tip.platformFeeCents, tip.currency)}</td>
                    <td>{tip.status}</td>
                    <td>{new Date(tip.createdAt).toLocaleString("es-AR")}</td>
                  </tr>
                ))}
                {creator.tips.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="muted">
                      Todavia no hay propinas.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </section>
        ) : null}
      </div>
    </main>
  );
}

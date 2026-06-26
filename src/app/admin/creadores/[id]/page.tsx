import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  BadgePercent,
  CheckCircle2,
  Download,
  ExternalLink,
  Pencil,
  Power,
  QrCode,
  Trash2,
  Unplug,
  Wallet
} from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import {
  createCreatorQr,
  deleteCreatorQr,
  disconnectMercadoPago,
  toggleCreator,
  updateCreator,
  updateCreatorMercadoPagoAlias,
  updateCreatorProfile,
  updateCreatorQr
} from "@/app/admin/actions";
import { CopyLinkButton } from "@/app/admin/creadores/[id]/CopyLinkButton";
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
  const disconnectMpWithId = disconnectMercadoPago.bind(null, creator.id);
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
      <section className={showMercadoPagoIntegration && !isAdmin ? "hero-row hero-row--split" : "hero-row"}>
        <div>
          <p className="kicker">{sectionTitle[activeSection]}</p>
          <h1>{creator.displayName}</h1>
          <div className="hero-url-row">
            <span className="muted">{publicUrl}</span>
            <Link className="icon-button ghost hero-url-open" href={publicUrl} rel="noreferrer" target="_blank" title="Abrir página">
              <ExternalLink size={15} />
            </Link>
          </div>
        </div>
        <div className="actions">
          {isAdmin ? (
            <Link className="button secondary" href="/admin/creadores">
              <ArrowLeft size={17} />
              Volver
            </Link>
          ) : null}
          {showMercadoPagoIntegration && !isAdmin && (!sellerIsConnected(creator) || activeSection === "mercadopago") ? (
            <>
              {sellerIsConnected(creator) ? (
                <div className="mp-button-row">
                  <MercadoPagoAlertButton creatorId={creator.id} isConnected disabled />
                  <form action={disconnectMpWithId}>
                    <button className="button danger mp-disconnect-btn" type="submit">
                      <Unplug size={17} />
                      Desintegrar
                    </button>
                  </form>
                </div>
              ) : (
                <MercadoPagoAlertButton creatorId={creator.id} isConnected={false} />
              )}
              <span className="mp-connect-label">
                {sellerIsConnected(creator) ? "Mercado Pago integrado" : "Integración con Mercado Pago"}
                {sellerIsConnected(creator) ? (
                  <InfoTooltip
                    text="Tu cuenta de Mercado Pago está conectada. Los pagos de propinas se acreditan automáticamente en tu billetera."
                    position="bottom"
                  />
                ) : (
                  <InfoTooltip
                    text="Para recibir propinas de tus clientes necesitás conectar tu cuenta de Mercado Pago. Al integrarla, cada pago que hagan desde tu QR se acredita directamente en tu billetera de MP. Es rápido, seguro y solo se hace una vez."
                    position="bottom"
                  />
                )}
              </span>
            </>
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
              Primero carga tu nombre visible, alias, actividad y lugar. Después creá tu primer QR,
              descargalo y compartilo o imprimilo para que tus clientes puedan pagar desde el celular.
              También necesitás integrar tu cuenta de Mercado Pago: sin esa conexión los pagos no se
              acreditan en tu billetera. <InfoTooltip text="La integración con Mercado Pago vincula tu cuenta para que cada propina que recibas por QR se deposite automáticamente en tu billetera de MP. Se hace una sola vez desde el botón de integración y es totalmente seguro." position="right" />
            </p>
          </div>
          <div className="banner-actions">
            <Link className="button primary" href={`${qrsHref}#qr-editor`}>
              <QrCode size={17} />
              Crear
            </Link>
          </div>
        </section>
      ) : null}

      {isAdmin ? (
        <section className="stats">
          <div className="stat">
            <span className="muted">Estado <InfoTooltip text="Un creador pausado no puede recibir propinas. Sus QR siguen activos pero los pagos son rechazados." position="bottom" /></span>
            <strong>{creator.isActive ? "Activo" : "Pausado"}</strong>
          </div>
          <div className="stat">
            <span className="muted">Recibido aprobado <InfoTooltip text="Suma de todas las propinas con estado aprobado por Mercado Pago, antes de descontar comisión." position="bottom" /></span>
            <strong>{formatMoney(totalReceived)}</strong>
          </div>
          <div className="stat">
            <span className="muted">Comisión cobrada <InfoTooltip text="Total retenido por la plataforma como comisión en propinas aprobadas de este creador." position="bottom" /></span>
            <strong>{formatMoney(totalFee)}</strong>
          </div>
        </section>
      ) : null}

      <div className="creator-section-view">
        {activeSection === "qrs" ? (
          <section className="panel" id="qrs">
            <div className="section-row">
              <div>
                <h2>Crear / editar QR <InfoTooltip text="Cada QR tiene un ID único que genera una URL del tipo /q/id. Los clientes escanean ese QR para hacer la propina." /></h2>
                <p className="muted">
                  {selectedQr
                    ? "Edita el ID de este QR. La URL se actualiza automaticamente."
                    : "Crea un ID unico para generar una URL del tipo /q/id."}
                </p>
              </div>
              <span className="pill">{creator.qrCodes.length}/30 QR <InfoTooltip text="Podés tener hasta 30 QR distintos. Útil para tener uno por mesa, zona o canal." /></span>
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
              <form action={updateProfileWithId} className="form profile-form-grid">
                <div className="profile-form-fields">
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
                    <label htmlFor="profileSlug">Alias URL <InfoTooltip text="Tu dirección pública: qrpropina.com/t/tu-alias. Solo letras minúsculas, números y guiones. Ejemplo: juan-perez." /></label>
                    <input
                      id="profileSlug"
                      name="slug"
                      defaultValue={creator.slug}
                      pattern="[a-z0-9]+(-[a-z0-9]+)*"
                      required
                    />
                  </div>
                </div>
                <div className="profile-form-fields profile-form-right">
                  <div className="field">
                    <label htmlFor="profileRole">Actividad <InfoTooltip text="Tu oficio o profesión. Se muestra en tu página pública para que el cliente sepa quién sos. Ejemplo: Mozo, Barbero, Repartidor." /></label>
                    <input
                      id="profileRole"
                      name="role"
                      defaultValue={creator.role || ""}
                      placeholder="Mozo, barbero, delivery"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profileLocationName">Lugar <InfoTooltip text="El local, bar o zona donde trabajás. Ayuda al cliente a reconocerte. Ejemplo: Bar El Recreo, Palermo." /></label>
                    <input
                      id="profileLocationName"
                      name="locationName"
                      defaultValue={creator.locationName || ""}
                      placeholder="Bar, local o zona"
                    />
                  </div>
                  <button className="button primary profile-save-btn" type="submit">
                    <CheckCircle2 size={17} />
                    Guardar mis datos
                  </button>
                </div>
              </form>

            </section>
          )
        ) : null}

        {showMercadoPagoIntegration && activeSection === "mercadopago" ? (
          <section className="panel">
            <div className="section-row">
              <div>
                <h2>Mercado Pago <InfoTooltip text="Conectá tu cuenta de Mercado Pago para recibir propinas directamente en tu billetera. La integración usa OAuth: es segura y no requiere contraseña." /></h2>
                <p className="muted">
                  Primero cargá el alias de Mercado Pago. La conexión real de la cuenta se confirma luego con OAuth.
                </p>
              </div>
              <span className={sellerIsConnected(creator) ? "pill ok" : "pill warn"}>
                <Wallet size={14} />
                {sellerIsConnected(creator) ? "Cuenta conectada" : "Sin integrar"}
              </span>
            </div>

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
            ) : null}
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

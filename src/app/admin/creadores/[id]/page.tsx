import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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
  Wallet
} from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import {
  claimCreatorQr,
  createCreatorQr,
  deleteCreatorQr,
  markOnboardingCompleted,
  toggleCreator,
  updateCreator,
  updateCreatorMercadoPagoAlias,
  updateCreatorProfile,
  updateCreatorQr,
  updateCreatorSocials,
  updateCreatorThankYou
} from "@/app/admin/actions";
import { CopyLinkButton } from "@/app/admin/creadores/[id]/CopyLinkButton";
import { MercadoPagoAlertButton } from "@/app/admin/creadores/[id]/MercadoPagoAlertButton";
import { QrIdForm } from "@/app/admin/creadores/[id]/QrIdForm";
import { ThankYouEditor } from "@/app/admin/creadores/[id]/ThankYouEditor";
import { QrPreviewButton } from "@/app/admin/creadores/[id]/QrPreviewButton";
import { QrScanner } from "@/app/admin/creadores/[id]/QrScanner";
import { getAdminSession } from "@/lib/auth";
import { getAppSettings, getCreatorWithTips, isApprovedTip } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { formatMoney } from "@/lib/money";
import { sellerIsConnected } from "@/lib/mercadopago";
import { qrDataUrl } from "@/lib/qrcode";

type CreatorSection = "qrs" | "perfil" | "mercadopago" | "propinas" | "redes";

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
  if (value === "perfil" || value === "mercadopago" || value === "propinas" || value === "qrs" || value === "redes") {
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
  const isMercadoPagoConnected = sellerIsConnected(creator);
  const activeSection =
    (requestedSection === "mercadopago" || requestedSection === "propinas") && !showMercadoPagoIntegration
      ? "qrs"
      : requestedSection as CreatorSection;
  const sectionTitle: Record<CreatorSection, string> = {
    qrs: "Mi QR",
    perfil: "Mi perfil",
    mercadopago: "Mercado Pago",
    propinas: "Propinas",
    redes: "Redes y Mensaje"
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
  const updateSocialsWithId = updateCreatorSocials.bind(null, creator.id);
  const updateThankYouWithId = updateCreatorThankYou.bind(null, creator.id);
  const toggleWithId = toggleCreator.bind(null, creator.id, !creator.isActive);
  const createQrWithId = createCreatorQr.bind(null, creator.id);
  const claimQrWithId = claimCreatorQr.bind(null, creator.id);
  const selectedQr = editQr ? qrItems.find((item) => item.id === editQr) : null;
  const selectedQrAction = selectedQr
    ? updateCreatorQr.bind(null, creator.id, selectedQr.id)
    : createQrWithId;
  const bothChecklistDone = creator.qrCodes.length > 0 && isMercadoPagoConnected;
  const showMercadoPagoHeroPrompt = !isAdmin && showMercadoPagoIntegration && !isMercadoPagoConnected;

  if (!isAdmin && bothChecklistDone && !creator.onboardingCompleted) {
    await markOnboardingCompleted(creator.id);
  }

  const showNewUserBanner =
    !creator.onboardingCompleted &&
    !isAdmin &&
    session?.role === "creator" &&
    (
      !creator.locationName ||
      !creator.role ||
      creator.role === "Creador" ||
      creator.qrCodes.length === 0 ||
      (showMercadoPagoIntegration && !isMercadoPagoConnected)
    ) &&
    !bothChecklistDone;

  return (
    <main className="page">
      <section className={showMercadoPagoHeroPrompt ? "hero-row hero-row--split" : "hero-row"}>
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
        {isAdmin || showMercadoPagoHeroPrompt ? (
          <div className="actions" id="Contenedor-mercado-pago">
            {isAdmin ? (
              <Link className="button secondary" href="/admin/creadores">
                <ArrowLeft size={17} />
                Volver
              </Link>
            ) : null}
            {showMercadoPagoHeroPrompt ? (
              <div id="banner-mercado-libre">
                <MercadoPagoAlertButton creatorId={creator.id} />
                <span className="mp-connect-label">
                  Integración con Mercado Pago
                  <InfoTooltip
                    text="Para recibir propinas de tus clientes necesitás conectar tu cuenta de Mercado Pago. Al integrarla, cada pago que hagan desde tu QR se acredita directamente en tu billetera de MP. Es rápido, seguro y solo se hace una vez."
                    position="bottom"
                  />
                </span>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      {showMercadoPagoIntegration && mp === "connected" ? (
        <div className="message success">Mercado Pago quedo conectado correctamente.</div>
      ) : null}
      {showMercadoPagoIntegration && mpError ? <div className="message error">{mpError}</div> : null}

      {showNewUserBanner ? (
        <section className="onboarding-banner">
          <div>
            <p className="kicker">¡Bienvenido!</p>
            <h2>Ya casi podés recibir propinas</h2>
            <p>
              Para empezar a cobrar necesitás dos cosas: registrar al menos un <strong>QR</strong> —
              lo descargás, imprimís y tus clientes lo escanean para pagarte — e integrar tu cuenta de{" "}
              <strong>Mercado Pago</strong> para que cada propina se acredite directo en tu billetera.
            </p>
          </div>

          <div className="banner-checklist">
            <div className={`banner-check-item${creator.qrCodes.length > 0 ? " done" : ""}`}>
              <span className="banner-check-icon">
                {creator.qrCodes.length > 0
                  ? <CheckCircle2 size={22} />
                  : <span className="banner-check-empty" />}
              </span>
              <div>
                <strong>QR registrado</strong>
                <p>{creator.qrCodes.length > 0 ? "Listo" : "Todavía no tenés ningún QR"}</p>
              </div>
            </div>

            <div className={`banner-check-item${isMercadoPagoConnected ? " done" : ""}`}>
              <span className="banner-check-icon">
                {isMercadoPagoConnected
                  ? <CheckCircle2 size={22} />
                  : <span className="banner-check-empty" />}
              </span>
              <div>
                <strong>Mercado Pago</strong>
                <p>{isMercadoPagoConnected ? "Cuenta conectada" : "Sin integrar aún"}</p>
              </div>
            </div>
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
                <h2>
                  {isAdmin ? (
                    "QR del creador"
                  ) : (
                    <span className="section-title-with-icon">
                      <QrCode aria-hidden="true" size={22} />
                      <span>Mis QR</span>
                    </span>
                  )}
                  {" "}
                  <InfoTooltip text="Cada QR tiene un ID único que determina su URL pública (/q/tu-id). Imprimís esa imagen y la colocás donde trabajes — tus clientes la escanean para enviarte la propina directamente a tu Mercado Pago." />
                </h2>
                <p className="muted">
                  {isAdmin
                    ? "Administrá los QR de este creador. Podés crear hasta 3 en total."
                    : "Tus QR activos. Descargalos, imprimílos y colocalos donde tus clientes puedan escanearlos para pagarte."}
                </p>
              </div>
              <span className="pill">{creator.qrCodes.length}/3 QR <InfoTooltip text="Podés tener hasta 3 QR distintos. Útil para tener uno por mesa, zona o canal." /></span>
            </div>

            <div className="qr-list">
              {qrItems.length === 0 ? (
                <div className="message">
                  Todavía no hay QR registrados. {isAdmin ? "Creá el primer QR usando el formulario de abajo." : "Escaneá un QR impreso de nuestra plataforma para registrarlo en tu cuenta."}
                </div>
              ) : null}

              {qrItems.map((item) => {
                const deleteQrWithId = deleteCreatorQr.bind(null, creator.id, item.id);

                return (
                  <article className="qr-item" key={item.id}>
                    <form action={deleteQrWithId} className="qr-item-delete-form">
                      <button aria-label="Eliminar QR" className="qr-item-delete-btn" title="Eliminar" type="submit">
                        <Trash2 size={15} />
                      </button>
                    </form>

                    {isAdmin ? (
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
                        </div>
                      </div>
                    ) : null}

                    <QrPreviewButton qrId={item.qrId} image={item.image} />

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

            <div className="section-row qr-grid-heading">
              <div>
                <h2>
                  {isAdmin ? "Crear / editar QR" : (
                    <span className="section-title-with-icon">
                      <QrCode aria-hidden="true" size={22} />
                      <span>Registrar QR o Crear nuevo QR</span>
                      <InfoTooltip
                        position="bottom"
                        text="Tenés dos opciones:

① Si ya tenés un QR impreso de qrpropina.com — escanealo con la cámara o escribí su ID en el campo de abajo para asociarlo a tu cuenta al instante.

② Si todavía no tenés ningún QR — escribí en el campo un ID único (ej: juan-mesa-1), verificá que esté disponible y registralo. Después descargás la imagen, la imprimís y tus clientes la escanean para pagarte."
                      />
                    </span>
                  )}
                </h2>
                <p className="muted">
                  {isAdmin
                    ? (selectedQr
                      ? "Editá el ID de este QR. La URL se actualiza automáticamente — si ya tenés el código impreso, vas a necesitar reimprimirlo."
                      : "Ingresá un ID único para este QR. Se genera una URL del tipo /q/tu-id: esa es la imagen que imprimís y tus clientes escanean para pagarte la propina.")
                    : "Escaneá un QR de qrpropina.com para asociarlo a tu cuenta, o creá uno nuevo escribiendo el ID que prefieras en el campo de abajo."}
                </p>
              </div>
            </div>

            {isAdmin ? (
              <div className="qr-editor" id="qr-editor">
                {selectedQr || creator.qrCodes.length < 3 ? (
                  <>
                    {selectedQr ? (
                      <div className="message compact">
                        Editando <strong>{selectedQr.qrId}</strong>
                      </div>
                    ) : (
                      <h3 className="qr-create-subtitle">Crea un nuevo QR</h3>
                    )}
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
                  <div className="message">Este creador ya tiene el máximo de 3 QR.</div>
                )}
              </div>
            ) : creator.qrCodes.length < 3 ? (
              <QrScanner claimAction={claimQrWithId} existingQrIds={creator.qrCodes.map((q) => q.qrId)} />
            ) : (
              <div className="message">Ya tenés el máximo de 3 QR registrados.</div>
            )}
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

        {activeSection === "redes" ? (
          <>
            <section className="panel">
              <h2>Redes sociales</h2>
              <p className="muted">Tus links aparecen en tu página pública para que tus clientes te sigan.</p>
              <form action={updateSocialsWithId} className="form">
                <div className="form-grid">
                  <div className="field">
                    <label htmlFor="instagram">Instagram</label>
                    <input id="instagram" name="instagram" placeholder="https://instagram.com/tu-usuario" defaultValue={creator.socialLinks?.instagram || ""} />
                  </div>
                  <div className="field">
                    <label htmlFor="tiktok">TikTok</label>
                    <input id="tiktok" name="tiktok" placeholder="https://tiktok.com/@tu-usuario" defaultValue={creator.socialLinks?.tiktok || ""} />
                  </div>
                  <div className="field">
                    <label htmlFor="x">X / Twitter</label>
                    <input id="x" name="x" placeholder="https://x.com/tu-usuario" defaultValue={creator.socialLinks?.x || ""} />
                  </div>
                  <div className="field">
                    <label htmlFor="facebook">Facebook</label>
                    <input id="facebook" name="facebook" placeholder="https://facebook.com/tu-pagina" defaultValue={creator.socialLinks?.facebook || ""} />
                  </div>
                  <div className="field">
                    <label htmlFor="youtube">YouTube</label>
                    <input id="youtube" name="youtube" placeholder="https://youtube.com/@tu-canal" defaultValue={creator.socialLinks?.youtube || ""} />
                  </div>
                </div>
                <div>
                  <button className="button primary" type="submit">
                    <CheckCircle2 size={17} />
                    Guardar redes
                  </button>
                </div>
              </form>
            </section>

            <section className="panel">
              <h2>Mensaje de agradecimiento</h2>
              <p className="muted">Este mensaje aparece en la pantalla de confirmación después de que alguien te manda una propina. Máximo 200 caracteres.</p>
              <form action={updateThankYouWithId} className="form">
                <div className="field">
                  <label htmlFor="thankYouMessage">Mensaje</label>
                  <ThankYouEditor
                    defaultValue={creator.thankYouMessage || ""}
                    name="thankYouMessage"
                  />
                </div>
                <div>
                  <button className="button primary" type="submit">
                    <CheckCircle2 size={17} />
                    Guardar mensaje
                  </button>
                </div>
              </form>
            </section>
          </>
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
              <span className={isMercadoPagoConnected ? "pill ok" : "pill warn"}>
                <Wallet size={14} />
                {isMercadoPagoConnected ? "Cuenta conectada" : "Sin integrar"}
              </span>
            </div>

            <div className="mp-alias-summary">
              <span className={creator.mpAlias ? "pill ok" : "pill warn"}>
                Alias: {creator.mpAlias || "sin cargar"}
              </span>
            </div>

            <div className="storage-list mp-account-summary">
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
              <div className="message mp-instant-tip">
                <strong>¿Querés cobrar tus propinas al instante?</strong>
                <p>
                  Por defecto, Mercado Pago retiene el dinero{" "}
                  <strong>35 días</strong> antes de acreditarlo en tu cuenta (comisión 1,49% + IVA).
                  Si preferís recibir cada propina{" "}
                  <strong>de forma inmediata</strong>, podés cambiarlo directamente en tu cuenta de Mercado Pago:
                </p>
                <ol>
                  <li>Entrá a <strong>mercadopago.com.ar</strong> con tu cuenta.</li>
                  <li>Ir a <strong>Tu negocio → Configurar mi negocio</strong>.</li>
                  <li>Buscá la sección <strong>Tasas y plazos</strong> y elegí <strong>Al instante</strong>.</li>
                </ol>
                <p className="muted">
                  Tené en cuenta que la comisión de Mercado Pago cambia según el plazo:<br />
                  · 35 días → 1,49%<br />
                  · 18 días → 3,39%<br />
                  · 10 días → 4,39%<br />
                  · Al instante → 6,29% (todos + IVA).<br />
                  Esta comisión la descuenta MP de tu parte — es independiente de la comisión de la app.
                </p>
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

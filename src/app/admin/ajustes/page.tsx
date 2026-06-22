import { redirect } from "next/navigation";
import { BadgePercent, Palette, RotateCcw, Wallet } from "lucide-react";
import { resetColorOverrides, saveColorOverrides, setMercadoPagoIntegrationVisibility, setTransferDiscountPercent } from "@/app/admin/actions";
import { PercentStepper } from "@/components/PercentStepper";
import { InfoTooltip } from "@/components/InfoTooltip";
import { getAdminSession } from "@/lib/auth";
import { getAppSettings } from "@/lib/db";
import { appUrl } from "@/lib/env";

const BRAND_COLORS = [
  { name: "--background", label: "Fondo", defaultValue: "#fbf8ff" },
  { name: "--surface", label: "Superficie", defaultValue: "#ffffff" },
  { name: "--surface-strong", label: "Superficie oscura", defaultValue: "#101828" },
  { name: "--text", label: "Texto", defaultValue: "#1d2438" },
  { name: "--muted", label: "Texto secundario", defaultValue: "#6f7390" },
  { name: "--line", label: "Líneas / bordes", defaultValue: "#e5ddf5" },
  { name: "--accent", label: "Color principal", defaultValue: "#7357ff" },
  { name: "--accent-strong", label: "Color principal oscuro", defaultValue: "#5a3ee6" },
  { name: "--mint", label: "Menta", defaultValue: "#e4f8f1" },
  { name: "--lavender", label: "Lavanda", defaultValue: "#f0ebff" },
  { name: "--coral", label: "Coral", defaultValue: "#ff6b6b" },
  { name: "--amber", label: "Ámbar", defaultValue: "#ffd18a" },
  { name: "--danger", label: "Peligro", defaultValue: "#b42318" },
];

export const dynamic = "force-dynamic";

function missingMercadoPagoOAuthVars() {
  return [
    !process.env.MERCADOPAGO_CLIENT_ID?.trim() ? "MERCADOPAGO_CLIENT_ID" : null,
    !process.env.MERCADOPAGO_CLIENT_SECRET?.trim() ? "MERCADOPAGO_CLIENT_SECRET" : null
  ].filter(Boolean);
}

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const settings = await getAppSettings();
  const showMercadoPagoIntegration = settings.showMercadoPagoIntegration;
  const missingOAuthVars = missingMercadoPagoOAuthVars();
  const mercadoPagoRedirectUrl = `${appUrl()}/api/mercadopago/oauth/callback`;
  const toggleMercadoPagoIntegration = setMercadoPagoIntegrationVisibility.bind(null, !showMercadoPagoIntegration);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Configuración</p>
          <h1>Ajustes</h1>
          <p className="muted">Controla funciones visibles del panel mientras hacés pruebas.</p>
        </div>
      </section>

      <div className="settings-stack">
        <section className="panel settings-panel">
          <div className="section-row compact-row">
            <div>
              <p className="kicker">Integraciones</p>
              <h2>Mercado Pago <InfoTooltip text="Activa o desactiva la integración con Mercado Pago en toda la app. Útil para ocultar la función mientras hacés pruebas o antes de lanzar." /></h2>
              <p className="muted">Cuando está desactivado se ocultan las páginas, botones y menús de Mercado Pago y propinas.</p>
            </div>
            <span className={showMercadoPagoIntegration ? "pill ok" : "pill warn"}>
              <Wallet size={14} />
              {showMercadoPagoIntegration ? "Visible" : "Oculto"}
            </span>
          </div>

          {missingOAuthVars.length > 0 ? (
            <div className="message error settings-message">
              Falta configurar {missingOAuthVars.join(" y ")} para conectar Mercado Pago por OAuth.
            </div>
          ) : (
            <div className="message success settings-message">
              OAuth configurado. Redirect URL esperado: <code>{mercadoPagoRedirectUrl}</code>
            </div>
          )}

          <form action={toggleMercadoPagoIntegration} className="admin-switch-form">
            <button aria-pressed={showMercadoPagoIntegration} className={showMercadoPagoIntegration ? "switch-control checked" : "switch-control"} type="submit">
              <span className="switch-track"><span className="switch-thumb" /></span>
              <span>Mostrar integración de Mercado Pago</span>
            </button>
          </form>
        </section>

        <section className="panel settings-panel">
          <div className="section-row compact-row">
            <div>
              <p className="kicker">Transferencias</p>
              <h2>Descuento de transferencia <InfoTooltip text="Porcentaje que la plataforma retiene de cada propina antes de transferirla al creador. Ejemplo: con 5%, de $100 el creador recibe $95." /></h2>
              <p className="muted">Porcentaje que qrpropina descuenta de cada propina transferida. Por default es 5%.</p>
            </div>
            <span className="pill">
              <BadgePercent size={14} />
              {settings.transferDiscountPercent}%
            </span>
          </div>

          <form action={setTransferDiscountPercent} className="settings-number-form">
            <PercentStepper
              defaultValue={settings.transferDiscountPercent}
              id="transferDiscountPercent"
              label="Porcentaje de descuento"
              max={40}
              min={0}
              name="transferDiscountPercent"
              step={0.5}
            />
            <button className="button primary" type="submit">Guardar</button>
          </form>
        </section>
        <section className="panel settings-panel">
          <div className="section-row compact-row">
            <div>
              <p className="kicker">Apariencia</p>
              <h2>Colores <InfoTooltip text="Cambiá los colores base de la interfaz. Los valores se guardan y se aplican en toda la app hasta que los restablezcas." /></h2>
              <p className="muted">Personalizá los colores de la interfaz. Los cambios se aplican en toda la app.</p>
            </div>
            <span className="pill">
              <Palette size={14} />
              Colores
            </span>
          </div>

          <form action={saveColorOverrides}>
            <div className="color-grid">
              {BRAND_COLORS.map(({ name, label, defaultValue }) => (
                <label className="color-row" htmlFor={name} key={name}>
                  <input
                    defaultValue={settings.colorOverrides[name] || defaultValue}
                    id={name}
                    name={name}
                    type="color"
                  />
                  <span>{label}</span>
                  <code className="color-value">{settings.colorOverrides[name] || defaultValue}</code>
                </label>
              ))}
            </div>
            <div className="settings-color-actions">
              <button className="button primary" type="submit">Guardar colores</button>
              {Object.keys(settings.colorOverrides).length > 0 ? (
                <button className="button secondary" formAction={resetColorOverrides} type="submit">
                  <RotateCcw size={14} />
                  Restablecer
                </button>
              ) : null}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

import { redirect } from "next/navigation";
import { BadgePercent, Palette, RotateCcw, ServerCog, Wallet } from "lucide-react";
import { resetColorOverrides, saveColorOverrides, setMercadoPagoIntegrationVisibility, setTransferDiscountPercent } from "@/app/admin/actions";
import { PercentStepper } from "@/components/PercentStepper";
import { InfoTooltip } from "@/components/InfoTooltip";
import { EnvVarsSection } from "@/components/EnvVarsSection";
import { DeployAlert } from "@/components/DeployAlert";
import { getAdminSession } from "@/lib/auth";
import { getAppSettings } from "@/lib/db";
import { appUrl } from "@/lib/env";

function maskSecret(value: string | undefined): string {
  if (!value) return "(no configurada)";
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 4) + "•".repeat(Math.min(value.length - 8, 20)) + value.slice(-4);
}

const ENV_VARS: { key: string; label: string; sensitive: boolean; group: string }[] = [
  { key: "APP_URL",                            label: "URL de la app",       sensitive: false, group: "App" },
  { key: "APP_NAME",                           label: "Nombre",              sensitive: false, group: "App" },
  { key: "ADMIN_GOOGLE_EMAILS",                label: "Emails admin",        sensitive: false, group: "App" },
  { key: "APP_ENCRYPTION_KEY",                 label: "Encryption key",      sensitive: true,  group: "App" },
  { key: "ADMIN_SESSION_SECRET",               label: "Session secret",      sensitive: true,  group: "App" },
  { key: "GOOGLE_CLIENT_ID",                   label: "Client ID",           sensitive: true,  group: "Google" },
  { key: "GOOGLE_CLIENT_SECRET",               label: "Client secret",       sensitive: true,  group: "Google" },
  { key: "MP_ENABLE_DEMO_CHECKOUT",            label: "Demo checkout",       sensitive: false, group: "Mercado Pago" },
  { key: "MERCADOPAGO_USE_SANDBOX_LINK",       label: "Sandbox link",        sensitive: false, group: "Mercado Pago" },
  { key: "MERCADOPAGO_API_BASE_URL",           label: "API URL",             sensitive: false, group: "Mercado Pago" },
  { key: "MERCADOPAGO_AUTH_BASE_URL",          label: "Auth URL",            sensitive: false, group: "Mercado Pago" },
  { key: "MERCADOPAGO_CLIENT_ID",              label: "Client ID",           sensitive: false, group: "Mercado Pago" },
  { key: "NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY", label: "Public key",          sensitive: true,  group: "Mercado Pago" },
  { key: "MERCADOPAGO_ACCESS_TOKEN",           label: "Access token",        sensitive: true,  group: "Mercado Pago" },
  { key: "MERCADOPAGO_CLIENT_SECRET",          label: "Client secret",       sensitive: true,  group: "Mercado Pago" },
  { key: "DB_HOST",                             label: "Host",                sensitive: false, group: "MySQL" },
  { key: "DB_PORT",                             label: "Puerto",              sensitive: false, group: "MySQL" },
  { key: "DB_DATABASE",                         label: "Base de datos",       sensitive: false, group: "MySQL" },
  { key: "DB_USERNAME",                         label: "Usuario",             sensitive: false, group: "MySQL" },
  { key: "DB_PASSWORD",                         label: "Contraseña",          sensitive: true,  group: "MySQL" },
];

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

      <DeployAlert commitSha={process.env.NEXT_PUBLIC_COMMIT_SHA ?? "unknown"} />

      <div className="row g-3 settings-stack">

        {/* Fila 1: Mercado Pago + Descuento (lado a lado en pantallas medianas+) */}
        <div className="col-12 col-md-6">
          <section className="panel settings-panel h-100">
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
        </div>

        <div className="col-12 col-md-6">
          <section className="panel settings-panel h-100">
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
        </div>

        {/* Fila 2: Colores + Variables (lado a lado en pantallas grandes) */}
        <div className="col-12 col-lg-5">
          <section className="panel settings-panel h-100">
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
              <div className="row g-2 color-grid">
                {BRAND_COLORS.map(({ name, label, defaultValue }) => (
                  <div className="col-12 col-sm-6 col-lg-6" key={name}>
                    <label className="color-row" htmlFor={name}>
                      <div className="color-row-swatch">
                        <input
                          defaultValue={settings.colorOverrides[name] || defaultValue}
                          id={name}
                          name={name}
                          type="color"
                        />
                        <code className="color-value">{settings.colorOverrides[name] || defaultValue}</code>
                      </div>
                      <span>{label}</span>
                    </label>
                  </div>
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

        <div className="col-12 col-lg-7">
          <section className="panel settings-panel h-100">
            <div className="section-row compact-row">
              <div>
                <p className="kicker">Servidor</p>
                <h2>Variables de entorno</h2>
                <p className="muted">Estado de las variables configuradas en el servidor. Usá el ojito para revelar los valores.</p>
              </div>
              <span className="pill">
                <ServerCog size={14} />
                Entorno
              </span>
            </div>

            <EnvVarsSection vars={ENV_VARS.map(({ key, label, sensitive, group }) => {
              const raw = process.env[key];
              return {
                key,
                label,
                group,
                value: sensitive ? maskSecret(raw) : (raw || "(no configurada)"),
                missing: !raw,
              };
            })} />
          </section>
        </div>

      </div>
    </main>
  );
}

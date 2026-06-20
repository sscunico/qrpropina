import { redirect } from "next/navigation";
import { BadgePercent, Wallet } from "lucide-react";
import { setMercadoPagoIntegrationVisibility, setTransferDiscountPercent } from "@/app/admin/actions";
import { PercentStepper } from "@/components/PercentStepper";
import { getAdminSession } from "@/lib/auth";
import { getAppSettings } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const settings = await getAppSettings();
  const showMercadoPagoIntegration = settings.showMercadoPagoIntegration;
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
              <h2>Mercado Pago</h2>
              <p className="muted">Cuando está desactivado se ocultan las páginas, botones y menús de Mercado Pago y propinas.</p>
            </div>
            <span className={showMercadoPagoIntegration ? "pill ok" : "pill warn"}>
              <Wallet size={14} />
              {showMercadoPagoIntegration ? "Visible" : "Oculto"}
            </span>
          </div>

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
              <h2>Descuento de transferencia</h2>
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
    </main>
  );
}

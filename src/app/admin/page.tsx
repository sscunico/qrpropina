import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Database, Settings, Users } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { getAdminSession } from "@/lib/auth";
import { aggregateTips, listCreatorsWithRecentTips } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const [creators, totals] = await Promise.all([
    listCreatorsWithRecentTips(0),
    aggregateTips()
  ]);

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Panel local</p>
          <h1>qrpropina</h1>
          <p className="muted">Administra creadores, datos locales, ajustes y actividad de la plataforma.</p>
        </div>
      </section>

      <section className="stats">
        <div className="stat">
          <span className="muted">Creadores <InfoTooltip text="Total de creadores registrados en la plataforma." position="bottom" /></span>
          <strong>{creators.length}</strong>
        </div>
        <div className="stat">
          <span className="muted">Propinas aprobadas <InfoTooltip text="Cantidad de pagos con estado aprobado por Mercado Pago." position="bottom" /></span>
          <strong>{totals.count}</strong>
        </div>
        <div className="stat">
          <span className="muted">Volumen aprobado <InfoTooltip text="Suma total de todas las propinas aprobadas, antes de descontar comisiones." position="bottom" /></span>
          <strong>{formatMoney(totals.amountCents)}</strong>
        </div>
        <div className="stat">
          <span className="muted">Comisión cobrada <InfoTooltip text="Total retenido por la plataforma en concepto de comisión sobre propinas aprobadas." position="bottom" /></span>
          <strong>{formatMoney(totals.platformFeeCents)}</strong>
        </div>
      </section>

      <section className="dashboard-grid">
        <Link className="dashboard-card" href="/admin/creadores">
          <Users size={24} />
          <strong>Creadores</strong>
          <span>Alta, edición y QR de cada creador.</span>
        </Link>
        <Link className="dashboard-card" href="/admin/datos">
          <Database size={24} />
          <strong>Datos</strong>
          <span>Base local, backups y exportación.</span>
        </Link>
        <Link className="dashboard-card" href="/admin/ajustes">
          <Settings size={24} />
          <strong>Ajustes</strong>
          <span>Configuración operativa y Mercado Pago.</span>
        </Link>
        <Link className="dashboard-card" href="/admin/notificaciones">
          <Bell size={24} />
          <strong>Notificaciones</strong>
          <span>Centro de avisos del panel.</span>
        </Link>
      </section>
    </main>
  );
}

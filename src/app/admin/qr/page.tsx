import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth";
import { listAdminQrCodes } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { AdminQrCreateForm } from "./AdminQrCreateForm";
import { AdminQrGrid } from "./AdminQrGrid";

export const dynamic = "force-dynamic";

export default async function AdminQrPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const qrCodes = await listAdminQrCodes();
  const base = appUrl();

  const rows = qrCodes.map((qr) => ({
    ...qr,
    url: `${base}/q/${qr.qrId}${qr.isAutoInstallable ? "?AI=True" : ""}`,
  }));

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Administración</p>
          <h1>QR</h1>
          <p className="muted">Generá códigos QR sin límite, con soporte para autoinstalación.</p>
        </div>
      </section>

      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="section-row compact-row">
          <div>
            <h2>Nuevo QR</h2>
            <p className="muted">El ID se usa como identificador único del código. Dejalo vacío para auto-generar.</p>
          </div>
        </div>
        <AdminQrCreateForm />
      </section>

      <section className="panel">
        <div className="section-row compact-row">
          <div>
            <h2>QR creados</h2>
            <p className="muted">
              {rows.length === 0
                ? "No hay QR todavía."
                : `${rows.length} código${rows.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <AdminQrGrid rows={rows} />
      </section>
    </main>
  );
}

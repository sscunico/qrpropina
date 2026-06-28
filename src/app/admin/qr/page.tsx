import { redirect } from "next/navigation";
import { QrCode, Trash2, Zap } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { listAdminQrCodes } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { deleteAdminQr } from "@/app/admin/actions";
import { AdminQrCreateForm } from "./AdminQrCreateForm";

export const dynamic = "force-dynamic";

export default async function AdminQrPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const qrCodes = await listAdminQrCodes();
  const base = appUrl();

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
            <p className="muted">El ID se usa como identificador único del código.</p>
          </div>
        </div>
        <AdminQrCreateForm />
      </section>

      <section className="panel">
        <div className="section-row compact-row">
          <div>
            <h2>QR creados</h2>
            <p className="muted">{qrCodes.length === 0 ? "No hay QR todavía." : `${qrCodes.length} código${qrCodes.length !== 1 ? "s" : ""}`}</p>
          </div>
        </div>

        {qrCodes.length === 0 ? (
          <p className="muted">Todavía no hay QR generados. Creá el primero arriba.</p>
        ) : (
          <div className="qr-list">
            {qrCodes.map((qr) => {
              const qrUrl = `${base}/q/${qr.qrId}${qr.isAutoInstallable ? "?AI=True" : ""}`;
              const deleteAction = deleteAdminQr.bind(null, qr.id);
              return (
                <div className="qr-item" key={qr.id}>
                  <div className="qr-item-header">
                    <div className="qr-item-title">
                      <h3 className="section-title-with-icon">
                        {qr.isAutoInstallable ? <Zap size={16} color="var(--accent)" /> : <QrCode size={16} />}
                        {qr.qrId}
                      </h3>
                      <div className="qr-url-row">
                        <code>{qrUrl}</code>
                      </div>
                    </div>
                    {qr.isAutoInstallable && (
                      <span className="pill ok" style={{ flexShrink: 0 }}>
                        <Zap size={12} />
                        Autoinstalable
                      </span>
                    )}
                  </div>
                  <div className="qr-item-footer">
                    <form action={deleteAction}>
                      <button className="button danger" type="submit">
                        <Trash2 size={16} />
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

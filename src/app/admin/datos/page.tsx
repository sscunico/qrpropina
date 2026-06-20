import Link from "next/link";
import { redirect } from "next/navigation";
import { Database, Download, ScrollText } from "lucide-react";
import { getAdminSession } from "@/lib/auth";
import { getStorageInfo } from "@/lib/db";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDateTime(value: string | null) {
  if (!value) return "Sin datos";
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export default async function AdminDataPage() {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const storageInfo = await getStorageInfo();

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Herramientas</p>
          <h1>Datos</h1>
          <p className="muted">Persistencia local, backups y exportación de la base.</p>
        </div>
        <div className="actions">
          <Link className="button secondary" href="/admin/logs"><ScrollText size={18} />Ver logs</Link>
          <a className="button secondary" href="/api/admin/export"><Download size={18} />Descargar backup</a>
        </div>
      </section>

      <section className="panel storage-panel" id="datos-locales">
        <div className="section-row compact-row">
          <div>
            <p className="kicker">Datos locales</p>
            <h2>Base de datos de creadores</h2>
            <p className="muted">Los creadores, propinas y eventos quedan guardados en este equipo.</p>
          </div>
        </div>
        <div className="storage-list">
          <div className="storage-row"><span className="muted"><Database size={16} />Archivo</span><code>{storageInfo.dbPath}</code></div>
          <div className="storage-row"><span className="muted">Backups</span><code>{storageInfo.backupDir}</code></div>
          <div className="storage-row"><span className="muted">Estado</span><strong>{storageInfo.exists ? "Activo" : "Pendiente"}</strong></div>
          <div className="storage-row"><span className="muted">Tamaño</span><strong>{formatBytes(storageInfo.sizeBytes)}</strong></div>
          <div className="storage-row"><span className="muted">Último cambio</span><strong>{formatDateTime(storageInfo.updatedAt)}</strong></div>
        </div>
        <p className="muted small-note">Se crea un backup automático diario antes de sobrescribir los datos.</p>
      </section>
    </main>
  );
}

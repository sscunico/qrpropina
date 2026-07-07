import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminQrCreateForm } from "./AdminQrCreateForm";
import { AdminQrGrid } from "./AdminQrGrid";
import { getAdminSession } from "@/lib/auth";
import { listAdminQrCodes } from "@/lib/db";
import { appUrl } from "@/lib/env";
import { qrDataUrl } from "@/lib/qrcode";

export const dynamic = "force-dynamic";

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

type Props = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

function normalizePageSize(value?: string) {
  const parsed = parseInt(value || "10", 10);
  return PAGE_SIZE_OPTIONS.includes(parsed) ? parsed : 10;
}

function buildHref(page: number, pageSize: number) {
  return `/admin/qr?page=${page}&pageSize=${pageSize}`;
}

export default async function AdminQrPage({ searchParams }: Props) {
  const session = await getAdminSession();
  if (session?.role === "creator") {
    redirect(session.creatorId ? `/admin/creadores/${session.creatorId}` : "/login");
  }

  const params = await searchParams;
  const pageSize = normalizePageSize(params.pageSize);
  const page = Math.max(1, parseInt(params.page || "1", 10) || 1);
  const { items: qrCodes, total, totalPages } = await listAdminQrCodes(page, pageSize);
  const safePage = Math.min(page, Math.max(1, totalPages));
  const base = appUrl();

  const rows = await Promise.all(
    qrCodes.map(async (qr) => {
      const url = `${base}/q/${qr.qrId}${qr.isAutoInstallable ? "?AI=True" : ""}`;
      return { ...qr, url, image: await qrDataUrl(url) };
    })
  );

  return (
    <main className="page">
      <section className="hero-row">
        <div>
          <p className="kicker">Administración</p>
          <h1>QR</h1>
          <p className="muted">Generá códigos QR sin límite, con soporte para autoinstalación.</p>
        </div>
      </section>

      <section className="panel admin-qr-create-panel">
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
          </div>
        </div>

        <div className="admin-table-toolbar">
          <p className="muted">{total === 0 ? "No hay QR todavía." : `${total} código${total !== 1 ? "s" : ""} en total`}</p>
          <form className="page-size-form" method="get">
            <input name="page" type="hidden" value="1" />
            <label htmlFor="pageSize">Items por página</label>
            <select id="pageSize" name="pageSize" defaultValue={pageSize.toString()}>
              {PAGE_SIZE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            <button className="button secondary" type="submit">Aplicar</button>
          </form>
        </div>

        <AdminQrGrid rows={rows} />

        {totalPages > 1 ? (
          <nav aria-label="Paginación de QR" className="pagination">
            {safePage > 1 ? (
              <Link className="button secondary" href={buildHref(safePage - 1, pageSize)}>
                <ChevronLeft size={16} />
                Anterior
              </Link>
            ) : null}
            <span className="muted pagination-info">Página {safePage} de {totalPages}</span>
            {safePage < totalPages ? (
              <Link className="button secondary" href={buildHref(safePage + 1, pageSize)}>
                Siguiente
                <ChevronRight size={16} />
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </main>
  );
}

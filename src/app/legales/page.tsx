import Link from "next/link";
import { FileText, ShieldCheck, UserCheck, Scale } from "lucide-react";
import { legalPages } from "@/lib/legalContent";

const iconBySlug = {
  terminos: FileText,
  privacidad: UserCheck,
  seguridad: ShieldCheck,
  "defensa-consumidor": Scale
};

export const metadata = {
  title: "Legales | qrpropina",
  description: "Términos, privacidad, seguridad y reclamos de qrpropina."
};

export default function LegalIndexPage() {
  return (
    <main className="legal-page">
      <section className="legal-hero">
        <p className="kicker">Centro legal</p>
        <h1>Legales y seguridad</h1>
        <p>
          Informacion clara sobre el uso de qrpropina, privacidad, seguridad, pagos,
          datos personales y canales de consulta.
        </p>
      </section>

      <section className="legal-grid" aria-label="Paginas legales">
        {legalPages.map((page) => {
          const Icon = iconBySlug[page.slug];

          return (
            <Link className="legal-card" href={`/legales/${page.slug}`} key={page.slug}>
              <span className="legal-card-icon">
                <Icon size={22} />
              </span>
              <span>
                <strong>{page.title}</strong>
                <small>{page.summary}</small>
              </span>
            </Link>
          );
        })}
      </section>
    </main>
  );
}

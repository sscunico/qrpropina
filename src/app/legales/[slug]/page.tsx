import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLegalPage, legalPages } from "@/lib/legalContent";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return legalPages.map((page) => ({ slug: page.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) {
    return {
      title: "Legal | qrpropina"
    };
  }

  return {
    title: `${page.title} | qrpropina`,
    description: page.summary
  };
}

export default async function LegalDetailPage({ params }: Props) {
  const { slug } = await params;
  const page = getLegalPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <main className="legal-page">
      <Link className="button secondary legal-back" href="/legales">
        <ArrowLeft size={18} />
        Centro legal
      </Link>

      <article className="legal-document">
        <header className="legal-document-header">
          <p className="kicker">{page.eyebrow}</p>
          <h1>{page.title}</h1>
          <p>{page.summary}</p>
          <span className="pill">Ultima actualización: {page.updatedAt}</span>
        </header>

        <div className="legal-sections">
          {page.sections.map((section) => (
            <section className="legal-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
              {section.bullets ? (
                <ul>
                  {section.bullets.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : null}
            </section>
          ))}
        </div>
      </article>
    </main>
  );
}

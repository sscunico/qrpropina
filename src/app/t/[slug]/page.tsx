import { notFound } from "next/navigation";
import { WalletCards } from "lucide-react";
import { TipForm } from "@/app/t/[slug]/TipForm";
import { getRecipientBySlug } from "@/lib/db";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default async function TipPage({ params }: Props) {
  const { slug } = await params;
  const recipient = await getRecipientBySlug(slug);

  if (!recipient || !recipient.isActive) {
    notFound();
  }

  return (
    <main className="page-narrow">
      <section className="tip-surface">
        <div className="tip-header">
          <div className="avatar">{initials(recipient.displayName)}</div>
          <p className="kicker">Propina segura</p>
          <h1>{recipient.displayName}</h1>
          <p className="muted">
            {[recipient.role, recipient.locationName].filter(Boolean).join(" - ") ||
              "Gracias por acompanarme con una propina."}
          </p>
          <div className="actions">
            <span className="pill">
              <WalletCards size={14} />
              Mercado Pago
            </span>
          </div>
        </div>
        <TipForm recipientName={recipient.displayName} slug={recipient.slug} />
      </section>
    </main>
  );
}

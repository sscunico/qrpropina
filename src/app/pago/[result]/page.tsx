import { getTipWithCreator, updateTipRecord } from "@/lib/db";
import { CreatorAvatar } from "@/app/t/[slug]/CreatorAvatar";

type Props = {
  params: Promise<{ result: string }>;
  searchParams: Promise<{ tipId?: string }>;
};

export const dynamic = "force-dynamic";

export default async function PaymentResultPage({ params, searchParams }: Props) {
  const { result } = await params;
  const { tipId } = await searchParams;
  let tip = tipId ? await getTipWithCreator(tipId) : null;

  if (result === "demo" && tip && tip.status === "demo_created") {
    await updateTipRecord(tip.id, { status: "demo_approved" });
    tip = await getTipWithCreator(tip.id);
  }

  return (
    <main className="page-narrow">
      <section className="tip-surface">
        <div aria-hidden="true" className="tip-header" />
        {tip ? (
          <div className="tip-profile-header">
            <div className="tip-profile-avatar-column">
              <CreatorAvatar displayName={tip.creator.displayName} photoUrl={tip.creator.photoUrl} />
            </div>
            <div className="tip-profile-name-column">
              <h1>{tip.creator.displayName}</h1>
              <p className="muted" style={{ marginTop: 4 }}>¡Gracias por tu propina!</p>
            </div>
          </div>
        ) : null}
        <div className="tip-body" style={{ textAlign: "center", paddingTop: 8 }}>
          <p className="muted">Tu pago está pendiente de confirmación por Mercado Pago.</p>
        </div>
      </section>
    </main>
  );
}

import { getTipWithCreator, updateTipRecord } from "@/lib/db";
import { CreatorAvatar } from "@/app/t/[slug]/CreatorAvatar";
import { SocialLinks } from "@/components/SocialLinks";

type Props = {
  params: Promise<{ result: string }>;
  searchParams: Promise<{ tipId?: string }>;
};

export const dynamic = "force-dynamic";

const DEFAULT_THANK_YOU = "¡Gracias por tu propina! Tu gesto hace la diferencia 🙏";

export default async function PaymentResultPage({ params, searchParams }: Props) {
  const { result } = await params;
  const { tipId } = await searchParams;
  let tip = tipId ? await getTipWithCreator(tipId) : null;

  if (result === "demo" && tip && tip.status === "demo_created") {
    await updateTipRecord(tip.id, { status: "demo_approved" });
    tip = await getTipWithCreator(tip.id);
  }

  const creator = tip?.creator ?? null;
  const thankYouMessage = creator?.thankYouMessage || DEFAULT_THANK_YOU;

  return (
    <main className="ty-page">
      <div className="ty-hero">
        <div className="ty-hero-sparkle ty-hero-sparkle--1" />
        <div className="ty-hero-sparkle ty-hero-sparkle--2" />
        <div className="ty-hero-sparkle ty-hero-sparkle--3" />
        <div className="ty-hero-badge">✦</div>
      </div>

      <div className="ty-body">
        <div className="ty-avatar-ring">
          <CreatorAvatar
            displayName={creator?.displayName ?? ""}
            photoUrl={creator?.photoUrl ?? null}
          />
        </div>

        <div className="ty-message-card">
          {creator ? <p className="ty-creator-name">{creator.displayName}</p> : null}
          <div
            className="ty-message-text"
            dangerouslySetInnerHTML={{ __html: thankYouMessage }}
          />
        </div>

        {creator?.socialLinks ? (
          <div className="ty-socials">
            <SocialLinks links={creator.socialLinks} />
          </div>
        ) : null}
      </div>

      <footer className="ty-footer">
        © 2026 Qrpropina · All rights reserved.
      </footer>
    </main>
  );
}

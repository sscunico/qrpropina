import { notFound } from "next/navigation";
import { CreatorAvatar } from "@/app/t/[slug]/CreatorAvatar";
import { TipForm } from "@/app/t/[slug]/TipForm";
import { getAppSettings, getQrCodeWithCreatorByQrId } from "@/lib/db";

type Props = {
  params: Promise<{ qrId: string }>;
};

export const dynamic = "force-dynamic";

export default async function QrTipPage({ params }: Props) {
  const { qrId } = await params;
  const [qrCode, settings] = await Promise.all([getQrCodeWithCreatorByQrId(qrId), getAppSettings()]);

  if (!qrCode || !qrCode.creator.isActive) {
    notFound();
  }

  const creator = qrCode.creator;

  return (
    <main className="page-narrow">
      <section className="tip-surface">
        <div aria-hidden="true" className="tip-header" />
        <div className="tip-profile-header">
          <div className="tip-profile-avatar-column">
            <CreatorAvatar displayName={creator.displayName} photoUrl={creator.photoUrl} />
          </div>
          <div className="tip-profile-name-column">
            <h1>{creator.displayName}</h1>
          </div>
        </div>
        <TipForm commissionPercent={settings.transferDiscountPercent} creatorName={creator.displayName} slug={creator.slug} />
      </section>
    </main>
  );
}

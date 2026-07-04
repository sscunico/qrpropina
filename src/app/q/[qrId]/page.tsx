import { notFound, redirect } from "next/navigation";
import { CreatorAvatar } from "@/app/t/[slug]/CreatorAvatar";
import { TipForm } from "@/app/t/[slug]/TipForm";
import { getAdminSession } from "@/lib/auth";
import { getAppSettings, getQrCodeByQrId, getQrCodeWithCreatorByQrId } from "@/lib/db";

type Props = {
  params: Promise<{ qrId: string }>;
  searchParams: Promise<{ AI?: string }>;
};

export const dynamic = "force-dynamic";

export default async function QrTipPage({ params, searchParams }: Props) {
  const { qrId } = await params;
  const sp = await searchParams;

  if (sp.AI === "True") {
    const qrCode = await getQrCodeByQrId(qrId);
    if (!qrCode) notFound();

    if (qrCode.isAutoInstallable && qrCode.creatorId === null) {
      redirect(`/api/qr/install?qrId=${encodeURIComponent(qrId)}`);
    }
    // QR ya asignado o no autoinstalable → continuar con flujo normal
  }

  const [qrCode, settings, session] = await Promise.all([
    getQrCodeWithCreatorByQrId(qrId),
    getAppSettings(),
    getAdminSession(),
  ]);

  // Si el creador logueado escanea su propio QR, lo redirigimos al home con aviso
  if (session?.creatorId && qrCode?.creatorId === session.creatorId) {
    redirect("/?ownqr=1");
  }

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

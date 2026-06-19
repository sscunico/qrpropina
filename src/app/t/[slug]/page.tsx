import { notFound } from "next/navigation";
import { CreatorAvatar } from "@/app/t/[slug]/CreatorAvatar";
import { TipForm } from "@/app/t/[slug]/TipForm";
import { getCreatorBySlug } from "@/lib/db";

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamic = "force-dynamic";


export default async function TipPage({ params }: Props) {
  const { slug } = await params;
  const creator = await getCreatorBySlug(slug);

  if (!creator || !creator.isActive) {
    notFound();
  }

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
        <TipForm creatorName={creator.displayName} slug={creator.slug} />
      </section>
    </main>
  );
}

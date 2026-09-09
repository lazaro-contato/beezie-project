import type { Metadata } from "next";
import { notFound } from "next/navigation";

/** A pull belongs to one viewer and `getPull` is owner-scoped, so there is
 *  nothing here for a crawler. robots.txt disallows the path as well. */
export const metadata: Metadata = { robots: { index: false, follow: false } };
import { getPull } from "@/features/reveal/queries.pull";
import { SingleReveal } from "@/features/reveal/components/SingleReveal";
import { MultiRevealGrid } from "@/features/reveal/components/MultiRevealGrid";
import { clearPullQuantity, finishPull } from "@/features/checkout/actions";

export default async function PullResultPage({ params }: PageProps<"/claw/[slug]/pull/[pullId]">) {
  const { slug, pullId } = await params;

  const pull = await getPull({ pullId, slug });
  if (!pull) {
    notFound();
  }

  return (
    <div className="absolute inset-0 flex flex-col overflow-hidden bg-background">
      {pull.items.length === 1 ? (
        <SingleReveal pull={pull} slug={slug} finishPull={finishPull} />
      ) : (
        <MultiRevealGrid pull={pull} slug={slug} clearPullQuantity={clearPullQuantity} />
      )}
    </div>
  );
}

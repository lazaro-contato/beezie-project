import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MACHINE_SLUGS } from "@/lib/machines";
import { SITE_NAME, SITE_OG_IMAGE, SITE_URL } from "@/lib/site";
import { JsonLd } from "@/app/_components/JsonLd";
import { formatCents } from "@/lib/money";
import { getMachineBySlug } from "@/features/machine/queries";
import { MachineHero } from "@/features/machine/components/MachineHero";
import { MachineIdleStage } from "@/features/machine/components/MachineIdleStage";
import { PurchasePanel } from "@/features/machine/components/PurchasePanel";
import { openCheckout } from "@/features/checkout/actions";
import { SwapRateBadge } from "@/features/machine/components/SwapRateBadge";
import { TopItems } from "@/features/machine/components/TopItems";
import { RecentPulls } from "@/features/machine/components/RecentPulls";
import {
  RecentPullsSkeleton,
  SwapRateBadgeSkeleton,
} from "@/features/machine/components/skeletons";
import { PromoCodeForm, PromoCodeFormSkeleton } from "@/features/checkout/components/PromoCodeForm";

/**
 * A hard-coded constant, not a build-time database read — `.data/beezie.db`
 * is gitignored, so reading it here would fail `pnpm build` on a fresh
 * clone.
 */
export function generateStaticParams() {
  return MACHINE_SLUGS.map((slug) => ({ slug }));
}

/**
 * Awaits `params` but never `searchParams`: the unawaited promise is passed
 * down to the components that own their own Suspense boundary (`ActionRow`,
 * `SwapRateBadge`). Awaiting it here would silently collapse this entire
 * static shell into a stream hole, with no build error to say so.
 *
 * The same rule covers `readPrefs()` and `readAppliedPromo()` — each is
 * called only inside its own Suspense boundary below, never in this body.
 */
/** The machine is the page worth indexing, and it had no metadata of its own:
 *  every slug inherited the root title and description, so four distinct URLs
 *  looked identical to a crawler and to anything unfurling a link. */
export async function generateMetadata({ params }: PageProps<"/claw/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const machine = await getMachineBySlug(slug);
  if (!machine) {
    return { title: "Machine not found" };
  }

  const title = `${machine.name} · ${formatCents(machine.unitPriceCents, { precision: "auto" })} a pull`;

  return {
    title: machine.name,
    description: machine.description,
    alternates: { canonical: `/claw/${slug}` },
    openGraph: {
      type: "website",
      siteName: SITE_NAME,
      title,
      description: machine.description,
      url: `/claw/${slug}`,
      locale: "en_US",
      images: [SITE_OG_IMAGE],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: machine.description,
      images: [SITE_OG_IMAGE.url],
    },
  };
}

export default async function ClawMachinePage({ params, searchParams }: PageProps<"/claw/[slug]">) {
  const { slug } = await params;

  const machine = await getMachineBySlug(slug);
  if (!machine) {
    notFound();
  }

  // What the page is actually offering, in the vocabulary a search engine
  // reads: a named thing at a price, in stock or not.
  const machineJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: machine.name,
    description: machine.description,
    image: `${SITE_URL}${SITE_OG_IMAGE.url}`,
    brand: { "@type": "Brand", name: SITE_NAME },
    url: `${SITE_URL}/claw/${machine.slug}`,
    offers: {
      "@type": "Offer",
      price: (machine.unitPriceCents / 100).toFixed(2),
      priceCurrency: "USD",
      availability:
        machine.status === "active"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/claw/${machine.slug}`,
    },
  };

  return (
    <div className="mx-auto flex w-full max-w-page flex-col gap-8 px-4 pb-56 pt-6 nav:px-10 nav:pb-12">
      <JsonLd data={machineJsonLd} />
      <div className="grid grid-cols-1 gap-6 nav:grid-cols-2 nav:gap-8">
        <div className="relative">
          <MachineHero machine={machine} />
          <Suspense fallback={null}>
            <MachineIdleStage slug={machine.slug} />
          </Suspense>
        </div>
        <PurchasePanel
          machine={machine}
          openCheckout={openCheckout}
          swapBadge={
            <Suspense fallback={<SwapRateBadgeSkeleton />}>
              <SwapRateBadge slug={machine.slug} searchParams={searchParams} />
            </Suspense>
          }
          promo={
            <Suspense fallback={<PromoCodeFormSkeleton className="order-2 nav:order-3" />}>
              <PromoCodeForm className="order-2 nav:order-3" />
            </Suspense>
          }
        />
      </div>
      {/* `md`, not `nav`: these two panels are independent of the machine
          column split and each is comfortable from ~360px, which 768 gives
          them. Waiting for 1060 left a tablet scrolling two full-width
          panels one after the other. */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <TopItems slug={machine.slug} />
        <Suspense fallback={<RecentPullsSkeleton />}>
          <RecentPulls slug={machine.slug} />
        </Suspense>
      </div>
    </div>
  );
}

import { Suspense } from "react";
import { SiteHeader } from "@/app/_components/SiteHeader";
import { SwapSuccessDialog } from "@/features/reveal/components/SwapSuccessDialog.client";
import { WalletBadgeSlot } from "@/features/checkout/components/WalletBadgeSlot";
import { SiteHeaderSkeleton, WalletBadgeSkeleton } from "@/features/machine/components/skeletons";
import { WALLET_BADGE_HEIGHT, WALLET_BADGE_WIDTH } from "@/features/machine/constants";
import { RevealStage } from "@/features/reveal/components/RevealStage";
import { MachineCrossfade } from "@/features/machine/components/MachineCrossfade.client";

async function SiteHeaderSlot({ params }: { params: LayoutProps<"/claw/[slug]">["params"] }) {
  const { slug } = await params;

  return (
    <SiteHeader
      active="claw"
      clawSlug={slug}
      wallet={
        <div style={{ minWidth: WALLET_BADGE_WIDTH, minHeight: WALLET_BADGE_HEIGHT }}>
          <Suspense fallback={<WalletBadgeSkeleton />}>
            <WalletBadgeSlot />
          </Suspense>
        </div>
      }
    />
  );
}

export default function ClawLayout({ params, children, sheet, card, swap, swapped }: LayoutProps<"/claw/[slug]">) {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <Suspense fallback={<SiteHeaderSkeleton />}>
        <SiteHeaderSlot params={params} />
      </Suspense>
      <main className="relative flex min-h-0 flex-1 flex-col">
        <MachineCrossfade>{children}</MachineCrossfade>
      </main>
      <Suspense fallback={null}>{sheet}</Suspense>
      <Suspense fallback={null}>{card}</Suspense>
      {/* The `@swap` slot (the SWAP rate dialog), same `fallback={null}`
          reasoning as its two neighbours: an overlay has no layout footprint
          whether open or closed, so nothing is reserved and CLS is
          untouched. */}
      <Suspense fallback={null}>{swap}</Suspense>
      <Suspense fallback={null}>{swapped}</Suspense>
      <SwapSuccessDialog />
      <Suspense fallback={null}>
        <RevealStage params={params} />
      </Suspense>
    </div>
  );
}

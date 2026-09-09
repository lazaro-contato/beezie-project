import { Panel } from "@/components/ui/Panel";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ACTION_ROW_HEIGHT,
  BOTTOM_PANEL_HEIGHT,
  ODDS_BAND_HEIGHT,
  ODDS_PANEL_HEIGHT,
  SCROLL_VIEWPORT_HEIGHT,
  SWAP_BADGE_HEIGHT,
  SWAP_BADGE_WIDTH,
  WALLET_BADGE_HEIGHT,
  WALLET_BADGE_WIDTH,
} from "../constants";


export function SwapRateBadgeSkeleton() {
  return <Skeleton height={SWAP_BADGE_HEIGHT} width={SWAP_BADGE_WIDTH} className="shrink-0 rounded-full" />;
}

export function ActionRowSkeleton() {
  return (
    <div className="flex w-full flex-col gap-3" style={{ height: ACTION_ROW_HEIGHT }}>
      <Skeleton height={32} width={180} />
      <div className="flex items-center gap-3">
        <Skeleton height={48} width={128} className="shrink-0 rounded-lg" />
        <Skeleton height={48} className="flex-1 rounded-lg" />
      </div>
    </div>
  );
}

/** Fallback for `OddsPanel`, inside `PurchasePanel`'s Suspense boundary. */
export function OddsPanelSkeleton() {
  return (
    <div className="flex flex-col gap-2.5" style={{ height: ODDS_PANEL_HEIGHT }}>
      <div className="flex items-start justify-between gap-4">
        <Skeleton height={46} width={140} />
        <Skeleton height={42} width={96} />
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2, 3, 4].map((tier) => (
          <Skeleton key={tier} height={ODDS_BAND_HEIGHT} className="rounded-sm" />
        ))}
      </div>
    </div>
  );
}

/** Fallback for `RecentPulls`, owned by `app/claw/[slug]/page.tsx`. */
export function RecentPullsSkeleton() {
  return (
    <Panel className="flex flex-col gap-4 p-6" style={{ height: BOTTOM_PANEL_HEIGHT }}>
      <Skeleton height={24} width={140} className="mx-auto" />
      <Skeleton height={SCROLL_VIEWPORT_HEIGHT} />
    </Panel>
  );
}

export function WalletBadgeSkeleton() {
  return <Skeleton height={WALLET_BADGE_HEIGHT} width={WALLET_BADGE_WIDTH} className="rounded-full" />;
}

export function SiteHeaderSkeleton() {
  return (
    <div
      className="flex items-center gap-6 border-b border-border px-5 py-4 nav:px-12.5 nav:py-5.5"
    >
      <Skeleton height={32} width={22} className="nav:hidden" />
      <Skeleton height={40} width={94} className="hidden nav:block" />
      <div className="ml-auto flex items-center gap-3">
        <Skeleton height={40} width={96} className="tap-target hidden rounded-lg nav:block" />
        <Skeleton height={WALLET_BADGE_HEIGHT} width={WALLET_BADGE_WIDTH} className="rounded-lg" />
        <Skeleton height={40} width={40} className="tap-target hidden rounded-full nav:block" />
        <Skeleton height={44} width={44} className="rounded-lg nav:hidden" />
      </div>
    </div>
  );
}


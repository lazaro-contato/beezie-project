import { CircleHelp } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { Skeleton, SkeletonText } from "@/components/ui/Skeleton";
import { CARD_ASPECT, CARD_ROW_HEIGHT, CARD_ROW_THUMB_SIZE } from "@/entities/card/constants";
import { cn } from "@/lib/cn";
import {
  ACTION_ROW_HEIGHT,
  BOTTOM_PANEL_HEIGHT,
  MORE_MACHINE_TILE_HEIGHT,
  MORE_MACHINES_LIMIT,
  ODDS_BAND_HEIGHT,
  ODDS_PANEL_HEIGHT,
  RECENT_PULLS_LIMIT,
  SCROLL_VIEWPORT_HEIGHT,
  SWAP_BADGE_HEIGHT,
  SWAP_BADGE_WIDTH,
  TOP_ITEMS_LIMIT,
  WALLET_BADGE_HEIGHT,
  WALLET_BADGE_WIDTH,
} from "../constants";
import type { MachineDTO } from "../types";

/*
 * Each skeleton keeps the static copy of the section it stands in for and
 * pulses only what the server supplies, in the same boxes and grid, so the
 * arrival of the real content moves nothing.
 */

function placeholders(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}

export function SwapRateBadgeSkeleton() {
  return <Skeleton height={SWAP_BADGE_HEIGHT} width={SWAP_BADGE_WIDTH} className="shrink-0 rounded-full" />;
}

type MachineSummarySkeletonProps = {
  machine: Pick<MachineDTO, "name" | "description">;
  className?: string;
};

/** Bars shaped by the machine's own copy, so a description of any length
 *  reserves the lines it will wrap to at every width. */
export function MachineSummarySkeleton({ machine, className }: MachineSummarySkeletonProps) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="text-2xl font-semibold leading-8">
          <SkeletonText>{machine.name}</SkeletonText>
        </div>
        <SwapRateBadgeSkeleton />
      </div>
      <p className="text-sm font-medium leading-5">
        <SkeletonText>{machine.description}</SkeletonText>
      </p>
    </div>
  );
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

/** The same header and band grid as `OddsPanel`: below `xl` the bands take
 *  three rows, and a skeleton that assumed two would shift everything under it. */
export function OddsPanelSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)} style={{ minHeight: ODDS_PANEL_HEIGHT }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-base font-semibold text-foreground">
            Odds
            <CircleHelp size={14} className="text-secondary-foreground" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-secondary-foreground">Updates every few seconds.</p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <p className="text-sm font-medium leading-5 text-secondary-foreground">Average value:</p>
          <Skeleton height={16} width={88} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {placeholders(5).map((tier) => (
          <Skeleton key={tier} height={ODDS_BAND_HEIGHT} className="rounded-[10px]" />
        ))}
      </div>
    </div>
  );
}

export function MoreMachinesSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col justify-end gap-2.5 nav:grow", className)}>
      <h2 className="text-base font-semibold text-foreground">More claw machines</h2>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
        {placeholders(MORE_MACHINES_LIMIT).map((tile) => (
          <Skeleton key={tile} height={MORE_MACHINE_TILE_HEIGHT} className="rounded-lg" />
        ))}
      </div>
    </div>
  );
}

export function TopItemsSkeleton() {
  return (
    <Panel className="flex flex-col gap-4 p-6" style={{ height: BOTTOM_PANEL_HEIGHT }}>
      <h2 className="text-center text-lg font-semibold text-foreground">Top items</h2>
      <div
        className="grid auto-rows-min grid-cols-2 gap-3 overflow-hidden sm:gap-4 sm:[grid-template-columns:repeat(auto-fill,minmax(128px,1fr))]"
        style={{ height: SCROLL_VIEWPORT_HEIGHT }}
      >
        {placeholders(TOP_ITEMS_LIMIT).map((tile) => (
          <div key={tile} className="flex flex-col gap-2">
            <div className="w-full" style={{ aspectRatio: CARD_ASPECT }}>
              <Skeleton height="100%" className="rounded-lg" />
            </div>
            <Skeleton height={20} className="w-4/5" />
            <Skeleton height={16} className="w-1/2" />
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function RecentPullsSkeleton() {
  return (
    <Panel className="flex flex-col gap-4 p-6" style={{ height: BOTTOM_PANEL_HEIGHT }}>
      <h2 className="text-center text-lg font-semibold text-foreground">Recent pulls</h2>
      <div className="overflow-hidden" style={{ height: SCROLL_VIEWPORT_HEIGHT }}>
        {placeholders(RECENT_PULLS_LIMIT).map((row) => (
          <div
            key={row}
            className="flex items-center gap-3 border-b border-border last:border-b-0"
            style={{ height: CARD_ROW_HEIGHT }}
          >
            <Skeleton height={CARD_ROW_THUMB_SIZE} width={CARD_ROW_THUMB_SIZE} className="shrink-0" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <Skeleton height={14} className="w-3/5" />
              <Skeleton height={12} className="w-2/5" />
            </div>
            <Skeleton height={16} width={56} className="shrink-0" />
          </div>
        ))}
      </div>
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

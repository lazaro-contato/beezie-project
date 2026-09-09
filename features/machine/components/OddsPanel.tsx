import type { CSSProperties } from "react";
import { CircleHelp } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RarityTier } from "@/components/ui/RarityChip";
import { formatPercentFromBps } from "@/lib/format";
import { getOdds } from "../queries";
import { ODDS_BAND_HEIGHT, ODDS_PANEL_HEIGHT } from "../constants";
import { OddsPanelLive } from "./OddsPanel.client";

type OddsPanelProps = {
  slug: string;
  className?: string;
};

type BandStyle = {
  box: CSSProperties;
  label: CSSProperties;
  value: CSSProperties;
};


const TIER_RGB: Record<RarityTier, string> = {
  5: "251,191,36",
  4: "192,132,252",
  3: "96,165,250",
  2: "110,231,183",
  1: "170,170,170",
};

function band(tier: RarityTier): BandStyle {
  const rgb = TIER_RGB[tier];
  return {
    box: {
      background: `linear-gradient(100deg, rgba(${rgb},0.13) 0%, rgba(${rgb},0.02) 55%, rgba(${rgb},0) 100%), rgb(30,30,30)`,
      borderLeftColor: `rgb(${rgb})`,
    },
    // Base reads as neutral in the design: grey edge, plain foreground text.
    label: { color: tier === 1 ? "rgb(228,228,228)" : `rgb(${rgb})` },
    value: { color: tier === 1 ? "rgb(245,245,245)" : `rgb(${rgb})` },
  };
}

const bandStyles: Record<RarityTier, BandStyle> = {
  5: band(5),
  4: band(4),
  3: band(3),
  2: band(2),
  1: band(1),
};

function formatBandBoundary(cents: number): number {
  return Math.ceil(cents / 100);
}

function formatValueBand(minCents: number, maxCents: number | null): string {
  const min = formatBandBoundary(minCents);
  if (maxCents === null) {
    return `$${min}+`;
  }
  return `$${min} - $${Math.floor(maxCents / 100)}`;
}

export async function OddsPanel({ slug, className }: OddsPanelProps) {
  const odds = await getOdds(slug);

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
          <OddsPanelLive slug={slug} initial={{ averageValueCents: odds.averageValueCents }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 xl:grid-cols-3">
        {odds.tiers.map((tier) => (
          <div
            key={tier.tier}
            className="flex flex-col justify-center gap-1 rounded-[10px] border-l-[3px] px-2.5 py-2.5 nav:gap-1.5 nav:px-3 nav:py-3 xl:px-4"
            style={{ minHeight: ODDS_BAND_HEIGHT, ...bandStyles[tier.tier].box }}
          >
            <div className="flex justify-between gap-1">
              <span
                className="truncate text-[11px] font-semibold leading-4 nav:text-[13px] xl:text-[15px] nav:leading-5"
                style={bandStyles[tier.tier].label}
              >
                {tier.name}
              </span>
              <span
                className="shrink-0 text-[11px] font-semibold leading-4 tabular-nums nav:text-[13px] xl:text-[15px] nav:leading-5"
                style={bandStyles[tier.tier].value}
              >
                {formatPercentFromBps(tier.probabilityBps)}
              </span>
            </div>
            <p className="text-[11px] font-medium leading-4 text-secondary-foreground nav:text-[13px]">
              {formatValueBand(tier.minCents, tier.maxCents)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

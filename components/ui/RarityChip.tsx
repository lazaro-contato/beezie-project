import { cn } from "@/lib/cn";

export type RarityTier = 1 | 2 | 3 | 4 | 5;

// Full literal strings, not `bg-rarity-${tier}`: a dynamically composed
// class name is invisible to Tailwind's production scanner.
const tierClasses: Record<RarityTier, string> = {
  1: "bg-rarity-1/10 text-rarity-1",
  2: "bg-rarity-2/10 text-rarity-2",
  3: "bg-rarity-3/10 text-rarity-3",
  4: "bg-rarity-4/10 text-rarity-4",
  5: "bg-rarity-5/10 text-rarity-5",
};

const tierTextClasses: Record<RarityTier, string> = {
  1: "text-rarity-1",
  2: "text-rarity-2",
  3: "text-rarity-3",
  4: "text-rarity-4",
  5: "text-rarity-5",
};

const tierBorderClasses: Record<RarityTier, string> = {
  1: "border-l-rarity-1",
  2: "border-l-rarity-2",
  3: "border-l-rarity-3",
  4: "border-l-rarity-4",
  5: "border-l-rarity-5",
};

/** The rarity ramp as a left-border colour, for the odds panel's bands. */
export function rarityBorderClass(tier: RarityTier): string {
  return tierBorderClasses[tier];
}

/** The rarity ramp's text colour only, for a consumer that needs to tint a
 * value by tier without rendering a full chip (e.g. `CardTile`'s FMV). */
export function rarityTextClass(tier: RarityTier): string {
  return tierTextClasses[tier];
}

type RarityChipProps = {
  tier: RarityTier;
  label: string;
  className?: string;
};

export function RarityChip({ tier, label, className }: RarityChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium",
        tierClasses[tier],
        className,
      )}
    >
      {label}
    </span>
  );
}

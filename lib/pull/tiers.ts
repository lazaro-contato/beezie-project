export type Tier = 1 | 2 | 3 | 4 | 5;

export interface TierDefinition {
  readonly tier: Tier;
  readonly name: string;
  /** Inclusive lower bound, in cents. */
  readonly minCents: number;
  /** Inclusive upper bound, in cents. `null` means no upper bound. */
  readonly maxCents: number | null;
}

export const TIERS: readonly TierDefinition[] = [
  { tier: 1, name: "Base", minCents: 25_000, maxCents: 50_000 },
  { tier: 2, name: "Common", minCents: 50_001, maxCents: 150_000 },
  { tier: 3, name: "Uncommon", minCents: 150_001, maxCents: 500_000 },
  { tier: 4, name: "Rare", minCents: 500_001, maxCents: 800_000 },
  { tier: 5, name: "Ultra-Rare", minCents: 800_001, maxCents: null },
];

/** Looks up a tier's definition. Throws on an out-of-range tier number. */
export function tierDefinition(tier: Tier): TierDefinition {
  const def = TIERS.find((candidate) => candidate.tier === tier);
  if (!def) {
    throw new Error(`Unknown tier: ${tier}`);
  }
  return def;
}

/** The display name for a tier, e.g. `tierName(5) -> "Ultra-Rare"`. */
export function tierName(tier: Tier): string {
  return tierDefinition(tier).name;
}

export function tierForValue(fmvCents: number): Tier {
  for (const def of TIERS) {
    if (fmvCents >= def.minCents && (def.maxCents === null || fmvCents <= def.maxCents)) {
      return def.tier;
    }
  }
  throw new Error(`No tier defined for value ${fmvCents}c`);
}

import "server-only";
import { tierDefinition, type Tier } from "./tiers";

/** One tier row of the odds panel: the public tier definition plus its
 * derived probability. */
export interface OddsTierDTO {
  readonly tier: Tier;
  readonly name: string;
  readonly minCents: number;
  readonly maxCents: number | null;
  readonly probabilityBps: number;
}

export interface OddsDTO {
  readonly tiers: readonly OddsTierDTO[];
  readonly averageValueCents: number;
}

/** One machine's weight for one tier, as read off `machineTierWeights`. */
export interface TierWeight {
  readonly tier: Tier;
  readonly weightBps: number;
}

/** The mean FMV of one tier's item pool for one machine, as read off `items`. */
export interface TierValueAggregate {
  readonly tier: Tier;
  readonly averageFmvCents: number;
}

export function computeOdds(
  weights: readonly TierWeight[],
  valueAggregates: readonly TierValueAggregate[],
): OddsDTO {
  const totalWeightBps = weights.reduce((sum, row) => sum + row.weightBps, 0);
  const averageByTier = new Map<Tier, number>(
    valueAggregates.map((row) => [row.tier, row.averageFmvCents]),
  );

  const tiers: OddsTierDTO[] = weights.map((row) => {
    const def = tierDefinition(row.tier);
    return {
      tier: row.tier,
      name: def.name,
      minCents: def.minCents,
      maxCents: def.maxCents,
      probabilityBps: row.weightBps,
    };
  });

  const averageValueCents =
    totalWeightBps === 0
      ? 0
      : Math.round(
          weights.reduce((sum, row) => {
            const averageFmvCents = averageByTier.get(row.tier) ?? 0;
            return sum + (row.weightBps / totalWeightBps) * averageFmvCents;
          }, 0),
        );

  return { tiers, averageValueCents };
}

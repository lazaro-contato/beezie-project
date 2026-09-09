import "server-only";
import { commit, deriveServerSeed, rollStream } from "./fairness";
import { cumulative, drawTier, uniformInt } from "./rng";
import type { Tier } from "./tiers";

export const SWAP_RATE_BPS = 8500; // 85%

/** One item available to be drawn, scoped to a single machine's pool. */
export interface PoolItem {
  readonly itemId: string;
  readonly tier: Tier;
  readonly fmvCents: number;
}

export interface DrawPullInput {
  readonly secret: string;
  readonly userId: string;
  readonly machineId: string;
  readonly nonceIndex: number;
  readonly clientSeed: string;
  readonly quantity: number;
  /** Basis points, index 0 = tier 1 (Base) through index 4 = tier 5 (Ultra-Rare). */
  readonly tierWeights: readonly number[];
  /** The machine's full item pool. Passed in — this module performs no I/O. */
  readonly pool: readonly PoolItem[];
}

export interface DrawnItem {
  readonly drawIndex: number;
  readonly itemId: string;
  readonly tier: Tier;
  readonly rollValue: number;
  readonly fmvCentsAtPull: number;
  readonly swapValueCents: number;
}

export interface DrawPullResult {
  readonly serverSeed: string;
  readonly serverSeedHash: string;
  readonly items: readonly DrawnItem[];
}

/**
 * Composes `rng.ts` and `fairness.ts` into the full draw for one pull. Pure:
 * the item pool is passed in and nothing here touches the database. No
 * caller can pass an arbitrary randomness source into a real draw — the
 * stream is fully determined by `(secret, userId, machineId, nonceIndex,
 * clientSeed)`, which is what makes this the same code path the
 * distribution test exercises.
 *
 * Order per draw: roll a tier from the weight vector, then continue
 * drawing from the same stream to pick uniformly among that tier's pool —
 * the "uniform-within-tier pick" the schema's `(machineId, tier)` index
 * exists to serve.
 */
export function drawPull(input: DrawPullInput): DrawPullResult {
  const serverSeed = deriveServerSeed(
    input.secret,
    input.userId,
    input.machineId,
    input.nonceIndex,
  );
  const serverSeedHash = commit(serverSeed);
  const totalWeight = cumulative(input.tierWeights).at(-1) ?? 0;

  const pooledByTier = new Map<Tier, PoolItem[]>();
  for (const entry of input.pool) {
    const bucket = pooledByTier.get(entry.tier);
    if (bucket) {
      bucket.push(entry);
    } else {
      pooledByTier.set(entry.tier, [entry]);
    }
  }

  const items: DrawnItem[] = [];
  for (let drawIndex = 0; drawIndex < input.quantity; drawIndex++) {
    const source = rollStream(serverSeed, input.clientSeed, drawIndex);
    const rollValue = uniformInt(source, totalWeight);
    const tier = drawTier(input.tierWeights, rollValue) as Tier;

    const candidates = pooledByTier.get(tier);
    if (!candidates || candidates.length === 0) {
      throw new Error(`drawPull: no pool items for tier ${tier}`);
    }
    const pickIndex = uniformInt(source, candidates.length);
    const picked = candidates[pickIndex];

    const fmvCentsAtPull = picked.fmvCents;
    const swapValueCents = Math.round((fmvCentsAtPull * SWAP_RATE_BPS) / 10000);

    items.push({
      drawIndex,
      itemId: picked.itemId,
      tier,
      rollValue,
      fmvCentsAtPull,
      swapValueCents,
    });
  }

  return { serverSeed, serverSeedHash, items };
}

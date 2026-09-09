import "server-only";

/**
 * Yields the next uint32 word from some deterministic stream. `lib/pull/
 * fairness.ts`'s `rollStream` is the only production implementation; nothing
 * in this file knows or cares where the words come from.
 */
export type Uint32Source = () => number;

const UINT32_SPACE = 0x100000000; // 2^32

/**
 * Draws a uniformly distributed integer in `[0, max)` from `source`, using
 * rejection sampling.
 *
 * A plain `word % max` is biased whenever `max` does not evenly divide
 * 2^32 — the words that land in the short final partial cycle make the low
 * remainders very slightly more likely than the high ones. Rejecting any
 * word at or above the largest multiple of `max` that is `<= 2^32` removes
 * that bias entirely, at the cost of an unbounded (but geometrically
 * decaying, and here vanishingly rare) number of extra draws.
 */
export function uniformInt(source: Uint32Source, max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new Error(`uniformInt: max must be a positive integer, got ${max}`);
  }
  if (max === 1) {
    return 0;
  }

  const limit = Math.floor(UINT32_SPACE / max) * max;
  let word = source();
  while (word >= limit) {
    word = source();
  }
  return word % max;
}

/**
 * Running totals of a weight vector, e.g. `[72, 19, 348] -> [72, 91, 439]`.
 * The last entry is the sum of all weights.
 */
export function cumulative(weights: readonly number[]): number[] {
  const out: number[] = [];
  let sum = 0;
  for (const weight of weights) {
    sum += weight;
    out.push(sum);
  }
  return out;
}

/**
 * Maps an already-drawn integer `roll` in `[0, sum(weights))` to a 1-indexed
 * tier — the position of the weight bucket `roll` falls into. Pure: this
 * function takes no randomness source at all, only a weight vector and a
 * value already drawn from it, which is what keeps it independently
 * testable from where that value came from.
 */
export function drawTier(weights: readonly number[], roll: number): number {
  const cumulativeWeights = cumulative(weights);
  const total = cumulativeWeights.at(-1) ?? 0;
  if (!Number.isInteger(roll) || roll < 0 || roll >= total) {
    throw new Error(`drawTier: roll ${roll} out of range for total weight ${total}`);
  }
  for (let index = 0; index < cumulativeWeights.length; index++) {
    if (roll < cumulativeWeights[index]) {
      return index + 1;
    }
  }
  // Unreachable given the range check above.
  throw new Error(`drawTier: roll ${roll} did not match any tier`);
}
